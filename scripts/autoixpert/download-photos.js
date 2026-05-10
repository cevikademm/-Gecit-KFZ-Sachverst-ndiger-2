#!/usr/bin/env node
// AutoiXpert → Supabase Storage — foto binary indirici
//
// Çalıştırma:
//   node --env-file=.env.local scripts/autoixpert/download-photos.js
//
// CLI flagleri:
//   --concurrency=N   Paralel indirme sayısı (default: 4)
//   --only-flagged    Sadece included_in_report=true olanları indir
//   --report=ID       Tek raporun fotolarını indir
//   --variant=V       original (default) | thumbnail
//   --resume          download_status=done olanları atla (default davranış)
//   --retry-failed    download_status=failed olanları tekrar dene
//   --dry-run         Sadece liste, indirme yapma
//
// Ön koşul:
//   migration/autoixpert_photos_schema.sql Supabase'de çalıştırılmış olmalı.
//   autoixpert_reports tablosu dolu olmalı (raw_payload.photos[] içerir).

import { createClient } from '@supabase/supabase-js';
import { createAutoixpertClient, AutoiXpertError } from './client.js';

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const a = {
    concurrency: 4,
    onlyFlagged: false,
    report: null,
    variant: 'original',
    resume: true,
    retryFailed: false,
    dryRun: false,
  };
  for (const arg of argv) {
    if (arg.startsWith('--concurrency=')) a.concurrency = Number(arg.slice(14)) || 4;
    else if (arg === '--only-flagged') a.onlyFlagged = true;
    else if (arg.startsWith('--report=')) a.report = arg.slice(9);
    else if (arg.startsWith('--variant=')) a.variant = arg.slice(10);
    else if (arg === '--retry-failed') a.retryFailed = true;
    else if (arg === '--no-resume') a.resume = false;
    else if (arg === '--dry-run') a.dryRun = true;
  }
  return a;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`✗ Eksik env: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

const STORAGE_BUCKET = 'autoixpert-photos';

function extFromMime(mime) {
  if (!mime) return 'bin';
  const m = String(mime).toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('heic')) return 'heic';
  if (m.includes('heif')) return 'heif';
  return 'bin';
}

function sanitizeStorageKey(s) {
  // Supabase Storage path sadece [a-zA-Z0-9_/.-] kabul eder.
  // Almanca karakterleri ASCII'ye çevir, kalanı '_' yap.
  return String(s)
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9._-]/g, '_');
}

function buildStoragePath(reportId, photoId, variant, mime) {
  const ext = extFromMime(mime);
  const v = variant === 'thumbnail' ? '_thumb' : '';
  return `${sanitizeStorageKey(reportId)}/${sanitizeStorageKey(photoId)}${v}.${ext}`;
}

async function ensureBucketExists(supabase) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Bucket listesi: ${error.message}`);
  if (!data.some((b) => b.name === STORAGE_BUCKET)) {
    throw new Error(
      `Bucket '${STORAGE_BUCKET}' yok. migration/autoixpert_photos_schema.sql'yi Supabase SQL Editor'da çalıştırın.`,
    );
  }
}

async function ensurePhotoRowsExist(supabase) {
  // raw_payload.photos[] içindeki her foto için autoixpert_photos satırı oluştur (upsert).
  console.log('▶ autoixpert_photos satırlarını hazırlıyorum (upsert from autoixpert_reports)…');
  const { data: reports, error } = await supabase
    .from('autoixpert_reports')
    .select('id, raw_payload');
  if (error) throw new Error(`reports fetch: ${error.message}`);

  const rows = [];
  for (const r of reports) {
    const photos = r.raw_payload?.photos || [];
    for (const p of photos) {
      if (!p?.id) continue;
      rows.push({
        id: p.id,
        report_id: r.id,
        title: p.title ?? null,
        original_name: p.original_name ?? null,
        description: p.description ?? null,
        mimetype: p.mimetype ?? null,
        size_bytes: p.size ?? null,
        width: p.width ?? null,
        height: p.height ?? null,
        included_in_report: p.included_in_report ?? false,
        included_in_expert_statement: p.included_in_expert_statement ?? false,
        included_in_repair_confirmation: p.included_in_repair_confirmation ?? false,
        included_in_residual_value_exchange: p.included_in_residual_value_exchange ?? false,
        lease_return_item_id: p.lease_return_item_id ?? null,
        raw_payload: p,
      });
    }
  }

  console.log(`  ${rows.length} foto satırı upsert edilecek (${reports.length} rapordan)…`);

  // 200'lük chunk'lar
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('autoixpert_photos')
      .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
    if (error) throw new Error(`photos upsert chunk ${i}: ${error.code} ${error.message}`);
  }

  console.log(`  ✓ ${rows.length} foto satırı hazır.\n`);
  return rows.length;
}

async function selectPhotosToDownload(supabase, args) {
  // Supabase varsayılan max-rows = 1000 → range() ile pagination zorunlu.
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from('autoixpert_photos')
      .select('id, report_id, mimetype, size_bytes, included_in_report, download_status, download_attempts')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (args.report) q = q.eq('report_id', args.report);
    if (args.onlyFlagged) q = q.eq('included_in_report', true);

    if (args.retryFailed) {
      q = q.in('download_status', ['failed', 'pending']);
    } else if (args.resume) {
      q = q.in('download_status', ['pending']);
    }

    const { data, error } = await q;
    if (error) throw new Error(`photos query: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function downloadOne(client, supabase, photo, args) {
  // /download suffix binary (image/jpeg) döner; suffix'siz JSON metadata.
  const url = `/reports/${encodeURIComponent(photo.report_id)}/photos/${encodeURIComponent(photo.id)}/download`;

  // status: downloading (lock)
  await supabase
    .from('autoixpert_photos')
    .update({
      download_status: 'downloading',
      download_attempts: (photo.download_attempts || 0) + 1,
    })
    .eq('id', photo.id);

  let buffer, contentType;
  try {
    // client.get() binary için raw Response döner (client.js:84)
    const res = await client.get(url);
    if (typeof res?.arrayBuffer !== 'function') {
      throw new Error('Beklenmedik yanıt: binary değil');
    }
    // AutoiXpert bazen binary/octet-stream döndürür; bucket allowed_mime_types'da yok → DB'deki mimetype'a fallback.
    const upstream = res.headers.get('content-type');
    const isGeneric = !upstream || /octet-stream/i.test(upstream);
    contentType = isGeneric ? (photo.mimetype || 'image/jpeg') : upstream;
    const ab = await res.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch (e) {
    await supabase
      .from('autoixpert_photos')
      .update({
        download_status: 'failed',
        download_error: `fetch: ${e.message?.slice(0, 500)}`,
      })
      .eq('id', photo.id);
    throw e;
  }

  const path = buildStoragePath(photo.report_id, photo.id, args.variant, contentType);

  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000',
    });

  if (upErr) {
    await supabase
      .from('autoixpert_photos')
      .update({
        download_status: 'failed',
        download_error: `upload: ${upErr.message?.slice(0, 500)}`,
      })
      .eq('id', photo.id);
    throw new Error(`upload ${path}: ${upErr.message}`);
  }

  await supabase
    .from('autoixpert_photos')
    .update({
      download_status: 'done',
      download_error: null,
      storage_path: path,
      variant: args.variant,
      mimetype: contentType,
      size_bytes: buffer.length,
      downloaded_at: new Date().toISOString(),
    })
    .eq('id', photo.id);

  return buffer.length;
}

async function processQueue(items, worker, concurrency) {
  let idx = 0;
  let done = 0;
  let failed = 0;
  let bytes = 0;
  const total = items.length;

  async function next() {
    while (idx < items.length) {
      const i = idx++;
      const it = items[i];
      try {
        const n = await worker(it);
        bytes += n || 0;
        done++;
      } catch (e) {
        failed++;
      }
      const completed = done + failed;
      if (completed % 25 === 0 || completed === total) {
        const mb = (bytes / 1024 / 1024).toFixed(1);
        process.stdout.write(
          `\r  ${completed}/${total}  ✓${done} ✗${failed}  ${mb} MB     `,
        );
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
  console.log('AutoiXpert Photo Download → Supabase Storage');
  console.log('━'.repeat(60));
  console.log(`Bucket       : ${STORAGE_BUCKET}`);
  console.log(`Variant      : ${ARGS.variant}`);
  console.log(`Concurrency  : ${ARGS.concurrency}`);
  console.log(`Only flagged : ${ARGS.onlyFlagged ? 'YES (included_in_report=true)' : 'no'}`);
  console.log(`Report scope : ${ARGS.report || 'ALL'}`);
  console.log(`Resume       : ${ARGS.resume ? 'YES (skip done)' : 'no'}`);
  console.log(`Retry failed : ${ARGS.retryFailed ? 'YES' : 'no'}`);
  console.log(`Dry run      : ${ARGS.dryRun ? 'YES (no downloads)' : 'no'}`);
  console.log('━'.repeat(60));

  await ensureBucketExists(supabase);
  await ensurePhotoRowsExist(supabase);

  const queue = await selectPhotosToDownload(supabase, ARGS);
  const totalBytesEst = queue.reduce((a, p) => a + (p.size_bytes || 700_000), 0);
  console.log(`▶ İndirme kuyruğu: ${queue.length} foto, tahmini ${(totalBytesEst / 1024 / 1024 / 1024).toFixed(2)} GB\n`);

  if (ARGS.dryRun) {
    console.log('Dry run: indirme yapılmadı.');
    return;
  }
  if (queue.length === 0) {
    console.log('Yapacak iş yok ✓');
    return;
  }

  const t0 = Date.now();
  const result = await processQueue(
    queue,
    (p) => downloadOne(client, supabase, p, ARGS),
    ARGS.concurrency,
  );
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('━'.repeat(60));
  console.log(`✓ Done    : ${result.done}`);
  console.log(`✗ Failed  : ${result.failed}`);
  console.log(`📦 Bytes  : ${(result.bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`⏱  Time   : ${dt}s`);
  console.log('━'.repeat(60));

  if (result.failed > 0) {
    console.log('\nBaşarısız fotoları görmek için:');
    console.log("  SELECT id, report_id, download_error FROM autoixpert_photos WHERE download_status='failed';");
    console.log('Tekrar denemek için: --retry-failed flag\'i ile çalıştır.');
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('\n✗ Fatal:', e.message);
  console.error(e.stack);
  process.exit(1);
});
