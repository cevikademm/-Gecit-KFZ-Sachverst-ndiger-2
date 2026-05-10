#!/usr/bin/env node
// AutoiXpert → customers / vehicles / appraisals senkron.
// Her autoixpert_reports.claimant'ı bireysel müşteri olarak customers'a aktarır,
// raporun car bilgisini vehicles'a, raporun kendisini appraisals'a yazar.
//
// Email + phone + ad-soyad ile dedupe — aynı kişi çoklu raporda olabilir.
//
// Çalıştırma:
//   node --env-file=.env.local scripts/autoixpert/sync-to-customers.js
//   node --env-file=.env.local scripts/autoixpert/sync-to-customers.js --dry-run
//
// Idempotent: tekrar çalıştırılırsa upsert eder, yeni kayıt yaratmaz.

import { createClient } from '@supabase/supabase-js';

const ARGS = (() => {
  const a = { dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') a.dryRun = true;
  }
  return a;
})();

function need(n) { const v = process.env[n]; if (!v?.trim()) { console.error('✗', n); process.exit(1); } return v.trim(); }

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function buildCustomerKey(claimant) {
  // Match key: email > phone > ad+soyad
  const email = claimant?.email?.trim().toLowerCase();
  if (email) return 'email:' + email;
  const phone = (claimant?.phone || claimant?.phone2 || '').replace(/\D/g, '');
  if (phone.length >= 7) return 'phone:' + phone;
  const name = normalizeKey((claimant?.first_name || '') + (claimant?.last_name || '') + (claimant?.organization_name || ''));
  if (name.length >= 4) return 'name:' + name;
  return null;
}

function deriveCustomerType(claimant) {
  // claimant.organization_name dolu ise kurumsal, değilse bireysel
  if (claimant?.organization_name?.trim() && !claimant?.first_name) return 'kurumsal';
  return 'bireysel';
}

function pickCustomerFields(claimant, src) {
  return {
    full_name: [claimant?.first_name, claimant?.last_name].filter(Boolean).join(' ').trim() || null,
    company: claimant?.organization_name || null,
    email: claimant?.email?.trim() || null,
    phone: claimant?.phone || null,
    phone2: claimant?.phone2 || null,
    type: deriveCustomerType(claimant),
    tax_no: claimant?.vat_id || null,
    address: claimant?.street_and_housenumber_or_lockbox || null,
    zip: claimant?.zip || null,
    city: claimant?.city || null,
    street: claimant?.street_and_housenumber_or_lockbox || null,
    notes: claimant?.notes || null,
    source: src || 'autoixpert',
  };
}

function toInt(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function pickVehicleFields(car) {
  // Plate NOT NULL — fallback VIN, sonra "?" string
  const plate = car?.license_plate || car?.vin || '?';
  return {
    plate,
    brand: car?.make || null,
    model: car?.model || null,
    year: toInt(String(car?.first_registration_date || '').slice(0, 4)),
    chassis: car?.vin || null,
    km: toInt(car?.mileage_meter ?? car?.mileage_estimated),
    color: car?.color || null,
    fuel: car?.engine_type || null,
    engine_cc: toInt(car?.engine_displacement_in_ccm),
    performance_kw: toInt(car?.performance_kw),
    shape: car?.shape || car?.custom_shape_label || null,
    first_registration_date: car?.first_registration_date || null,
    // TÜV / Hauptuntersuchung — AutoiXpertDetail.jsx:289'da "Nächste HU" alanı
    // car.next_general_inspection_date (DATE) → vehicles.tuv_date (TEXT)
    tuv_date: car?.next_general_inspection_date || null,
    hsn: car?.hsn || null,
    tsn: car?.tsn || null,
  };
}

function pickAppraisalFields(report) {
  // Status mapping: AutoiXpert → Gecit
  // STAGES (App.jsx) ile uyumlu: bekliyor | mekanik | kaporta | rapor | tamamlandi
  const stateMap = {
    done: 'tamamlandi',
    recorded: 'rapor',
    locked: 'tamamlandi',
    deleted: 'tamamlandi',
  };
  return {
    status: stateMap[report.state] || 'rapor',
    date: report.completion_date || report.order_date || (report.created_at?.slice(0, 10)),
    expert: report.responsible_assessor_id || null,
    notes: report.token ? `AutoiXpert: ${report.token}` : null,
    autoixpert_report_id: report.id,
    report_token: report.token || null,
    report_type: report.type || null,
    source: 'autoixpert',
  };
}

async function pageAll(qBuilder) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await qBuilder.range(from, from + 99);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 100) break;
    from += 100;
  }
  return all;
}

async function main() {
  const sb = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

  console.log('━'.repeat(60));
  console.log('AutoiXpert → customers / vehicles / appraisals senkron');
  console.log('━'.repeat(60));
  console.log('Dry-run:', ARGS.dryRun ? 'YES' : 'no');

  // 1. Mevcut customers'ı yükle (email index + autoixpert_contact_id index)
  const existingCustomers = await pageAll(sb.from('customers').select('id, email, phone, full_name, company, autoixpert_contact_id, source'));
  const customerByKey = new Map();
  const customerByContactId = new Map();
  for (const c of existingCustomers) {
    const key = buildCustomerKey({ email: c.email, phone: c.phone, first_name: c.full_name, organization_name: c.company });
    if (key) customerByKey.set(key, c);
    if (c.autoixpert_contact_id) customerByContactId.set(c.autoixpert_contact_id, c);
  }
  console.log('Mevcut customers:', existingCustomers.length);

  // 2. AutoiXpert reports — claimant + car bilgisi
  const reports = await pageAll(sb.from('autoixpert_reports').select('id, token, type, state, completion_date, order_date, created_at, responsible_assessor_id, claimant, car'));
  console.log('AutoiXpert reports:', reports.length);

  // 3. AutoiXpert contacts (claimant'larla email match için)
  const contacts = await pageAll(sb.from('autoixpert_contacts').select('id, email, phone, phone2, first_name, last_name, organization_name, organization_type'));
  const contactByEmail = new Map();
  const contactByKey = new Map();
  for (const c of contacts) {
    if (c.email) contactByEmail.set(c.email.toLowerCase(), c);
    const k = buildCustomerKey(c);
    if (k && !contactByKey.has(k)) contactByKey.set(k, c);
  }
  console.log('AutoiXpert contacts:', contacts.length);
  console.log('━'.repeat(60));

  // 4. Mapping: claimant key → customer + autoixpert_contact match
  const newCustomers = [];      // [{ id, ...fields }]
  const updateCustomers = [];   // [{ id, ...fields }]
  const newVehicles = [];       // [{ id, owner_id, ...fields }]
  const updateVehicles = [];    // [{ id, ...fields }]
  const newAppraisals = [];     // [{ id, vehicle_id, ...fields }]
  const updateAppraisals = [];  // [{ id, ...fields }]
  const newLinks = [];          // [{ customer_id, autoixpert_contact_id, ... }]

  // Map: report_id → vehicle_id (sonra appraisals için lazım)
  const reportToVehicle = new Map();
  // Map: customerKey → customer.id (yeni yaratılanlar için)
  const customerKeyToId = new Map();

  for (const r of reports) {
    const claimant = r.claimant;
    if (!claimant) continue;

    const key = buildCustomerKey(claimant);
    if (!key) continue;

    // Eşleşen autoixpert_contact var mı?
    const matchedContact = contactByEmail.get(claimant.email?.toLowerCase()) || contactByKey.get(key);

    let customer = customerByKey.get(key);
    if (matchedContact) {
      customer = customer || customerByContactId.get(matchedContact.id);
    }

    let customerId;
    if (customer) {
      customerId = customer.id;
      // Update: eksik alanları doldur, autoixpert_contact_id set et
      const fields = pickCustomerFields(claimant, customer.source || 'autoixpert');
      const patched = { id: customer.id };
      // Sadece NULL/eksik alanları override et — manuel girilen veriyi koru
      for (const [k, v] of Object.entries(fields)) {
        if (v != null && (customer[k] == null || customer[k] === '')) {
          patched[k] = v;
        }
      }
      if (matchedContact && !customer.autoixpert_contact_id) {
        patched.autoixpert_contact_id = matchedContact.id;
      }
      if (Object.keys(patched).length > 1) {
        updateCustomers.push(patched);
      }
    } else {
      // Yeni customer yarat
      customerId = 'c' + uid();
      const fields = pickCustomerFields(claimant, 'autoixpert');
      newCustomers.push({
        id: customerId,
        ...fields,
        autoixpert_contact_id: matchedContact?.id || null,
      });
      customerByKey.set(key, { id: customerId, ...fields });
      if (matchedContact) {
        newLinks.push({
          customer_id: customerId,
          autoixpert_contact_id: matchedContact.id,
          match_method: claimant.email ? 'email' : (claimant.phone ? 'phone' : 'name_company'),
          confidence: claimant.email ? 0.95 : 0.75,
          is_confirmed: false,
        });
      }
    }
    customerKeyToId.set(key, customerId);

    // Vehicle: rapor başına 1 araç (chassis VIN ile dedupe)
    const car = r.car || {};
    const vehicleId = 'v' + uid();
    const vFields = pickVehicleFields(car);
    if (vFields.plate || vFields.chassis) {
      newVehicles.push({
        id: vehicleId,
        owner_id: customerId,
        ...vFields,
        autoixpert_report_id: r.id,
      });
      reportToVehicle.set(r.id, vehicleId);

      // Appraisal: rapor başına 1
      newAppraisals.push({
        id: 'ap' + uid(),
        vehicle_id: vehicleId,
        ...pickAppraisalFields(r),
      });
    }
  }

  console.log('Plan:');
  console.log('  Yeni customer       :', newCustomers.length);
  console.log('  Güncel customer     :', updateCustomers.length);
  console.log('  Yeni vehicle        :', newVehicles.length);
  console.log('  Yeni appraisal      :', newAppraisals.length);
  console.log('  Yeni link           :', newLinks.length);

  if (ARGS.dryRun) {
    console.log('\nDry-run, hiçbir şey yazılmadı.');
    return;
  }

  // 5. Upsert işlemleri
  console.log('\n━ INSERT/UPDATE ━');

  // Customers — önce idempotent mevcut autoixpert_report bağlı olanları temizle (re-run için)
  // Aslında autoixpert_report_id zaten unique, vehicle ve appraisal'ı bu üzerinden idempotent yapabiliriz.

  // Mevcut autoixpert kaynaklı vehicles + appraisals'ı sil — temiz başla
  const existingAxVehicles = await pageAll(sb.from('vehicles').select('id, autoixpert_report_id').not('autoixpert_report_id','is',null));
  const existingAxAppraisals = await pageAll(sb.from('appraisals').select('id, autoixpert_report_id').not('autoixpert_report_id','is',null));
  if (existingAxVehicles.length > 0) {
    console.log('  Eski autoixpert vehicle siliniyor:', existingAxVehicles.length);
    const ids = existingAxVehicles.map(v => v.id);
    for (let i = 0; i < ids.length; i += 200) {
      const slice = ids.slice(i, i + 200);
      const { error } = await sb.from('vehicles').delete().in('id', slice);
      if (error) console.log('    ✗', error.message);
    }
  }
  if (existingAxAppraisals.length > 0) {
    console.log('  Eski autoixpert appraisal siliniyor:', existingAxAppraisals.length);
    const ids = existingAxAppraisals.map(v => v.id);
    for (let i = 0; i < ids.length; i += 200) {
      const slice = ids.slice(i, i + 200);
      const { error } = await sb.from('appraisals').delete().in('id', slice);
      if (error) console.log('    ✗', error.message);
    }
  }

  // Yeni customers (chunk insert)
  for (let i = 0; i < newCustomers.length; i += 100) {
    const chunk = newCustomers.slice(i, i + 100);
    const { error } = await sb.from('customers').insert(chunk);
    if (error) {
      console.log('  ✗ customer insert err:', error.code, error.message);
      // Tek tek dene
      for (const c of chunk) {
        const { error: e2 } = await sb.from('customers').insert(c);
        if (e2) console.log('    ↳', c.full_name || c.company, '→', e2.code, e2.message?.slice(0, 80));
      }
    }
  }
  console.log('  ✓ Yeni customer:', newCustomers.length);

  // Update customers
  for (const u of updateCustomers) {
    const { id, ...patch } = u;
    const { error } = await sb.from('customers').update(patch).eq('id', id);
    if (error) console.log('  ✗ customer update', id, error.message);
  }
  console.log('  ✓ Customer update:', updateCustomers.length);

  // Vehicles — chunk fail olursa tek tek dene
  let vehicleOk = 0;
  let vehicleFail = 0;
  const failedVehicleIds = new Set();
  for (let i = 0; i < newVehicles.length; i += 100) {
    const chunk = newVehicles.slice(i, i + 100);
    const { error } = await sb.from('vehicles').insert(chunk);
    if (!error) { vehicleOk += chunk.length; continue; }
    // Tek tek
    for (const v of chunk) {
      const { error: e2 } = await sb.from('vehicles').insert(v);
      if (e2) {
        vehicleFail++;
        failedVehicleIds.add(v.id);
        if (vehicleFail <= 5) console.log('    ↳ veh', v.plate, v.brand, '→', e2.code, e2.message?.slice(0, 100));
      } else {
        vehicleOk++;
      }
    }
  }
  console.log(`  ✓ Vehicle: ${vehicleOk} | ✗ ${vehicleFail}`);

  // Appraisals — failed vehicle'ları olanları skiple
  const validAppraisals = newAppraisals.filter((a) => !failedVehicleIds.has(a.vehicle_id));
  let appraisalOk = 0;
  let appraisalFail = 0;
  for (let i = 0; i < validAppraisals.length; i += 100) {
    const chunk = validAppraisals.slice(i, i + 100);
    const { error } = await sb.from('appraisals').insert(chunk);
    if (!error) { appraisalOk += chunk.length; continue; }
    for (const a of chunk) {
      const { error: e2 } = await sb.from('appraisals').insert(a);
      if (e2) {
        appraisalFail++;
        if (appraisalFail <= 5) console.log('    ↳ appr', a.report_token, '→', e2.code, e2.message?.slice(0, 100));
      } else {
        appraisalOk++;
      }
    }
  }
  console.log(`  ✓ Appraisal: ${appraisalOk} | ✗ ${appraisalFail}`);

  // Links (idempotent)
  for (const l of newLinks) {
    const { error } = await sb.from('customer_autoixpert_links').upsert(l, { onConflict: 'customer_id,autoixpert_contact_id' });
    if (error && !error.message.includes('duplicate')) console.log('  ✗ link', l.customer_id, error.message);
  }
  console.log('  ✓ Link:', newLinks.length);

  console.log('\n━ TAMAM ━');
}

main().catch((e) => { console.error('Fatal:', e.message); console.error(e.stack); process.exit(1); });
