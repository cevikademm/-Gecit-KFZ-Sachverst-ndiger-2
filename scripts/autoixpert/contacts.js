// AutoiXpert Contacts (Kontakte) — list + row mapping.
// Ref: docs/autoixpert-api/raw/04-kontakte.md

import { paginate } from './pagination.js';

// Contacts list endpoint: default 50, max 100
export const CONTACTS_PAGE_LIMIT = 100;

export function paginateContacts(client, { filters, startCursor, onPage } = {}) {
  // Note: contacts always sorted by created_at server-side. `sort` param ignored.
  return paginate(client, '/contacts', {
    arrayKey: 'contacts',
    filters: { ...filters },
    limit: CONTACTS_PAGE_LIMIT,
    startCursor,
    onPage,
  });
}

/**
 * Maps an AutoiXpert contact record into a row matching `autoixpert_contacts` schema.
 */
export function mapContactToRow(record) {
  return {
    id: record.id,
    external_id: record.external_id ?? null,

    organization_type: record.organization_type,
    salutation: record.salutation ?? null,
    first_name: record.first_name ?? null,
    last_name: record.last_name ?? null,
    organization_name: record.organization_name ?? null,
    email: record.email ?? null,
    phone: record.phone ?? null,
    phone2: record.phone2 ?? null,
    street_and_housenumber_or_lockbox: record.street_and_housenumber_or_lockbox ?? null,
    zip: record.zip ?? null,
    city: record.city ?? null,
    notes: record.notes ?? null,
    may_deduct_taxes: nullableBool(record.may_deduct_taxes),
    vat_id: record.vat_id ?? null,
    debtor_number: record.debtor_number ?? null,

    garage_fee_sets: record.garage_fee_sets ?? null,

    created_at: record.created_at,

    external_updated_at: record.updated_at ?? null,
    last_seen_at: new Date().toISOString(),
    synced_at: new Date().toISOString(),
    raw_payload: record,
  };
}

function nullableBool(v) {
  if (v === true || v === false) return v;
  return null;
}
