#!/usr/bin/env node
// AutoiXpert → Supabase mirror — main import entry point.
//
// Usage:
//   node --env-file=.env.local scripts/autoixpert/import-all.js
//
// Or, if Node < 20.6, load env yourself first:
//   export $(grep -v '^#' .env.local | xargs) && node scripts/autoixpert/import-all.js
//
// Env vars (see .env.example):
//   AUTOIXPERT_API_KEY            (required)
//   AUTOIXPERT_API_BASE_URL       (default: https://app.autoixpert.de/externalApi/v1)
//   AUTOIXPERT_REQUEST_DELAY_MS   (default: 200)
//   AUTOIXPERT_MAX_RETRIES        (default: 4)
//   AUTOIXPERT_RESOURCES          (default: reports,contacts,invoices)
//   SUPABASE_URL                  (required)
//   SUPABASE_SERVICE_ROLE_KEY     (required — RLS bypass)
//
// CLI flags:
//   --only=reports|contacts|invoices    Override AUTOIXPERT_RESOURCES
//   --resume                            Resume from last incomplete run's cursor
//   --dry-run                           Don't write to Supabase (still calls API)

import { createClient } from '@supabase/supabase-js';
import { createAutoixpertClient, AutoiXpertError } from './client.js';
import { paginateReports, mapReportToRow } from './reports.js';
import { paginateContacts, mapContactToRow } from './contacts.js';
import { paginateInvoices, mapInvoiceToRow } from './invoices.js';
import { upsertReports, upsertContacts, upsertInvoicesWithLinks } from './upsert.js';
import { startRun, recordPage, recordFailure, findResumeCursor } from './checkpoint.js';

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const args = { only: null, resume: false, dryRun: false };
  for (const arg of argv) {
    if (arg.startsWith('--only=')) args.only = arg.slice('--only='.length);
    else if (arg === '--resume') args.resume = true;
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`✗ Missing required env var: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const apiKey = requireEnv('AUTOIXPERT_API_KEY');
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const baseUrl = process.env.AUTOIXPERT_API_BASE_URL || 'https://app.autoixpert.de/externalApi/v1';
  const requestDelayMs = Number(process.env.AUTOIXPERT_REQUEST_DELAY_MS || 200);
  const maxRetries = Number(process.env.AUTOIXPERT_MAX_RETRIES || 4);

  const resources = (ARGS.only || process.env.AUTOIXPERT_RESOURCES || 'reports,contacts,invoices')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowed = new Set(['reports', 'contacts', 'invoices']);
  for (const r of resources) {
    if (!allowed.has(r)) {
      console.error(`✗ Unknown resource: ${r}. Allowed: reports, contacts, invoices`);
      process.exit(1);
    }
  }

  const client = createAutoixpertClient({ baseUrl, apiKey, requestDelayMs, maxRetries });
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('━'.repeat(60));
  console.log('AutoiXpert → Supabase import');
  console.log('━'.repeat(60));
  console.log(`Base URL  : ${baseUrl}`);
  console.log(`Resources : ${resources.join(', ')}`);
  console.log(`Resume    : ${ARGS.resume ? 'yes' : 'no (full sync)'}`);
  console.log(`Dry run   : ${ARGS.dryRun ? 'YES (no Supabase writes)' : 'no'}`);
  console.log('━'.repeat(60));

  let totalErrors = 0;

  for (const resource of resources) {
    console.log(`\n▶ ${resource}`);
    try {
      const startCursor = ARGS.resume ? await findResumeCursor(supabase, resource) : null;
      if (ARGS.resume && startCursor) {
        console.log(`  resuming from cursor: ${startCursor.slice(0, 20)}…`);
      }
      const count = await runResource(resource, { client, supabase, startCursor });
      console.log(`  ✓ ${count} records imported`);
    } catch (err) {
      totalErrors += 1;
      if (err instanceof AutoiXpertError) {
        console.error(`  ✗ AutoiXpert error: ${err.statusCode} ${err.errorCode} — ${err.message}`);
        if (err.errorDetails) {
          console.error(`    details: ${JSON.stringify(err.errorDetails)}`);
        }
      } else {
        console.error(`  ✗ ${err.message}`);
      }
    }
  }

  console.log('\n' + '━'.repeat(60));
  if (totalErrors === 0) {
    console.log('✓ Import completed successfully');
    process.exit(0);
  } else {
    console.error(`✗ Import finished with ${totalErrors} resource failure(s). See autoixpert_sync_log for details.`);
    process.exit(1);
  }
}

async function runResource(resource, { client, supabase, startCursor }) {
  const run = startRun({ resource, filters: null });
  let cursorBefore = startCursor;

  try {
    const iterator = pickIterator(resource, client, startCursor);
    for await (const page of iterator) {
      // Map records and write to Supabase
      if (!ARGS.dryRun) {
        await writePage(resource, supabase, page.records);
      }
      await recordPage(supabase, run, {
        cursorBefore,
        cursorAfter: page.cursorAfter,
        pageCount: page.records.length,
      });
      const remaining = page.hasMore ? '…more' : 'done';
      console.log(`    page ${run.pageNumber}: ${page.records.length} records (${remaining})`);
      cursorBefore = page.cursorAfter;
    }
    return run.cumulativeCount;
  } catch (err) {
    await recordFailure(supabase, run, { cursorBefore, error: err });
    throw err;
  }
}

function pickIterator(resource, client, startCursor) {
  switch (resource) {
    case 'reports': return paginateReports(client, { startCursor });
    case 'contacts': return paginateContacts(client, { startCursor });
    case 'invoices': return paginateInvoices(client, { startCursor });
    default: throw new Error(`No iterator for: ${resource}`);
  }
}

async function writePage(resource, supabase, records) {
  if (records.length === 0) return;
  switch (resource) {
    case 'reports': {
      const rows = records.map(mapReportToRow);
      await upsertReports(supabase, rows);
      return;
    }
    case 'contacts': {
      const rows = records.map(mapContactToRow);
      await upsertContacts(supabase, rows);
      return;
    }
    case 'invoices': {
      const mapped = records.map(mapInvoiceToRow);
      await upsertInvoicesWithLinks(supabase, mapped);
      return;
    }
    default: throw new Error(`No writer for: ${resource}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
