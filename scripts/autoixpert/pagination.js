// Cursor pagination iterator for AutoiXpert list endpoints.
//
// AutoiXpert uses `starting_after` cursor + `has_more` + `next_page` response.
// Sort/filter MUST stay constant across pages within one iteration — changing
// them invalidates the cursor (server returns error).
//
// Ref: docs/autoixpert-api/raw/03-pagination.md

/**
 * Async generator yielding pages from a list endpoint.
 *
 * @param {Object} client - AutoiXpert client with .get()
 * @param {string} path - Endpoint path (e.g., '/reports')
 * @param {Object} options
 * @param {string} options.arrayKey - Response field that holds the array (e.g., 'reports', 'contacts', 'invoices')
 * @param {Object} [options.filters] - Endpoint-specific filters (sort, sort_direction, is_done, etc.)
 * @param {number} [options.limit] - Page size (clamped to endpoint max by server)
 * @param {string} [options.startCursor] - Resume from this `starting_after` value
 * @param {(page: {records: any[], cursorBefore: string|null, cursorAfter: string|null}) => Promise<void>} [options.onPage] - Optional async callback per page
 *
 * @yields {{records: any[], cursorBefore: string|null, cursorAfter: string|null, hasMore: boolean}}
 */
export async function* paginate(client, path, {
  arrayKey,
  filters = {},
  limit,
  startCursor = null,
  onPage,
} = {}) {
  if (!arrayKey) throw new Error('paginate: arrayKey is required');

  let cursor = startCursor;

  while (true) {
    const query = { ...filters };
    if (limit !== undefined) query.limit = limit;
    if (cursor) query.starting_after = cursor;

    const res = await client.get(path, query);

    // Defensive: doc shows `contacts` array key in a `/reports` example (copy-paste bug).
    // Prefer the explicit arrayKey, fall back to first array property.
    let records = res?.[arrayKey];
    if (!Array.isArray(records)) {
      const firstArrayValue = Object.values(res || {}).find(Array.isArray);
      records = Array.isArray(firstArrayValue) ? firstArrayValue : [];
    }

    const hasMore = Boolean(res?.has_more);
    const cursorAfter = hasMore ? (res?.next_page ?? null) : null;

    const page = {
      records,
      cursorBefore: cursor,
      cursorAfter,
      hasMore,
    };

    if (onPage) await onPage(page);
    yield page;

    if (!hasMore || !cursorAfter) return;
    cursor = cursorAfter;
  }
}
