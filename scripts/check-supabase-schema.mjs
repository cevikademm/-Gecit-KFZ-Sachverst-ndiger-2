import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const EXPECTED = [
  'user_profiles', 'customers', 'vehicles', 'appraisals', 'invoices',
  'appointments', 'customer_documents', 'customer_notes', 'vehicle_notes',
  'lawyer_assignments', 'insurance_claims', 'reminders', 'activity_logs',
  'gallery_items', 'tuv_inspections', 'whatsapp_templates', 'file_flows',
  'lawyers', 'insurance_companies',
  'autoixpert_reports', 'autoixpert_contacts', 'autoixpert_invoices',
  'autoixpert_sync_log', 'autoixpert_id_mapping',
];

console.log('\n=== Supabase Tablo Kontrolü ===');
console.log(`URL: ${process.env.SUPABASE_URL}\n`);

const results = [];
for (const t of EXPECTED) {
  const { error, count } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    results.push({ table: t, status: 'EKSİK', detail: error.message, code: error.code });
  } else {
    results.push({ table: t, status: 'VAR', count: count ?? 0 });
  }
}

const missing = results.filter(r => r.status === 'EKSİK');
const present = results.filter(r => r.status === 'VAR');

console.log(`✓ Mevcut tablolar (${present.length}/${EXPECTED.length}):`);
for (const r of present) console.log(`  ${r.table.padEnd(30)} ${String(r.count).padStart(5)} satır`);

if (missing.length > 0) {
  console.log(`\n✗ EKSİK tablolar (${missing.length}):`);
  for (const r of missing) {
    console.log(`  ${r.table.padEnd(30)} → ${r.code || ''} ${r.detail.slice(0, 80)}`);
  }
}

console.log('\n=== is_admin() RPC Kontrolü ===');
const { error: rpcErr } = await sb.rpc('is_admin');
if (rpcErr) {
  console.log(`✗ is_admin() YOK veya hatalı: ${rpcErr.message.slice(0, 100)}`);
} else {
  console.log('✓ is_admin() çalışıyor');
}
