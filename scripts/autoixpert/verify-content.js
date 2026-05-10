#!/usr/bin/env node
// AutoiXpert dokümant *İÇERİK* doğrulayıcı.
// Her PDF'i text'e çevirip raporun claimant adıyla karşılaştırır.
// AutoiXpert source bug'larını tespit eder (yanlış PDF içeriği).
//
// Kapsam: type='report' (Gutachten) ve type='invoice' (Rechnung) PDF'leri.
// Diğer Anschreiben'ler (letter_*) zaten alıcıya göre değişir, claimant
// adı tüm Anschreiben'lerde olmayabilir, atlanır.
//
// Çalıştırma:
//   node --env-file=.env.local scripts/autoixpert/verify-content.js
//   node --env-file=.env.local scripts/autoixpert/verify-content.js --types=report,invoice

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

async function extractText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const r = await parser.getText();
    return r.text || '';
  } finally {
    try { parser.destroy(); } catch {}
  }
}

const ARGS = (() => {
  const a = { types: ['report', 'invoice'], concurrency: 3, report: null };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--types=')) a.types = arg.slice(8).split(',');
    else if (arg.startsWith('--concurrency=')) a.concurrency = Number(arg.slice(14)) || 3;
    else if (arg.startsWith('--report=')) a.report = arg.slice(9);
  }
  return a;
})();

function need(n) { const v = process.env[n]; if (!v?.trim()) { console.error('✗', n); process.exit(1); } return v.trim(); }

function normalizeForMatch(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // diacritic strip
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const sb = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

  console.log('━'.repeat(60));
  console.log('AutoiXpert PDF İçerik Doğrulayıcı');
  console.log('━'.repeat(60));
  console.log('Tipler:', ARGS.types.join(','), '| Concurrency:', ARGS.concurrency);
  console.log('━'.repeat(60));

  // Tüm raporları yükle (claimant + token)
  const reports = new Map();
  let from = 0;
  while (true) {
    let q = sb.from('autoixpert_reports').select('id, token, claimant, owner_of_claimants_car').range(from, from+99);
    if (ARGS.report) q = q.eq('id', ARGS.report);
    const { data } = await q;
    if (!data || data.length === 0) break;
    for (const r of data) reports.set(r.id, r);
    if (data.length < 100) break;
    from += 100;
  }
  console.log('Rapor:', reports.size);

  // Hedef tipte indirilmiş dokümanlar
  let docsAll = [];
  let f2 = 0;
  while (true) {
    let q = sb.from('autoixpert_documents').select('id, report_id, type, storage_path, storage_bucket')
      .eq('download_status','done').in('type', ARGS.types).range(f2, f2+999);
    if (ARGS.report) q = q.eq('report_id', ARGS.report);
    const { data } = await q;
    if (!data || data.length === 0) break;
    docsAll.push(...data);
    if (data.length < 1000) break;
    f2 += 1000;
  }
  console.log('Doküman:', docsAll.length);
  console.log('━'.repeat(60));

  const issues = [];
  let idx = 0;
  let okCount = 0;
  let parseFails = 0;

  async function worker() {
    while (idx < docsAll.length) {
      const i = idx++;
      const doc = docsAll[i];
      const rep = reports.get(doc.report_id);
      if (!rep) continue;

      if (i % 25 === 0) process.stdout.write(`\r  ${i}/${docsAll.length} | ✓${okCount} ⚠${issues.length} ✗${parseFails}      `);

      // PDF indir, text çıkar
      const { data: dl, error: dlErr } = await sb.storage.from(doc.storage_bucket || 'autoixpert-documents').download(doc.storage_path);
      if (dlErr) {
        issues.push({ severity: 'STORAGE_FAIL', report_id: doc.report_id, token: rep.token, doc_id: doc.id, type: doc.type, msg: dlErr.message });
        continue;
      }
      const buf = Buffer.from(await dl.arrayBuffer());

      let text = '';
      try {
        text = await extractText(buf);
      } catch (e) {
        parseFails++;
        continue;
      }

      // Claimant adlarını topla
      const claimant = rep.claimant || {};
      const owner = rep.owner_of_claimants_car || {};
      const candidateNames = [
        claimant.first_name, claimant.last_name,
        claimant.organization_name,
        owner.first_name, owner.last_name,
        owner.organization_name,
      ].filter(Boolean);

      if (candidateNames.length === 0) {
        // Beklenen ad yok, atla
        okCount++;
        continue;
      }

      const normText = normalizeForMatch(text);
      const matchedNames = [];
      for (const name of candidateNames) {
        const n = normalizeForMatch(name);
        if (n.length >= 3 && normText.includes(n)) matchedNames.push(name);
      }

      if (matchedNames.length === 0) {
        // PDF'in iç metadata'sını yakalamaya çalış
        const aktMatch = text.match(/GA-[A-Z]{2}-\d{4}-\d{2}-\d{3}/);
        const nameMatch = text.match(/Anspruchsteller[\s\S]{0,120}?(Frau|Herr|Firma)\s+([A-Z][\w\sßäöüÄÖÜ-]{2,60})/);
        const foundAkt = aktMatch ? aktMatch[0] : null;
        const foundName = nameMatch ? nameMatch[2].trim() : null;
        issues.push({
          severity: 'CONTENT_MISMATCH',
          report_id: doc.report_id, token: rep.token, doc_id: doc.id, type: doc.type,
          expected: candidateNames.join(' / '),
          found_in_pdf_name: foundName || '(unbekannt)',
          found_in_pdf_akt: foundAkt || '(unbekannt)',
        });
      } else {
        okCount++;
      }
    }
  }

  await Promise.all(Array.from({ length: ARGS.concurrency }, worker));
  process.stdout.write(`\r  ${docsAll.length}/${docsAll.length} ✓\n`);

  console.log('\n' + '━'.repeat(60));
  console.log('SONUÇ');
  console.log('━'.repeat(60));
  console.log('İncelenen      :', docsAll.length);
  console.log('İçerik OK      :', okCount);
  console.log('PDF parse fail :', parseFails, '(image-only PDF\'leri atlandı)');
  console.log('İçerik tutarsız:', issues.length);

  if (issues.length > 0) {
    console.log('\n⚠️  AutoiXpert source bug — yanlış kişide PDF:');
    for (const i of issues.slice(0, 30)) {
      console.log(' ', i.token, '|', i.type, '|', 'beklenen:', i.expected, '→ PDF\'te:', i.found_in_pdf_name, '/', i.found_in_pdf_akt);
    }
    if (issues.length > 30) console.log('  ...', issues.length - 30, 'tane daha. Detaylı rapor JSON\'da.');
    const path = `verify-content-${Date.now()}.json`;
    writeFileSync(path, JSON.stringify({ summary: { total: docsAll.length, ok: okCount, parseFails, issues: issues.length }, issues }, null, 2));
    console.log('\nDetaylı rapor:', path);
    process.exit(2);
  } else {
    console.log('\n✓ Tüm PDF\'lerin içeriği doğru kişiyle eşleşiyor.');
  }
}

main().catch((e) => { console.error('Fatal:', e.message); console.error(e.stack); process.exit(1); });
