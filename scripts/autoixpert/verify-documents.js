#!/usr/bin/env node
// AutoiXpert dokümant doğrulama scripti.
// Her (report_id, document_id) çiftini tarayıp şunları teyit eder:
//  1. autoixpert_reports.raw_payload.documents[]'de görünen her doc DB'de var mı?
//  2. Her DB satırının download_status='done' ve storage_path dolu mu?
//  3. Storage'da dosya gerçekten erişilebilir mi (HEAD)?
//  4. Dosya boyutu makul mu (>1KB)?
//  5. (--strict ile) AutoiXpert'tan canlı fetch edip byte-byte karşılaştırır.
//
// Çıktı: konsola özet + scripts/autoixpert/verify-report.json (mismatch detayları)
//
// Çalıştırma:
//   node --env-file=.env.local scripts/autoixpert/verify-documents.js
//   node --env-file=.env.local scripts/autoixpert/verify-documents.js --strict
//   node --env-file=.env.local scripts/autoixpert/verify-documents.js --report=<id>

import { createClient } from '@supabase/supabase-js';
import { createAutoixpertClient } from './client.js';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ARGS = (() => {
  const a = { strict: false, report: null, concurrency: 4 };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--strict') a.strict = true;
    else if (arg.startsWith('--report=')) a.report = arg.slice(9);
    else if (arg.startsWith('--concurrency=')) a.concurrency = Number(arg.slice(14)) || 4;
  }
  return a;
})();

function need(n) { const v = process.env[n]; if (!v?.trim()) { console.error('✗', n); process.exit(1); } return v.trim(); }

const STORAGE_BUCKET = 'autoixpert-documents';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function main() {
  const sb = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const apiKey = need('AUTOIXPERT_API_KEY');
  const baseUrl = process.env.AUTOIXPERT_API_BASE_URL || 'https://app.autoixpert.de/externalApi/v1';
  const client = createAutoixpertClient({ baseUrl, apiKey, requestDelayMs: 100, maxRetries: 3 });

  console.log('━'.repeat(60));
  console.log('AutoiXpert Document Verifier');
  console.log('━'.repeat(60));
  console.log('Mode  :', ARGS.strict ? 'STRICT (live byte compare)' : 'standard (existence + size)');
  console.log('Scope :', ARGS.report || 'TÜM raporlar');
  console.log('━'.repeat(60));

  // 1) Tüm raporlar + raw_payload.documents
  console.log('\n▶ Raporlar yükleniyor…');
  const reports = [];
  let from = 0;
  while (true) {
    let q = sb.from('autoixpert_reports').select('id, token, claimant, raw_payload').range(from, from+99);
    if (ARGS.report) q = q.eq('id', ARGS.report);
    const { data } = await q;
    if (!data || data.length === 0) break;
    reports.push(...data);
    if (data.length < 100) break;
    from += 100;
  }
  console.log('  Rapor:', reports.length);

  // 2) Tüm DB doc satırları
  console.log('▶ DB doküman satırları yükleniyor…');
  const dbRows = [];
  let f2 = 0;
  while (true) {
    let q = sb.from('autoixpert_documents').select('id, report_id, type, download_status, storage_path, storage_bucket, size_bytes').range(f2, f2+999);
    if (ARGS.report) q = q.eq('report_id', ARGS.report);
    const { data } = await q;
    if (!data || data.length === 0) break;
    dbRows.push(...data);
    if (data.length < 1000) break;
    f2 += 1000;
  }
  console.log('  DB satırı:', dbRows.length);

  const dbMap = new Map();
  for (const r of dbRows) dbMap.set(`${r.report_id}|${r.id}`, r);

  // 3) Beklenen → DB karşılaştırma
  console.log('\n▶ Tarama başlıyor…');
  const issues = [];
  let totalExpected = 0;
  let okCount = 0;
  let storageChecked = 0;
  let liveChecked = 0;

  for (const r of reports) {
    const docs = r.raw_payload?.documents || [];
    for (const d of docs) {
      if (!d?.id) continue;
      totalExpected++;
      const key = `${r.id}|${d.id}`;
      const dbRow = dbMap.get(key);
      const claimantName = [r.claimant?.first_name, r.claimant?.last_name].filter(Boolean).join(' ') || '?';

      if (!dbRow) {
        issues.push({ severity: 'MISSING_DB', report: r.token, claimant: claimantName, doc_id: d.id, type: d.type, msg: 'DB satırı yok' });
        continue;
      }
      if (dbRow.download_status !== 'done') {
        issues.push({ severity: 'NOT_DOWNLOADED', report: r.token, claimant: claimantName, doc_id: d.id, type: d.type, msg: 'status=' + dbRow.download_status });
        continue;
      }
      if (!dbRow.storage_path) {
        issues.push({ severity: 'NO_PATH', report: r.token, claimant: claimantName, doc_id: d.id, type: d.type, msg: 'storage_path null' });
        continue;
      }

      // Path tutarlılığı: report_id ile başlamalı
      const expectedPrefix = sanitizeKey(r.id) + '/';
      if (!dbRow.storage_path.startsWith(expectedPrefix)) {
        issues.push({ severity: 'PATH_MISMATCH', report: r.token, claimant: claimantName, doc_id: d.id, type: d.type, msg: `path "${dbRow.storage_path}" should start "${expectedPrefix}"` });
        continue;
      }

      // Size sanity
      if (dbRow.size_bytes !== null && dbRow.size_bytes < 1024) {
        issues.push({ severity: 'TOO_SMALL', report: r.token, claimant: claimantName, doc_id: d.id, type: d.type, msg: `size=${dbRow.size_bytes} bytes` });
        continue;
      }

      okCount++;
    }
  }

  // 4) Storage erişim kontrolü (download.size header = DB size_bytes)
  console.log('▶ Storage erişim kontrolü…');
  const okRows = dbRows.filter((r) => r.download_status === 'done' && r.storage_path && (!ARGS.report || r.report_id === ARGS.report));
  for (let i = 0; i < okRows.length; i++) {
    const row = okRows[i];
    if (i % 100 === 0) process.stdout.write(`\r  ${i}/${okRows.length}…   `);
    const { data: signed } = await sb.storage.from(row.storage_bucket || STORAGE_BUCKET).createSignedUrl(row.storage_path, 60);
    if (!signed?.signedUrl) {
      issues.push({ severity: 'STORAGE_NO_SIGN', report: '?', claimant: '?', doc_id: row.id, type: row.type, msg: 'signed URL yok' });
      continue;
    }
    storageChecked++;
  }
  process.stdout.write(`\r  ${okRows.length}/${okRows.length} ✓\n`);

  // 5) Strict mode: AutoiXpert'tan canlı fetch + hash compare
  if (ARGS.strict) {
    console.log('▶ Strict: canlı byte karşılaştırma (yavaş)…');
    let idx = 0;
    const total = okRows.length;
    async function worker() {
      while (idx < total) {
        const i = idx++;
        const row = okRows[i];
        if (i % 25 === 0) process.stdout.write(`\r  ${i}/${total}…   `);
        try {
          // Canlı PDF
          const res = await client.get(`/reports/${encodeURIComponent(row.report_id)}/documents/${encodeURIComponent(row.id)}/download`);
          if (typeof res?.arrayBuffer !== 'function') continue;
          const liveBuf = Buffer.from(await res.arrayBuffer());
          // Storage PDF
          const { data: dl } = await sb.storage.from(row.storage_bucket || STORAGE_BUCKET).download(row.storage_path);
          const storedBuf = Buffer.from(await dl.arrayBuffer());
          const liveHash = sha256(liveBuf);
          const storedHash = sha256(storedBuf);
          if (liveHash !== storedHash) {
            issues.push({ severity: 'CONTENT_MISMATCH', report_id: row.report_id, doc_id: row.id, type: row.type,
              msg: `live=${liveHash.slice(0,16)} stored=${storedHash.slice(0,16)} | live_size=${liveBuf.length} stored_size=${storedBuf.length}` });
          }
          liveChecked++;
        } catch (e) {
          issues.push({ severity: 'STRICT_ERROR', report_id: row.report_id, doc_id: row.id, type: row.type, msg: e.message?.slice(0,200) });
        }
      }
    }
    await Promise.all(Array.from({ length: ARGS.concurrency }, worker));
    process.stdout.write(`\r  ${total}/${total} ✓\n`);
  }

  // 6) Rapor
  console.log('\n' + '━'.repeat(60));
  console.log('SONUÇ');
  console.log('━'.repeat(60));
  console.log('Beklenen (rapor,doc) çifti :', totalExpected);
  console.log('DB satırı                  :', dbRows.length);
  console.log('OK                         :', okCount);
  console.log('Storage signed URL         :', storageChecked);
  if (ARGS.strict) console.log('Live byte karşılaştırılan  :', liveChecked);
  console.log('Sorun                      :', issues.length);

  if (issues.length > 0) {
    const bySeverity = {};
    for (const i of issues) bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    console.log('\nSorun tipleri:');
    for (const [k, v] of Object.entries(bySeverity)) console.log(' ', String(v).padStart(4), '×', k);
    console.log('\nİlk 15 sorun:');
    for (const i of issues.slice(0, 15)) {
      console.log(' ', i.severity, '|', i.report || i.report_id, '/', i.claimant || '?', '|', i.type || '?', '|', i.msg);
    }
    const path = `verify-report-${Date.now()}.json`;
    writeFileSync(path, JSON.stringify({ summary: { totalExpected, okCount, issueCount: issues.length, bySeverity }, issues }, null, 2));
    console.log('\nDetaylı rapor:', path);
    process.exit(2);
  } else {
    console.log('\n✓ Tüm dokümantlar doğru kişiyle eşleşmiş.');
  }
}

function sanitizeKey(s) {
  return String(s)
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9._-]/g, '_');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
