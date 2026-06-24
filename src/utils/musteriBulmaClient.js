// Müşteri Bulma — frontend client.
// /api/find-customers (Apify Google Maps scraper) ile konuşur.
// Mimari: POST run başlatır → GET ile durum poll edilir → SUCCEEDED'da sonuçlar gelir.
// Token sunucu tarafında; burada yalnızca Supabase oturum token'ı ile yetkileniriz.

import { getSession } from './supabaseAuth.js';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const host = window.location.host;
  if (host === 'kfzgutachter.ac') return 'https://www.kfzgutachter.ac';
  return window.location.origin;
})();

async function authHeader() {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function parse(res) {
  const rawText = await res.text().catch(() => '');
  let data = null;
  try { data = rawText ? JSON.parse(rawText) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    const msg = data?.error || (rawText && rawText.length < 500 ? rawText : '') ||
      `HTTP ${res.status} (${res.statusText || 'Hata'})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Arama run'ını başlatır → { runId, datasetId, status }
export async function startSearch({ ulke, sehir, kategori, limit, language }) {
  const res = await fetch(`${API_BASE}/api/find-customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ ulke, sehir, kategori, limit, language }),
  });
  return parse(res);
}

// Run durumunu sorgular → { status, finished, failed, items }
export async function pollSearch(runId) {
  const res = await fetch(`${API_BASE}/api/find-customers?runId=${encodeURIComponent(runId)}`, {
    method: 'GET',
    headers: { ...(await authHeader()) },
  });
  return parse(res);
}

// Tüm akışı yönetir: başlat → bitene kadar poll et. onProgress(status) ile UI bilgilendirilir.
// signal: AbortController.signal ile iptal edilebilir.
export async function runSearch(params, { onProgress, signal, intervalMs = 4000, maxWaitMs = 240000 } = {}) {
  const started = await startSearch(params);
  const runId = started.runId;
  if (!runId) throw new Error('Apify run başlatılamadı.');
  if (onProgress) onProgress({ status: started.status || 'RUNNING', items: 0 });

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error('İptal edildi');
    await new Promise((r) => setTimeout(r, intervalMs));
    if (signal?.aborted) throw new Error('İptal edildi');

    const st = await pollSearch(runId);
    if (onProgress) onProgress({ status: st.status, items: st.progress ?? st.count ?? 0 });

    if (st.failed) throw new Error(`Arama başarısız oldu (durum: ${st.status}).`);
    if (st.finished && Array.isArray(st.items)) {
      return { runId, items: st.items };
    }
  }
  throw new Error('Arama zaman aşımına uğradı. Daha düşük bir limitle tekrar deneyin.');
}
