// Gutachten Agent — Edge Function client (frontend tarafı)
// supabase/functions/gutachten-agent/index.ts ile konuşur.

import { getSupabaseClient, getSession } from './supabaseAuth.js';

const FUNCTION_PATH = '/functions/v1/gutachten-agent';

function getFunctionUrl() {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase yapılandırılmamış');
  // Supabase JS v2: client'ın url'ine erişim
  const baseUrl = sb?.supabaseUrl || sb?.rest?.url?.replace(/\/rest\/v1\/?$/, '');
  if (!baseUrl) throw new Error('Supabase URL alınamadı');
  return baseUrl.replace(/\/$/, '') + FUNCTION_PATH;
}

async function callAgent(body) {
  const session = await getSession();
  if (!session?.access_token) throw new Error('Oturum yok — lütfen giriş yapın');

  const url = getFunctionUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody?.error || errMsg;
    } catch (e) { /* json parse hatası — text olarak oku */ }
    throw new Error(errMsg);
  }
  return res.json();
}

/**
 * Yeni agent oturumu başlat — ilk asistan mesajı döner.
 * @param {object} opts
 * @param {string} [opts.customerId]
 * @param {string} [opts.vehicleId]
 * @param {string} [opts.reportType]
 * @returns {Promise<{ session_id: string, message: string, status: string }>}
 */
export function startSession(opts = {}) {
  return callAgent({
    action: 'start',
    customer_id: opts.customerId || null,
    vehicle_id: opts.vehicleId || null,
    report_type: opts.reportType || null,
  });
}

/**
 * Kullanıcı mesajını gönder, asistan cevabını al.
 * Status 'completed' olunca draft döner — form'a inject edilebilir.
 * @returns {Promise<{ session_id: string, message: string, status: string, draft: object | null }>}
 */
export function sendMessage(sessionId, userMessage) {
  return callAgent({
    action: 'message',
    session_id: sessionId,
    user_message: userMessage,
  });
}

/**
 * Mevcut session'ı + tüm mesajlarını yükle (resume için).
 */
export function getSessionState(sessionId) {
  return callAgent({
    action: 'get',
    session_id: sessionId,
  });
}

/**
 * AI ile serbest metin üret (Unfallhergang, Gutachter-Bemerkung, vb.).
 * Wizard'daki "🪄 AI ile yaz" butonları bunu çağırır.
 * @param {string} kind - 'unfallhergang' | 'gutachter_bemerkung' | 'damage_description'
 * @param {object} context - Topladığın veriler (claimant, vehicle, accident, damages, calc...)
 * @returns {Promise<{ text: string, tokens_input: number, tokens_output: number }>}
 */
export function generateText(kind, context) {
  return callAgent({
    action: 'generate_text',
    kind,
    context,
  });
}
