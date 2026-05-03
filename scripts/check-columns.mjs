import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Migrate 400/409 atan tablolar — hangi kolonlar var?
const TABLES = [
  'customers', 'vehicles', 'appraisals', 'invoices', 'appointments',
  'customer_documents', 'customer_notes', 'vehicle_notes',
  'lawyer_assignments', 'insurance_claims', 'reminders', 'activity_logs',
];

for (const t of TABLES) {
  const { data, error } = await sb.from(t).select('*').limit(1);
  if (error) { console.log(`${t}: HATA — ${error.message}`); continue; }
  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
  console.log(`\n${t} (${cols.length} kolon):`);
  console.log(`  ${cols.join(', ')}`);
}
