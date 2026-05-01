// AutoiXpert Invoices (Rechnungen) — list + row mapping.
// API is read-only (no POST/PUT/PATCH/DELETE).
// Ref: docs/autoixpert-api/raw/05-rechnungen.md

import { paginate } from './pagination.js';

// Invoices list endpoint: default 10, max 20
export const INVOICES_PAGE_LIMIT = 20;

export function paginateInvoices(client, { filters, startCursor, onPage } = {}) {
  // Invoices always sorted by created_at server-side.
  return paginate(client, '/invoices', {
    arrayKey: 'invoices',
    filters: { ...filters },
    limit: INVOICES_PAGE_LIMIT,
    startCursor,
    onPage,
  });
}

/**
 * Maps an AutoiXpert invoice record into a row for `autoixpert_invoices`.
 * Returns the row plus the report linkage IDs for the junction table.
 */
export function mapInvoiceToRow(record) {
  const reportIds = Array.isArray(record.report_ids) ? record.report_ids.filter(Boolean) : [];

  const row = {
    id: record.id,

    number: record.number ?? null,
    created_at: record.created_at,
    date: record.date ?? null,
    date_of_supply: record.date_of_supply ?? null,

    vat_rate: nullableNumber(record.vat_rate),
    total_net: nullableNumber(record.total_net),
    total_gross: nullableNumber(record.total_gross),

    due_date: record.due_date ?? null,
    days_until_due: nullableNumber(record.days_until_due),
    has_outstanding_payments: nullableBool(record.has_outstanding_payments),
    current_unpaid_amount: nullableNumber(record.current_unpaid_amount),

    is_fully_canceled: Boolean(record.is_fully_canceled),
    ids_of_cancellation_invoices: Array.isArray(record.ids_of_cancellation_invoices)
      ? record.ids_of_cancellation_invoices
      : null,
    cancels_invoice_id: record.cancels_invoice_id ?? null,
    is_electronic_invoice_enabled: Boolean(record.is_electronic_invoice_enabled),

    location_id: record.location_id ?? null,

    recipient: record.recipient ?? null,
    line_items: record.line_items ?? null,
    payments: record.payments ?? null,
    short_payments: record.short_payments ?? null,
    partial_cancellations: record.partial_cancellations ?? null,
    documents: record.documents ?? null,

    external_updated_at: record.updated_at ?? null,
    synced_at: new Date().toISOString(),
    raw_payload: record,
  };

  return { row, reportIds };
}

function nullableBool(v) {
  if (v === true || v === false) return v;
  return null;
}

function nullableNumber(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
