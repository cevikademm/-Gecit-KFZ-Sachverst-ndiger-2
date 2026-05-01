// Paylaşılan Supabase Auth helper'ı.
// App.jsx ve Landing.jsx aynı auth akışını kullansın diye buraya çıkarıldı.
// Burada sadece auth + tek bir profil sorgusu var; CRUD App.jsx'in SupabaseOps'unda kalır.

import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kqbcbhtqxidegimidxfh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYmNiaHRxeGlkZWdpbWlkeGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTMwMDIsImV4cCI6MjA5MzEyOTAwMn0.cauDwrs0bZCEwmWifU2nFRK0O_ooOaJA5-TSEgs13sY';

const ENV_SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

function readLocalStorage(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

const SUPABASE_CONFIG = {
  url: readLocalStorage('gecit_kfz_supabase_url') || ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  anonKey: readLocalStorage('gecit_kfz_supabase_key') || ENV_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
};

let _client = null;

export function getSupabaseClient() {
  if (_client) return _client;
  const valid = SUPABASE_CONFIG.url.startsWith('https://')
    && !SUPABASE_CONFIG.url.includes('YOUR_PROJECT')
    && (SUPABASE_CONFIG.anonKey || '').length > 20;
  if (!valid) return null;
  _client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

/**
 * Supabase Auth ile giriş yap.
 * Başarılı olursa user_profiles satırını da yükleyip merge eder.
 * @returns {Promise<{ user: object | null, error: string | null }>}
 */
export async function signIn(email, password) {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, error: 'Supabase ayarları eksik' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  const { data: profile } = await sb.from('user_profiles')
    .select('*').eq('id', data.user.id).maybeSingle();
  return { user: { ...data.user, ...(profile || {}) }, error: null };
}

export async function signOut() {
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
