import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(SB_URL, SB_ANON);

const ADMIN_EMAIL = 'cevikademm@gmail.com';
const ADMIN_PASS = 'Adem250455+';
const PROD_URL = 'https://gecit-kfz.vercel.app';

const { data, error } = await sb.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASS,
});
if (error) { console.error('SIGNIN HATA:', error); process.exit(1); }
console.log('Signed in. user.id:', data.user.id);

const token = data.session.access_token;

console.log('\n=== /api/invite-user TEST ===');
const r1 = await fetch(`${PROD_URL}/api/invite-user`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: `test-${Date.now()}@example.com`,
    fullName: 'Test Kullanici',
    role: 'customer',
    phone: '+905324961412',
  }),
});
console.log('status:', r1.status);
const t1 = await r1.text();
console.log('body:', t1);

console.log('\n=== /api/send-mail TEST ===');
const r2 = await fetch(`${PROD_URL}/api/send-mail`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    to: 'cevikademm@gmail.com',
    subject: 'CLI Test',
    template: 'generic',
    templateData: { heading: 'Test', message: 'CLI testidir' },
  }),
});
console.log('status:', r2.status);
console.log('body:', await r2.text());
