#!/usr/bin/env node
// AutoiXpert auto-match: Gecit customers ↔ autoixpert_contacts.
//
// Email exact (case-insensitive)  → confidence 1.00
// Phone normalized exact          → confidence 0.85
// Name + company exact            → confidence 0.70
// Otherwise: no link.
//
// Sonuçları `customer_autoixpert_links` tablosuna UPSERT eder.
// Idempotent: tekrar tekrar çalıştırılabilir.
//
// Usage:
//   node --env-file=.env.local scripts/autoixpert/match-contacts.js
//   node --env-file=.env.local scripts/autoixpert/match-contacts.js --dry-run
//
// Önkoşul: supabase_migration_autoixpert_mapping.sql çalıştırılmış olmalı.

import { createClient } from '@supabase/supabase-js';

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`✗ Missing env: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

function normalizePhone(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (digits.length < 7) return null; // çok kısa = işe yaramaz
  // Almanya/Türkiye: leading 0 veya country code kalkması olasılıklarını handle et
  return digits.replace(/^0+/, '').replace(/^49/, '').replace(/^90/, '');
}

function normalizeEmail(e) {
  if (!e) return null;
  return String(e).trim().toLowerCase();
}

function normalizeName(s) {
  if (!s) return null;
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  console.log('━'.repeat(60));
  console.log('AutoiXpert ↔ customers auto-match');
  console.log('━'.repeat(60));
  console.log(`Dry run: ${ARGS.dryRun ? 'YES' : 'no'}`);
  console.log('');

  // 1) Customers + autoixpert_contacts'i çek
  const { data: customers, error: cErr } = await supabase
    .from('customers')
    .select('id, email, phone, full_name, company');
  if (cErr) { console.error('customers fetch failed:', cErr.message); process.exit(1); }

  const { data: contacts, error: aErr } = await supabase
    .from('autoixpert_contacts')
    .select('id, email, phone, phone2, first_name, last_name, organization_name, organization_type');
  if (aErr) { console.error('autoixpert_contacts fetch failed:', aErr.message); process.exit(1); }

  console.log(`Customers     : ${customers?.length ?? 0}`);
  console.log(`AutoiXpert kt : ${contacts?.length ?? 0}`);
  console.log('');

  // 2) İndeksleme
  const byEmail = new Map();
  const byPhone = new Map();
  const byName = new Map();

  for (const c of contacts ?? []) {
    // email noktalı virgülle ayrılmış olabilir
    const emails = (c.email || '').split(';').map(normalizeEmail).filter(Boolean);
    for (const e of emails) {
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e).push(c);
    }
    const phones = [c.phone, c.phone2].map(normalizePhone).filter(Boolean);
    for (const p of phones) {
      if (!byPhone.has(p)) byPhone.set(p, []);
      byPhone.get(p).push(c);
    }
    const personName = normalizeName(`${c.first_name || ''} ${c.last_name || ''}`);
    const orgName = normalizeName(c.organization_name);
    for (const n of [personName, orgName].filter(Boolean)) {
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(c);
    }
  }

  // 3) Match
  const links = [];
  let stats = { email: 0, phone: 0, name: 0, none: 0 };

  for (const cu of customers ?? []) {
    const email = normalizeEmail(cu.email);
    const phone = normalizePhone(cu.phone);
    const fullName = normalizeName(cu.full_name);
    const company = normalizeName(cu.company);

    const matched = new Map(); // contact_id -> {method, confidence}

    if (email && byEmail.has(email)) {
      for (const c of byEmail.get(email)) {
        matched.set(c.id, { method: 'email', confidence: 1.0 });
      }
    }
    if (phone && byPhone.has(phone)) {
      for (const c of byPhone.get(phone)) {
        if (!matched.has(c.id)) matched.set(c.id, { method: 'phone', confidence: 0.85 });
      }
    }
    for (const n of [fullName, company].filter(Boolean)) {
      if (byName.has(n)) {
        for (const c of byName.get(n)) {
          if (!matched.has(c.id)) matched.set(c.id, { method: 'name_company', confidence: 0.70 });
        }
      }
    }

    if (matched.size === 0) { stats.none += 1; continue; }
    for (const [contactId, m] of matched) {
      links.push({
        customer_id: cu.id,
        autoixpert_contact_id: contactId,
        match_method: m.method,
        confidence: m.confidence,
        is_confirmed: false,
        created_by: 'auto-match',
      });
      stats[m.method] = (stats[m.method] || 0) + 1;
    }
  }

  console.log('Match sonuçları:');
  console.log(`  email      : ${stats.email}`);
  console.log(`  phone      : ${stats.phone}`);
  console.log(`  name/firma : ${stats.name_company || 0}`);
  console.log(`  HİÇ MATCH  : ${stats.none} müşteri`);
  console.log(`  TOPLAM LINK: ${links.length}`);

  if (ARGS.dryRun) {
    console.log('\n--dry-run modu: yazılmadı.');
    return;
  }

  if (links.length === 0) {
    console.log('\nYazılacak bir şey yok.');
    return;
  }

  // 4) UPSERT
  console.log('\nSupabase\'e yazılıyor...');
  const BATCH = 200;
  let total = 0;
  for (let i = 0; i < links.length; i += BATCH) {
    const chunk = links.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from('customer_autoixpert_links')
      .upsert(chunk, { onConflict: 'customer_id,autoixpert_contact_id', count: 'exact' });
    if (error) {
      console.error(`✗ Chunk ${i}-${i + chunk.length} hata:`, error.message);
      process.exit(1);
    }
    total += count ?? chunk.length;
  }
  console.log(`✓ ${total} link UPSERT edildi.`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
