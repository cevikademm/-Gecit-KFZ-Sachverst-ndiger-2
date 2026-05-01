// Sync run lifecycle helpers: write progress to `autoixpert_sync_log`.
// Each page imported produces one log row (resource, run_id, cursor_before/after, count).
// On failure, the last successful row's cursor_after is the resume point.

import { randomUUID } from 'node:crypto';

/**
 * Starts a new sync run and returns identifiers used by recordPage / finishRun.
 */
export function startRun({ resource, filters }) {
  return {
    runId: randomUUID(),
    resource,
    filters: filters ?? null,
    cumulativeCount: 0,
    pageNumber: 0,
  };
}

/**
 * Logs one paginated page's outcome.
 * Called after a page is successfully fetched + upserted.
 */
export async function recordPage(supabase, run, {
  cursorBefore,
  cursorAfter,
  pageCount,
}) {
  run.pageNumber += 1;
  run.cumulativeCount += pageCount;
  const row = {
    resource: run.resource,
    run_id: run.runId,
    status: cursorAfter === null ? 'success' : 'running',
    cursor_before: cursorBefore,
    cursor_after: cursorAfter,
    page_count: pageCount,
    cumulative_count: run.cumulativeCount,
    filters: run.filters,
    started_at: new Date().toISOString(),
    finished_at: cursorAfter === null ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('autoixpert_sync_log').insert(row);
  if (error) {
    // Don't crash the run for log failures; just warn.
    console.warn(`[checkpoint] failed to log page: ${error.message}`);
  }
}

/**
 * Records a terminal failure for the run.
 */
export async function recordFailure(supabase, run, { cursorBefore, error }) {
  const row = {
    resource: run.resource,
    run_id: run.runId,
    status: 'failed',
    cursor_before: cursorBefore ?? null,
    cursor_after: null,
    page_count: 0,
    cumulative_count: run.cumulativeCount,
    filters: run.filters,
    error_code: error?.errorCode ?? error?.code ?? null,
    error_message: error?.message ?? String(error),
    error_details: error?.errorDetails ?? null,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  };
  const { error: dbErr } = await supabase.from('autoixpert_sync_log').insert(row);
  if (dbErr) {
    console.warn(`[checkpoint] failed to log failure: ${dbErr.message}`);
  }
}

/**
 * Finds the resume cursor for a resource: the last `running` log row's cursor_after,
 * provided the latest run for that resource hasn't completed (no `success` row with cursor_after=null).
 *
 * Returns null if there's no incomplete run to resume.
 */
export async function findResumeCursor(supabase, resource) {
  const { data, error } = await supabase
    .from('autoixpert_sync_log')
    .select('run_id, status, cursor_after, started_at')
    .eq('resource', resource)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn(`[checkpoint] resume lookup failed: ${error.message}`);
    return null;
  }
  if (!data || data.length === 0) return null;

  // Latest log entry: if it's success-with-no-cursor, the run completed.
  const latest = data[0];
  if (latest.status === 'success' && latest.cursor_after === null) return null;
  if (latest.status === 'failed') {
    // Find the last running entry within the failed run to resume from.
    const runId = latest.run_id;
    const lastRunning = data.find((r) => r.run_id === runId && r.status === 'running' && r.cursor_after);
    return lastRunning?.cursor_after ?? null;
  }
  // status === 'running' (interrupted mid-run)
  return latest.cursor_after ?? null;
}
