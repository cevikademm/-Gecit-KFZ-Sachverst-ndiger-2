// AutoiXpert Reports (Gutachten) — list + row mapping.
// Ref: docs/autoixpert-api/raw/01-gutachten.md

import { paginate } from './pagination.js';

// Reports list endpoint: max limit = 10
export const REPORTS_PAGE_LIMIT = 10;

export function paginateReports(client, { filters, startCursor, onPage } = {}) {
  return paginate(client, '/reports', {
    arrayKey: 'reports',
    filters: { sort: 'created_at', sort_direction: 'asc', ...filters },
    limit: REPORTS_PAGE_LIMIT,
    startCursor,
    onPage,
  });
}

/**
 * Maps an AutoiXpert report record into a row matching `autoixpert_reports` schema.
 * Top-level scalar fields are extracted to dedicated columns; sub-objects stay JSONB.
 * The full record is preserved in `raw_payload`.
 */
export function mapReportToRow(record) {
  return {
    id: record.id,
    external_id: record.external_id ?? null,

    type: record.type,
    state: record.state,
    token: record.token ?? null,

    completion_date: record.completion_date ?? null,
    order_date: record.order_date ?? null,
    order_time: record.order_time ?? null,
    created_at: record.created_at,

    responsible_assessor_id: record.responsible_assessor_id ?? null,
    location_id: record.location_id ?? null,
    use_factoring: nullableBool(record.use_factoring),
    use_dekra_fees: nullableBool(record.use_dekra_fees),
    vin_was_checked: nullableBool(record.vin_was_checked),
    source_of_technical_data: record.source_of_technical_data ?? null,
    test_drive_carried_out: nullableBool(record.test_drive_carried_out),

    claimant: record.claimant ?? null,
    owner_of_claimants_car: record.owner_of_claimants_car ?? null,
    intermediary: record.intermediary ?? null,
    lawyer: record.lawyer ?? null,
    author_of_damage: record.author_of_damage ?? null,
    owner_of_author_of_damages_car: record.owner_of_author_of_damages_car ?? null,
    insurance: record.insurance ?? null,
    garage: record.garage ?? null,

    car: record.car ?? null,
    accident: record.accident ?? null,
    damage: record.damage ?? null,
    lease_return: record.lease_return ?? null,

    paint_thickness_measurements: record.paint_thickness_measurements ?? null,
    paint_thickness_measurement_comment: record.paint_thickness_measurement_comment ?? null,
    paint_thickness_selected_scale_id: record.paint_thickness_selected_scale_id ?? null,

    labels: record.labels ?? null,
    custom_fields: record.custom_fields ?? null,

    external_updated_at: record.updated_at ?? null,
    synced_at: new Date().toISOString(),
    raw_payload: record,
  };
}

function nullableBool(v) {
  if (v === true || v === false) return v;
  return null;
}
