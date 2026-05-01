// Supabase UPSERT helpers for autoixpert_* tables.
// All UPSERTs key on `id` (AutoiXpert internal ID).
// Service role client required (RLS bypass).

const UPSERT_BATCH_SIZE = 100;

async function upsertBatched(supabase, table, rows, onConflict = 'id') {
  if (rows.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error, count } = await supabase
      .from(table)
      .upsert(chunk, { onConflict, count: 'exact' });
    if (error) {
      throw new Error(`Supabase upsert ${table} failed: ${error.message} (chunk ${i}-${i + chunk.length})`);
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
 * For each invoice, the existing junction rows are replaced atomically per invoice
 * (delete then insert). This keeps the junction in sync if an invoice's report links change.
 *
 * @param {object} supabase - Supabase service-role client
 * @param {Array<{row: object, reportIds: string[]}>} mapped
 */
export async function upsertInvoicesWithLinks(supabase, mapped) {
  if (mapped.length === 0) return { invoices: 0, links: 0 };

  const rows = mapped.map((m) => m.row);
  const invoiceCount = await upsertBatched(supabase, 'autoixpert_invoices', rows);

  // Rebuild junction: delete old links for these invoices, insert new.
  const invoiceIds = mapped.map((m) => m.row.id);
  const { error: delErr } = await supabase
    .from('autoixpert_invoice_reports')
    .delete()
    .in('invoice_id', invoiceIds);
  if (delErr) {
    throw new Error(`Supabase delete junction failed: ${delErr.message}`);
  }

  const links = mapped.flatMap((m) =>
    m.reportIds.map((rid) => ({ invoice_id: m.row.id, report_id: rid })),
  );
  let linkCount = 0;
  if (links.length > 0) {
    for (let i = 0; i < links.length; i += UPSERT_BATCH_SIZE) {
      const chunk = links.slice(i, i + UPSERT_BATCH_SIZE);
      const { error, count } = await supabase
        .from('autoixpert_invoice_reports')
        .insert(chunk, { count: 'exact' });
      if (error) {
        throw new Error(`Supabase insert junction failed: ${error.message}`);
      }
      linkCount += count ?? chunk.length;
    }
  }

  return { invoices: invoiceCount, links: linkCount };
}
