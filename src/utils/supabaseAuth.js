// Paylaşılan Supabase Auth helper'ı.
// App.jsx ve Landing.jsx aynı auth akışını kullansın diye buraya çıkarıldı.
// Burada sadece auth + tek bir profil sorgusu var; CRUD App.jsx'in SupabaseOps'unda kalır.

import { createClient } from '@supabase/supabase-js';

// Silinmiş eski Supabase projeleri — localStorage cache veya stale env'de
// kalmış olabilirler. isValidUrl/isValidKey bunları reddeder + cache scrub edilir.
const DEAD_PROJECT_REFS = ['kqbcbhtqxidegimidxfh'];

const ENV_SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

function readLocalStorage(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function removeLocalStorage(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// localStorage/env'de bozuk, placeholder veya silinmiş proje değeri varsa yoksay.
// Case-insensitive: 'YOUR_PROJECT', 'your-project', 'your_project' vb. hepsi yakalanır.
const containsDeadRef = (v) => typeof v === 'string' && DEAD_PROJECT_REFS.some((ref) => v.includes(ref));
const isValidUrl = (v) => typeof v === 'string'
  && v.startsWith('https://')
  && !/your[-_]?project/i.test(v)
  && v.includes('.supabase.co')
  && !containsDeadRef(v);
const isValidKey = (v) => typeof v === 'string'
  && v.length > 30
  && !v.includes('...')
  && !/eyJhbGc\.\.\./i.test(v)
  && !containsDeadRef(v);

let _lsUrl = readLocalStorage('gecit_kfz_supabase_url');
let _lsKey = readLocalStorage('gecit_kfz_supabase_key');

// Silinmiş eski projenin localStorage cache'i varsa scrub et — yeni env'e bağlanılsın.
if (containsDeadRef(_lsUrl) || containsDeadRef(_lsKey)) {
  removeLocalStorage('gecit_kfz_supabase_url');
  removeLocalStorage('gecit_kfz_supabase_key');
  _lsUrl = null;
  _lsKey = null;
}

const SUPABASE_CONFIG = {
  url: (isValidUrl(_lsUrl) && _lsUrl) || (isValidUrl(ENV_SUPABASE_URL) && ENV_SUPABASE_URL) || '',
  anonKey: (isValidKey(_lsKey) && _lsKey) || (isValidKey(ENV_SUPABASE_ANON_KEY) && ENV_SUPABASE_ANON_KEY) || '',
};

let _client = null;
let _warned = false;

export function getSupabaseClient() {
  if (_client) return _client;
  if (!isValidUrl(SUPABASE_CONFIG.url) || !isValidKey(SUPABASE_CONFIG.anonKey)) {
    if (!_warned) {
      console.error('[supabaseAuth] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil — .env.local veya Vercel env vars üzerinden ayarlayın.');
      _warned = true;
    }
    return null;
  }
  _client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

const PROFILE_COLS = 'role, full_name, linked_id, active';
const PROFILE_CACHE_PREFIX = 'gecit_kfz_profile_';

function readCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_PREFIX + userId);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return (p && p.role && p.active !== false) ? p : null;
  } catch (e) { return null; }
}

function writeCachedProfile(userId, profile) {
  try {
    if (profile && profile.role) {
      localStorage.setItem(PROFILE_CACHE_PREFIX + userId, JSON.stringify(profile));
    }
  } catch (e) {}
}

function clearCachedProfiles() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PROFILE_CACHE_PREFIX)) localStorage.removeItem(k);
    }
  } catch (e) {}
}

/**
 * Supabase Auth ile giriş yap.
 * Hızlı yol: profil cache'te varsa anında dön, arka planda revalide et.
 * Aksi halde profili çek ve cache'le.
 * @returns {Promise<{ user: object | null, error: string | null }>}
 */
export async function signIn(email, password) {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, error: 'Supabase ayarları eksik' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  const cached = readCachedProfile(data.user.id);
  if (cached) {
    sb.from('user_profiles').select(PROFILE_COLS).eq('id', data.user.id).maybeSingle()
      .then(({ data: fresh }) => { if (fresh) writeCachedProfile(data.user.id, fresh); })
      .catch(() => {});
    return { user: { ...data.user, ...cached }, error: null };
  }

  const { data: profile } = await sb.from('user_profiles')
    .select(PROFILE_COLS).eq('id', data.user.id).maybeSingle();
  if (profile) writeCachedProfile(data.user.id, profile);
  return { user: { ...data.user, ...(profile || {}) }, error: null };
}

export async function signOut() {
  clearCachedProfiles();
  const sb = getSupabaseClient();
  if (!sb) return;
  try { await sb.auth.signOut(); } catch (e) {}
}

export async function getSession() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

export function onAuthChange(callback) {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}

/**
 * Bir Supabase user.id için user_profiles kaydını döndürür.
 * Auth tamamsa ama profil yoksa veya inactive ise null döner.
 */
export async function fetchActiveProfile(userId) {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from('user_profiles')
    .select('*').eq('id', userId).maybeSingle();
  if (error || !data || data.active === false || !data.role) return null;
  return data;
}

/**
 * Profile satırından App'in beklediği session user objesini kurar.
 */
export function buildSessionUser(authUser, profile) {
  return {
    email: authUser.email,
    role: profile.role,
    name: profile.full_name || authUser.email,
    lawyer_id: profile.role === 'lawyer' ? profile.linked_id : undefined,
    insurer_id: profile.role === 'insurance' ? profile.linked_id : undefined,
  };
}
