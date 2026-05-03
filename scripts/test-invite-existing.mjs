import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data } = await sb.auth.signInWithPassword({
  email: 'cevikademm@gmail.com', password: 'Adem250455+',
});
const token = data.session.access_token;

const r = await fetch('https://gecit-kfz.vercel.app/api/invite-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: 'cevikademm@gmail.com',
    fullName: 'merhaba',
    role: 'customer',
    phone: '+905324961412',
  }),
});
console.log('status:', r.status);
console.log('body:', await r.text());
