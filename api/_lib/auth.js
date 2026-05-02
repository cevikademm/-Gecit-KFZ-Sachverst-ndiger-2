import { createClient } from '@supabase/supabase-js';

let _adminClient = null;

export function getAdminClient() {
  if (_adminClient) return _adminClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik');
  }
  _adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}

export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { ok: false, status: 401, error: 'Authorization header eksik' };
  }

  const admin = getAdminClient();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    return { ok: false, status: 401, error: 'Geçersiz token' };
  }
  const uid = userRes.user.id;

  const { data: profile, error: profErr } = await admin
    .from('user_profiles')
    .select('id, role, active, full_name, email')
    .eq('id', uid)
    .single();

  if (profErr || !profile) {
    return { ok: false, status: 403, error: 'Profil bulunamadı' };
  }
  if (!profile.active) {
    return { ok: false, status: 403, error: 'Hesap pasif' };
  }
  if (!['super_admin', 'admin'].includes(profile.role)) {
    return { ok: false, status: 403, error: 'Yetki yok (admin gerekli)' };
  }

  return { ok: true, user: userRes.user, profile };
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(new Error('Geçersiz JSON body')); }
    });
    req.on('error', reject);
  });
}
