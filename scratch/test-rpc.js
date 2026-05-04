import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY .env.local içinde yok.');
  console.error('Mevcut env:', Object.keys(process.env).filter((k) => k.includes('SUPABASE')));
  process.exit(1);
}

console.log('URL:', url);
console.log('Key (ilk 20):', key.slice(0, 20) + '…');

const sb = createClient(url, key, { auth: { persistSession: false } });

console.log('\n→ rebuild_junction_atomic boş çağrı testi:');
const { data, error } = await sb.rpc('rebuild_junction_atomic', {
  p_invoice_ids: [],
  p_links: [],
});

if (error) {
  console.log('HATA OBJESI:');
  console.log('  code   :', error.code);
  console.log('  message:', error.message);
  console.log('  details:', error.details);
  console.log('  hint   :', error.hint);
} else {
  console.log('BAŞARILI! data:', data);
}

console.log('\n→ debug_table_schema testi:');
const { data: d2, error: e2 } = await sb.rpc('debug_table_schema', {
  p_table: 'autoixpert_reports',
});
if (e2) {
  console.log('HATA:', e2.code, e2.message);
} else {
  console.log('BAŞARILI! kolon sayısı:', d2?.length);
}
