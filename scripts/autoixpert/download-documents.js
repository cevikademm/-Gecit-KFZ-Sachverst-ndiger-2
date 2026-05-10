#!/usr/bin/env node
// AutoiXpert → Supabase Storage — PDF/dokümant binary indirici
//
// Çalıştırma:
//   node --env-file=.env.local scripts/autoixpert/download-documents.js
//
// CLI flagleri:
//   --concurrency=N   Paralel indirme (default: 6)
//   --report=ID       Tek raporun dokümanlarını indir
//   --type=T          Sadece belli tipi indir (report | invoice | letter_*)
//   --resume          download_status=done atla (default)
//   --retry-failed    Failed olanları yeniden dene
//   --dry-run         İndirmeden listeyi göster

import { createClient } from '@supabase/supabase-js';
import { createAutoixpertClient } from './client.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// PDF içeriğini rapor token'ı + claimant adıyla karşılaştır.
// AutoiXpert source bug'larını yakalar: yanlış kişinin PDF'i indi mi?
// Dönen: { ok: bool, reason: string }
async function verifyPdfContent(buffer, reportMeta) {
  if (!reportMeta?.token) return { ok: true, reason: 'meta yok, atlandı' };

  let text = '';
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const r = await parser.getText();
      text = r.text || '';
    } finally {
      try { parser.destroy?.(); } catch {}
    }
  } catch {
    return { ok: true, reason: 'PDF parse fail (image-only?), atlandı' };
  }

  if (text.length < 200) return { ok: true, reason: 'metin yok (image-only)' };

  // 1. Aktenzeichen kontrolü — birinci öncelik
  const akts = text.match(/GA-[A-Z]{2}-\d{4}-\d{2}-\d{3}/g);
  if (akts && akts.length > 0) {
    const found = new Set(akts);
    if (found.has(reportMeta.token)) return { ok: true, reason: 'Aktenzeichen match' };
    return { ok: false, reason: `Aktenzeichen MISMATCH: bekl=${reportMeta.token}, PDF=${[...found].join(',')}` };
  }

  // 2. Claimant adı kontrolü — fallback
  const claimant = reportMeta.claimant || {};
  const owner = reportMeta.owner_of_claimants_car || {};
  const candidates = [
    claimant.first_name, claimant.last_name, claimant.organization_name,
    owner.first_name, owner.last_name, owner.organization_name,
  ].filter(Boolean);

  if (candidates.length === 0) return { ok: true, reason: 'claimant verisi yok' };

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const normText = norm(text);
  const matched = candidates.some((n) => norm(n).length >= 3 && normText.includes(norm(n)));
  if (matched) return { ok: true, reason: 'claimant match' };

  // 3. PDF'te bir başka kişi adı var mı?
  const other = text.match(/Anspruchsteller[\s\S]{0,120}?(Frau|Herr|Firma)\s+([A-Z][\w\sßäöüÄÖÜ-]{2,60})/);
  if (other) return { ok: false, reason: `claimant MISMATCH: bekl=${candidates.slice(0,2).join(' ')}, PDF=${other[2].trim()}` };

  return { ok: true, reason: 'doğrulanamadı (claimant adı text\'te yok ama mismatch de tespit edilmedi)' };
}

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const a = { concurrency: 6, report: null, type: null, resume: true, retryFailed: false, dryRun: false };
  for (const arg of argv) {
    if (arg.startsWith('--concurrency=')) a.concurrency = Number(arg.slice(14)) || 6;
    else if (arg.startsWith('--report=')) a.report = arg.slice(9);
    else if (arg.startsWith('--type=')) a.type = arg.slice(7);
    else if (arg === '--retry-failed') a.retryFailed = true;
    else if (arg === '--no-resume') a.resume = false;
    else if (arg === '--dry-run') a.dryRun = true;
  }
  return a;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v?.trim()) { console.error('✗ Eksik env:', name); process.exit(1); }
  return v.trim();
}

const STORAGE_BUCKET = 'autoixpert-documents';

function sanitizeKey(s) {
  return String(s)
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9._-]/g, '_');
}

function buildStoragePath(reportId, docId, type) {
  const t = type ? `_${sanitizeKey(type)}` : '';
  return `${sanitizeKey(reportId)}/${sanitizeKey(docId)}${t}.pdf`;
}

async function ensureBucketExists(supabase) {
  const { data } = await supabase.storage.listBuckets();
  if (!data.some((b) => b.name === STORAGE_BUCKET)) {
    throw new Error(`Bucket '${STORAGE_BUCKET}' yok. Önce bucket oluşturulmalı.`);
  }
}

async function ensureDocumentRowsExist(supabase) {
  console.log('▶ autoixpert_documents satırlarını hazırlıyorum…');
  // raw_payload'dan documents çek (sayfalı)
  const allReports = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('autoixpert_reports')
      .select('id, raw_payload')
      .range(from, from + 99);
    if (error) throw new Error(`reports fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    allReports.push(...data);
    if (data.length < 100) break;
    from += 100;
  }

  const rows = [];
  for (const r of allReports) {
    const docs = r.raw_payload?.documents || [];
    for (const d of docs) {
      if (!d?.id) continue;
      rows.push({
        id: d.id,
        report_id: r.id,
        type: d.type || null,
        title: d.title || null,
        raw_payload: d,
      });
    }
  }

  // Compound PK (report_id, id): dedupe yapmıyoruz — aynı doc id farklı raporda OLMALI.
  // Her (report_id, id) çifti benzersiz; AutoiXpert aynı şablon doc_id'si için
  // her raporda kişiselleştirilmiş PDF döndürür.
  console.log(`  ${rows.length} doküman satırı upsert (${allReports.length} rapordan, ${new Set(rows.map(r=>r.id)).size} farklı id)…`);
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('autoixpert_documents')
      .upsert(chunk, { onConflict: 'report_id,id', ignoreDuplicates: true });
    if (error) throw new Error(`documents upsert ${i}: ${error.code} ${error.message}`);
  }
  console.log(`  ✓ ${rows.length} doküman satırı hazır.\n`);
  return rows.length;
}

async function selectDocumentsToDownload(supabase, args) {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from('autoixpert_documents')
      .select('id, report_id, type, title, download_status, download_attempts')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (args.report) q = q.eq('report_id', args.report);
    if (args.type) q = q.eq('type', args.type);
    if (args.retryFailed) q = q.in('download_status', ['failed', 'pending']);
    else if (args.resume) q = q.eq('download_status', 'pending');

    const { data, error } = await q;
    if (error) throw new Error(`docs query: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function downloadOne(client, supabase, doc, reportMeta) {
  const url = `/reports/${encodeURIComponent(doc.report_id)}/documents/${encodeURIComponent(doc.id)}/download`;

  await supabase.from('autoixpert_documents').update({
    download_status: 'downloading',
    download_attempts: (doc.download_attempts || 0) + 1,
  }).eq('report_id', doc.report_id).eq('id', doc.id);

  let buffer;
  try {
    const res = await client.get(url);
    if (typeof res?.arrayBuffer !== 'function') throw new Error('Beklenmedik yanıt: binary değil');
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch (e) {
    await supabase.from('autoixpert_documents').update({
      download_status: 'failed',
      download_error: `fetch: ${e.message?.slice(0, 500)}`,
    }).eq('report_id', doc.report_id).eq('id', doc.id);
    throw e;
  }

  // 🔒 İçerik doğrulama — Storage'a yüklemeden ÖNCE
  // Yanlış kişiye ait PDF tespit edilirse Storage'a HİÇBİR ŞEY yazılmaz.
  const meta = reportMeta?.get(doc.report_id);
  const verify = await verifyPdfContent(buffer, meta);
  if (!verify.ok) {
    await supabase.from('autoixpert_documents').update({
      download_status: 'failed',
      download_error: `CONTENT_MISMATCH: ${verify.reason.slice(0, 400)}`,
      size_bytes: buffer.length,
    }).eq('report_id', doc.report_id).eq('id', doc.id);
    throw new Error(`CONTENT_MISMATCH: ${verify.reason}`);
  }

  const path = buildStoragePath(doc.report_id, doc.id, doc.type);

  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: '31536000',
    });

  if (upErr) {
    await supabase.from('autoixpert_documents').update({
      download_status: 'failed',
      download_error: `upload: ${upErr.message?.slice(0, 500)}`,
    }).eq('report_id', doc.report_id).eq('id', doc.id);
    throw new Error(`upload ${path}: ${upErr.message}`);
  }

  await supabase.from('autoixpert_documents').update({
    download_status: 'done',
    download_error: null,
    storage_path: path,
    mimetype: 'application/pdf',
    size_bytes: buffer.length,
    downloaded_at: new Date().toISOString(),
  }).eq('report_id', doc.report_id).eq('id', doc.id);

  return buffer.length;
}

async function processQueue(items, worker, concurrency) {
  let idx = 0, done = 0, failed = 0, bytes = 0;
  const total = items.length;

  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        const n = await worker(items[i]);
        bytes += n || 0;
        done++;
      } catch {
        failed++;
      }
      const completed = done + failed;
      if (completed % 10 === 0 || completed === total) {
        const mb = (bytes / 1024 / 1024).toFixed(1);
        process.stdout.write(`\r  ${completed}/${total}  ✓${done} ✗${failed}  ${mb} MB     `);
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, next);
  await Promise.all(workers);
  process.stdout.write('\n');
  return { done, failed, bytes };
}

async function main() {
  const apiKey = requireEnv('AUTOIXPERT_API_KEY');
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const baseUrl = process.env.AUTOIXPERT_API_BASE_URL || 'https://app.autoixpert.de/externalApi/v1';
  const requestDelayMs = Number(process.env.AUTOIXPERT_REQUEST_DELAY_MS || 100);
  const maxRetries = Number(process.env.AUTOIXPERT_MAX_RETRIES || 4);

  const client = createAutoixpertClient({ baseUrl, apiKey, requestDelayMs, maxRetries });
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('━'.repeat(60));
  console.log('AutoiXpert Document Download → Supabase Storage');
  console.log('━'.repeat(60));
  console.log(`Bucket       : ${STORAGE_BUCKET}`);
  console.log(`Concurrency  : ${ARGS.concurrency}`);
  console.log(`Report scope : ${ARGS.report || 'ALL'}`);
  console.log(`Type filter  : ${ARGS.type || 'ALL'}`);
  console.log(`Resume       : ${ARGS.resume ? 'YES' : 'no'}`);
  console.log(`Retry failed : ${ARGS.retryFailed ? 'YES' : 'no'}`);
  console.log(`Dry run      : ${ARGS.dryRun ? 'YES' : 'no'}`);
  console.log('━'.repeat(60));

  await ensureBucketExists(supabase);
  await ensureDocumentRowsExist(supabase);

  // Rapor metadata (token + claimant) — content verification için
  console.log('▶ Rapor metadata yükleniyor (content verification için)…');
  const reportMeta = new Map();
  let mFrom = 0;
  while (true) {
    const { data } = await supabase.from('autoixpert_reports').select('id, token, claimant, owner_of_claimants_car').range(mFrom, mFrom+99);
    if (!data?.length) break;
    for (const r of data) reportMeta.set(r.id, r);
    if (data.length < 100) break;
    mFrom += 100;
  }
  console.log(`  ${reportMeta.size} rapor metadata\n`);

  const queue = await selectDocumentsToDownload(supabase, ARGS);
  console.log(`▶ İndirme kuyruğu: ${queue.length} doküman\n`);

  if (ARGS.dryRun) { console.log('Dry run.'); return; }
  if (queue.length === 0) { console.log('Yapacak iş yok ✓'); return; }

  const t0 = Date.now();
  const result = await processQueue(queue, (d) => downloadOne(client, supabase, d, reportMeta), ARGS.concurrency);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('━'.repeat(60));
  console.log(`✓ Done    : ${result.done}`);
  console.log(`✗ Failed  : ${result.failed}`);
  console.log(`📦 Bytes  : ${(result.bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`⏱  Time   : ${dt}s`);
  console.log('━'.repeat(60));

  if (result.failed > 0) {
    console.log("\nBaşarısız: SELECT id, report_id, download_error FROM autoixpert_documents WHERE download_status='failed';");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('\n✗ Fatal:', e.message);
  process.exit(1);
});
