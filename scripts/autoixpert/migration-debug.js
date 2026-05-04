// scripts/autoixpert/migration-debug.js
// ─────────────────────────────────────────────────────────────────────────────
// Migration Debug Yardımcısı
//
// Toplu upsert'lerde çıkan 400 / 409 hatalarının kök nedenini bulur:
//   • Toplu upsert yerine kayıt-bazlı dener
//   • Her hata için: kayıt #, hangi kolon, hangi PostgREST/Postgres code
//   • information_schema.columns'tan tablo şemasını çekip payload kolonlarıyla karşılaştırır
//   • 23505 (duplicate) tespitinde mevcut DB satırıyla diff üretir
//   • Sonuçları debug-report.json'a yazar + konsola özet basar
//
// KULLANIM:
//   import { debugUpsert, fetchTableSchema, buildSchemaDiff } from './migration-debug.js';
//
//   const report = await debugUpsert(supabase, 'autoixpert_reports', rows, {
//     onConflict: 'id',
//     primaryKey: 'id',
//     reportPath: './debug-report.json',
//   });
//
//   if (report.summary.failed > 0) process.exit(1);
//
// CLI olarak:
//   node --env-file=.env.local scripts/autoixpert/migration-debug.js \
//        --table=autoixpert_reports --input=./payload.json --on-conflict=id
// ─────────────────────────────────────────────────────────────────────────────

import { writeFile, readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// ── 1) Şema çekimi ──────────────────────────────────────────────────────────

/**
 * information_schema.columns üzerinden tablo şemasını çeker.
 * Supabase REST üzerinden information_schema okumak kapalı olduğundan,
 * burada bir RPC fonksiyonuna güveniyoruz: public.debug_table_schema(table_name).
 * Eğer RPC yoksa fallback olarak boş bir SELECT ile kolon adlarını çıkarırız.
 */
export async function fetchTableSchema(supabase, table) {
  // 1) Önce RPC dene (önerilen — bkz. migration aşağıda)
  const { data: rpcData, error: rpcErr } = await supabase.rpc('debug_table_schema', {
    p_table: table,
  });
  if (!rpcErr && Array.isArray(rpcData)) {
    return rpcData.map((r) => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === 'YES',
      default: r.column_default,
    }));
  }

  // 2) Fallback: 0 satır SELECT — yalnız kolon adları
  const { data, error } = await supabase.from(table).select('*').limit(0);
  if (error) {
    throw new Error(`fetchTableSchema(${table}) başarısız: ${error.message}`);
  }
  // Boş cevaptan kolon çıkaramıyoruz; sadece adları, tip bilgisiz döndür.
  // Kullanıcıya RPC'yi yüklemesini öner.
  return null;
}

// ── 2) Şema diff ────────────────────────────────────────────────────────────

/**
 * Payload kolonları ile tablo kolonları arasında diff üretir.
 * @returns {{ extra: string[], missingRequired: string[], known: string[] }}
 */
export function buildSchemaDiff(payload, schema) {
  if (!schema) return { extra: [], missingRequired: [], known: [], schemaUnknown: true };

  const cols = new Set(schema.map((c) => c.name));
  const required = schema
    .filter((c) => !c.nullable && c.default == null && c.name !== 'id')
    .map((c) => c.name);

  const payloadKeys = Object.keys(payload || {});
  const extra = payloadKeys.filter((k) => !cols.has(k));
  const missingRequired = required.filter(
    (k) => !(k in (payload || {})) || payload[k] == null,
  );
  const known = payloadKeys.filter((k) => cols.has(k));

  return { extra, missingRequired, known };
}

// ── 3) Bilinmeyen kolonları payload'tan strip et ────────────────────────────

export function stripUnknownColumns(payload, schema) {
  if (!schema || !payload) return payload;
  const cols = new Set(schema.map((c) => c.name));
  const out = {};
  for (const k of Object.keys(payload)) {
    if (cols.has(k)) out[k] = payload[k];
  }
  return out;
}

// ── 4) Duplicate diff ───────────────────────────────────────────────────────

async function diffWithExistingRow(supabase, table, payload, primaryKey) {
  const id = payload[primaryKey];
  if (id == null) return { skipped: 'no primary key in payload' };

  const { data, error } = await supabase.from(table).select('*').eq(primaryKey, id).maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { existing: null };

  const diff = {};
  for (const k of Object.keys(payload)) {
    if (JSON.stringify(payload[k]) !== JSON.stringify(data[k])) {
      diff[k] = { incoming: payload[k], existing: data[k] };
    }
  }
  return { existing: data, diff };
}

// ── 5) Postgres / PostgREST kod sınıflandırması ────────────────────────────

function classifyError(err) {
  if (!err) return { kind: 'unknown' };
  const code = err.code || '';
  // PostgREST kodları
  if (code === 'PGRST204') return { kind: 'schema_column_missing', http: 400 };
  if (code === 'PGRST116') return { kind: 'no_rows_returned', http: 406 };
  // Postgres kodları
  if (code === '23505') return { kind: 'duplicate_key', http: 409 };
  if (code === '23502') return { kind: 'not_null_violation', http: 400 };
  if (code === '23503') return { kind: 'foreign_key_violation', http: 409 };
  if (code === '23514') return { kind: 'check_violation', http: 400 };
  if (code === '22P02') return { kind: 'invalid_text_representation', http: 400 };
  if (code === '42703') return { kind: 'undefined_column', http: 400 };
  if (code === '42P01') return { kind: 'undefined_table', http: 400 };
  return { kind: 'other', http: err.status || null };
}

// ── 6) Ana fonksiyon: kayıt-bazlı debug upsert ──────────────────────────────

/**
 * Toplu upsert yerine her kaydı tek tek dener ve detaylı rapor üretir.
 *
 * @param {object} supabase - Supabase service-role client
 * @param {string} table
 * @param {Array<object>} rows
 * @param {object} opts
 * @param {string} [opts.onConflict='id']
 * @param {string} [opts.primaryKey='id']
 * @param {string} [opts.reportPath='./debug-report.json']
 * @param {boolean} [opts.stripUnknown=true]   // şemada olmayan kolonları otomatik strip
 * @param {boolean} [opts.stopOnFirst=false]
 */
export async function debugUpsert(supabase, table, rows, opts = {}) {
  const {
    onConflict = 'id',
    primaryKey = 'id',
    reportPath = './debug-report.json',
    stripUnknown = true,
    stopOnFirst = false,
  } = opts;

  const startedAt = new Date().toISOString();
  const schema = await fetchTableSchema(supabase, table);
  const schemaUnknown = !schema;

  const report = {
    table,
    startedAt,
    finishedAt: null,
    onConflict,
    primaryKey,
    schemaUnknown,
    schemaColumns: schema ? schema.map((c) => c.name) : null,
    summary: { total: rows.length, ok: 0, failed: 0 },
    errorsByKind: {},
    failures: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const original = rows[i];
    const diff = buildSchemaDiff(original, schema);
    const payload = stripUnknown && schema ? stripUnknownColumns(original, schema) : original;

    const { error } = await supabase.from(table).upsert(payload, { onConflict });

    if (!error) {
      report.summary.ok += 1;
      continue;
    }

    const cls = classifyError(error);
    report.summary.failed += 1;
    report.errorsByKind[cls.kind] = (report.errorsByKind[cls.kind] || 0) + 1;

    const failure = {
      index: i,
      primaryKeyValue: original?.[primaryKey] ?? null,
      classification: cls,
      error: {
        message: error.message,
        details: error.details || null,
        hint: error.hint || null,
        code: error.code || null,
      },
      schemaDiff: diff,
      payloadKeys: Object.keys(original || {}),
    };

    // 23505 → mevcut satırla diff
    if (cls.kind === 'duplicate_key') {
      failure.duplicate = await diffWithExistingRow(supabase, table, original, primaryKey);
    }

    // 23503 → hangi FK?
    if (cls.kind === 'foreign_key_violation') {
      // error.details ör: 'Key (customer_id)=(uuid) is not present in table "customers".'
      const m = /Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/.exec(
        error.details || '',
      );
      if (m) failure.fk = { column: m[1], value: m[2], referencedTable: m[3] };
    }

    report.failures.push(failure);
    if (stopOnFirst) break;
  }

  report.finishedAt = new Date().toISOString();

  if (reportPath) {
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  printSummary(report);
  return report;
}

// ── 7) Konsol özeti ─────────────────────────────────────────────────────────

function printSummary(r) {
  const line = '─'.repeat(72);
  console.log('\n' + line);
  console.log(`Migration Debug — ${r.table}`);
  console.log(line);
  console.log(`Toplam : ${r.summary.total}`);
  console.log(`Başarı : ${r.summary.ok}`);
  console.log(`Hata   : ${r.summary.failed}`);
  if (r.schemaUnknown) {
    console.log('⚠  Şema RPC çekilemedi — `debug_table_schema` fonksiyonunu DB\'ye yükleyin.');
  }
  if (r.summary.failed > 0) {
    console.log('\nHata türleri:');
    for (const [k, v] of Object.entries(r.errorsByKind)) {
      console.log(`  ${k.padEnd(32)} : ${v}`);
    }
    console.log('\nİlk 5 hata:');
    for (const f of r.failures.slice(0, 5)) {
      console.log(
        `  #${f.index} pk=${f.primaryKeyValue} [${f.classification.kind}] ${f.error.code || ''} ${f.error.message}`,
      );
      if (f.schemaDiff?.extra?.length) {
        console.log(`     extra cols  : ${f.schemaDiff.extra.join(', ')}`);
      }
      if (f.schemaDiff?.missingRequired?.length) {
        console.log(`     missing NN  : ${f.schemaDiff.missingRequired.join(', ')}`);
      }
      if (f.duplicate?.diff) {
        console.log(`     diff fields : ${Object.keys(f.duplicate.diff).join(', ')}`);
      }
      if (f.fk) {
        console.log(`     FK violation: ${f.fk.column}=${f.fk.value} → ${f.fk.referencedTable}`);
      }
    }
    console.log(`\nTam rapor: debug-report.json`);
  }
  console.log(line + '\n');
}

// ── 8) CLI ──────────────────────────────────────────────────────────────────

async function cli() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
  );
  const table = args.table;
  const inputPath = args.input;
  if (!table || !inputPath) {
    console.error('Kullanım: node migration-debug.js --table=<t> --input=<json> [--on-conflict=id] [--pk=id]');
    process.exit(2);
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env vars zorunlu.');
    process.exit(2);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rows = JSON.parse(await readFile(inputPath, 'utf8'));
  if (!Array.isArray(rows)) {
    console.error('Input JSON bir array olmalı.');
    process.exit(2);
  }
  const report = await debugUpsert(supabase, table, rows, {
    onConflict: args['on-conflict'] || 'id',
    primaryKey: args.pk || 'id',
    reportPath: args.out || './debug-report.json',
    stripUnknown: args['no-strip'] !== true,
    stopOnFirst: args['stop-on-first'] === true,
  });
  process.exit(report.summary.failed === 0 ? 0 : 1);
}

// import.meta.url === main koşulu (Node 20+)
const isMain = import.meta.url === `file://${process.argv[1]}` ||
               import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/'));
if (isMain) {
  cli().catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
  });
}
