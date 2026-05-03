import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Tüm tabloların gerçek kolonlarını PostgREST üzerinden bir-örnek-INSERT ile öğrenelim.
// "Insert with returning" hatası bilinmeyen kolon adı veriyorsa hangileri zorunlu görürüz.
// Daha temiz yol: PostgREST'in OPTIONS endpoint'i column metadata verir.

const TABLES = [
  'customers', 'vehicles', 'appraisals', 'invoices', 'appointments',
  'customer_documents', 'customer_notes', 'vehicle_notes',
  'lawyer_assignments', 'insurance_claims', 'reminders', 'activity_logs',
  'lawyers', 'insurance_companies', 'insurers', 'gallery', 'gallery_items',
  'tuv_inspections', 'whatsapp_templates', 'file_flows',
  'lawyer_tasks', 'lawyer_cases', 'court_dates', 'insurance_offers',
  'damage_photos', 'damage_timeline', 'messages', 'notifications',
  'satisfaction_surveys', 'objection_templates', 'live_feed', 'paint_maps',
  'insurance_assignments',
];

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const result = {};

for (const t of TABLES) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Profile': 'public', 'Prefer': 'return=representation' }
  });
  if (r.status === 404 || r.status === 406) {
    result[t] = { exists: false };
    continue;
  }
  if (!r.ok) {
    const txt = await r.text();
    result[t] = { exists: false, error: txt.slice(0, 100) };
    continue;
  }
  // "Content-Range" header bize satır sayısını verir, kolon değil. Bunun için description fetch:
  const r2 = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' }
  });
  if (!r2.ok) { result[t] = { exists: true, cols: '?' }; continue; }
  const openapi = await r2.json();
  const def = openapi.definitions?.[t];
  if (def?.properties) {
    result[t] = { exists: true, cols: Object.keys(def.properties), required: def.required || [] };
  } else {
    result[t] = { exists: true, cols: '?' };
  }
}

console.log(JSON.stringify(result, null, 2));
