// Supabase UPSERT helpers for autoixpert_* tables.
// All UPSERTs key on `id` (AutoiXpert internal ID).
// Service role client required (RLS bypass).

import {
  fetchTableSchema,
  stripUnknownColumns,
  debugUpsert,
} from './migration-debug.js';

const UPSERT_BATCH_SIZE = 100;

// Şema cache — aynı tablo için tek seferde çekilir.
const _schemaCache = new Map();

async function getSchemaCached(supabase, table) {
  if (_schemaCache.has(table)) return _schemaCache.get(table);
  let schema = null;
  try {
    schema = await fetchTableSchema(supabase, table);
  } catch (e) {
    console.warn(`[upsert] ${table} şema çekilemedi: ${e.message}`);
  }
  _schemaCache.set(table, schema);
  return schema;
}

async function upsertBatched(supabase, table, rows, onConflict = 'id') {
  if (rows.length === 0) return 0;

  // Şema bilgisi varsa, payload'taki bilinmeyen kolonları öne strip et.
  const schema = await getSchemaCached(supabase, table);
  const cleanRows = schema
    ? rows.map((r) => stripUnknownColumns(r, schema))
    : rows;
  if (schema) {
    const droppedKeys = new Set();
    for (let i = 0; i < rows.length; i++) {
      for (const k of Object.keys(rows[i] || {})) {
        if (!(k in cleanRows[i])) droppedKeys.add(k);
      }
    }
    if (droppedKeys.size > 0) {
      console.warn(
        `[upsert] ${table}: bilinmeyen kolonlar strip edildi → ${[...droppedKeys].join(', ')}`,
      );
    }
  }

  let total = 0;
  for (let i = 0; i < cleanRows.length; i += UPSERT_BATCH_SIZE) {
    const chunk = cleanRows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error, count } = await supabase
      .from(table)
      .upsert(chunk, { onConflict, count: 'exact' });
    if (error) {
      console.error(
        `[upsert] ${table} chunk ${i}-${i + chunk.length} HATA: ${error.code || ''} ${error.message}`,
      );
      console.error('[upsert] debugUpsert ile kayıt-bazlı tanı çalışıyor…');
      // Hatalı chunk üzerinde detaylı tanı raporu üret.
      const reportPath = `./debug-report-${table}-${Date.now()}.json`;
      try {
        await debugUpsert(supabase, table, chunk, {
          onConflict,
          primaryKey: typeof onConflict === 'string' ? onConflict.split(',')[0].trim() : 'id',
          reportPath,
          stripUnknown: true,
          stopOnFirst: false,
        });
        console.error(`[upsert] Tam tanı raporu: ${reportPath}`);
      } catch (debugErr) {
        console.error(`[upsert] debugUpsert başarısız: ${debugErr.message}`);
      }
      throw new Error(
        `Supabase upsert ${table} failed: ${error.message} (chunk ${i}-${i + chunk.length}) — bkz. ${reportPath}`,
      );
    }
    total += count ?? chunk.length;
  }
  return total;
}

export async function upsertReports(supabase, rows) {
  return upsertBatched(supabase, 'autoixpert_reports', rows);
}

export async function upsertContacts(supabase, rows) {
  return upsertBatched(supabase, 'autoixpert_contacts', rows);
}

/**
 * Upserts invoices and rebuilds the invoice→reports junction.
 *
 * Junction rebuild ATOMIK: tercihen `rebuild_junction_atomic` RPC'si tek
 * transaction içinde DELETE+INSERT yapar. RPC yoksa eski iki adımlı yola
 * fallback olur ama net log basar (junction yarım kalma riski göstergesi).
 *
 * @param {object} supabase - Supabase service-role client
 * @param {Array<{row: object, reportIds: string[]}>} mapped
 */
export async function upsertInvoicesWithLinks(supabase, mapped) {
  if (mapped.length === 0) return { invoices: 0, links: 0 };

  const rows = mapped.map((m) => m.row);
  const invoiceCount = await upsertBatched(supabase, 'autoixpert_invoices', rows);

  const invoiceIds = mapped.map((m) => m.row.id);
  const links = mapped.flatMap((m) =>
    m.reportIds.map((rid) => ({ invoice_id: m.row.id, report_id: rid })),
  );

  // ── Yol 1: Atomik RPC (tercih edilen) ────────────────────────────────────
  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    'rebuild_junction_atomic',
    {
      p_invoice_ids: invoiceIds,
      p_links: links,
    },
  );

  if (!rpcErr) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const inserted = Number(row?.inserted ?? links.length);
    return { invoices: invoiceCount, links: inserted };
  }

  // RPC yoksa (42883/PGRST202) → eski iki adımlı yola fallback.
  const isMissingRpc =
    rpcErr.code === '42883' ||
    rpcErr.code === 'PGRST202' ||
    /could not find the function|function .* does not exist/i.test(rpcErr.message || '');

  if (!isMissingRpc) {
    throw new Error(`rebuild_junction_atomic RPC hata: ${rpcErr.code || ''} ${rpcErr.message}`);
  }

  console.warn(
    '[upsert] rebuild_junction_atomic RPC bulunamadı — non-atomic fallback. ' +
      'supabase_migration_debug_helpers.sql çalıştırın.',
  );

  // ── Yol 2: Fallback — try/catch ile rollback uyarısı ─────────────────────
  let deletedOk = false;
  try {
    const { error: delErr } = await supabase
      .from('autoixpert_invoice_reports')
      .delete()
      .in('invoice_id', invoiceIds);
    if (delErr) throw new Error(`junction DELETE hata: ${delErr.message}`);
    deletedOk = true;

    let linkCount = 0;
    if (links.length > 0) {
      for (let i = 0; i < links.length; i += UPSERT_BATCH_SIZE) {
        const chunk = links.slice(i, i + UPSERT_BATCH_SIZE);
        const { error, count } = await supabase
          .from('autoixpert_invoice_reports')
          .insert(chunk, { count: 'exact' });
        if (error) throw new Error(`junction INSERT hata (chunk ${i}): ${error.message}`);
        linkCount += count ?? chunk.length;
      }
    }
    return { invoices: invoiceCount, links: linkCount };
  } catch (e) {
    if (deletedOk) {
      console.error(
        '[upsert] KRİTİK: junction DELETE başarılı oldu ama INSERT patladı — ' +
          'invoice_ids=' + JSON.stringify(invoiceIds) + '. ' +
          'Veri yarım kalmış olabilir; RPC\'yi kurup yeniden deneyin.',
      );
    }
    throw e;
  }
}
