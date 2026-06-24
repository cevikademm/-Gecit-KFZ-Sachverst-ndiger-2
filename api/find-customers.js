// ═══════════════════════════════════════════════════════════════
// /api/find-customers — Müşteri Bulma (Apify Google Maps Scraper)
// ───────────────────────────────────────────────────────────────
// Mimari: Apify aktörü (compass~crawler-google-places) DAKİKALARCA
// sürebilir; Vercel fonksiyonu ise maxDuration=30s ile sınırlıdır.
// Bu yüzden ASYNC + POLL deseni kullanılır:
//   POST  → aktör run'ını BAŞLATIR, { runId, datasetId } döner (hızlı)
//   GET   → run durumunu sorar; SUCCEEDED ise dataset'i normalize edip döner
// Token SADECE sunucu tarafında (APIFY_TOKEN) — browser'a sızmaz.
// Yetki: yalnızca admin / super_admin (requireAdmin).
// ═══════════════════════════════════════════════════════════════

import { requireAdmin, readJsonBody } from './_lib/auth.js';

export const config = { runtime: 'nodejs' };

const APIFY_BASE = 'https://api.apify.com/v2';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  cors(res);

  // ── Yetki kontrolü ──
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'APIFY_TOKEN tanımlı değil (sunucu env).' });
  }
  const actor = (process.env.APIFY_GMAPS_ACTOR || 'compass~crawler-google-places').replace('/', '~');

  try {
    if (req.method === 'POST') return await startRun(req, res, token, actor);
    if (req.method === 'GET') return await pollRun(req, res, token);
    return res.status(405).json({ error: 'Sadece GET / POST kabul edilir' });
  } catch (err) {
    console.error('[find-customers] hata:', err);
    return res.status(500).json({ error: err.message || 'Apify isteği başarısız' });
  }
}

// ─── 1) Aktörü başlat ───────────────────────────────────────────
async function startRun(req, res, token, actor) {
  let body;
  try { body = await readJsonBody(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const {
    ulke = '',
    sehir = '',
    kategori = '',
    limit = 30,
    language = 'de',
  } = body || {};

  if (!kategori || !kategori.trim()) {
    return res.status(400).json({ error: 'Kategori (kategori) zorunlu' });
  }
  if (!sehir || !sehir.trim()) {
    return res.status(400).json({ error: 'Şehir (sehir) zorunlu' });
  }

  const maxPlaces = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 200);
  const locationQuery = [sehir.trim(), ulke.trim()].filter(Boolean).join(', ');

  // compass~crawler-google-places — yaygın desteklenen, güvenli input alanları
  const input = {
    searchStringsArray: [kategori.trim()],
    locationQuery,
    maxCrawledPlacesPerSearch: maxPlaces,
    language: (language || 'de').trim(),
    skipClosedPlaces: false,
  };

  const r = await apify(`/acts/${actor}/runs`, token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const data = r?.data || {};
  return res.status(202).json({
    ok: true,
    runId: data.id,
    datasetId: data.defaultDatasetId,
    status: data.status, // READY / RUNNING
  });
}

// ─── 2) Durumu sorgula + sonuçları çek ──────────────────────────
async function pollRun(req, res, token) {
  const runId = (req.query?.runId) || new URL(req.url, 'http://x').searchParams.get('runId');
  if (!runId) return res.status(400).json({ error: 'runId zorunlu' });

  const r = await apify(`/actor-runs/${runId}`, token, { method: 'GET' });
  const run = r?.data || {};
  const status = run.status; // READY|RUNNING|SUCCEEDED|FAILED|ABORTED|TIMING-OUT|TIMED-OUT
  const finishedOk = status === 'SUCCEEDED';
  const finishedBad = ['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status);

  if (!finishedOk) {
    return res.status(200).json({
      ok: true,
      status,
      finished: finishedBad,
      failed: finishedBad,
      items: [],
      progress: run.stats?.itemCount ?? null,
    });
  }

  // SUCCEEDED → dataset item'larını çek ve normalize et
  const datasetId = run.defaultDatasetId;
  const items = await apify(
    `/datasets/${datasetId}/items?clean=true&format=json`,
    token,
    { method: 'GET' },
    /* raw */ true,
  );
  const normalized = (Array.isArray(items) ? items : []).map(normalizePlace).filter(Boolean);

  return res.status(200).json({
    ok: true,
    status,
    finished: true,
    failed: false,
    count: normalized.length,
    items: normalized,
  });
}

// ─── Apify HTTP yardımcısı (token header'da, URL'de değil) ──────
async function apify(path, token, opts = {}, raw = false) {
  const resp = await fetch(`${APIFY_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await resp.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!resp.ok) {
    const msg = json?.error?.message || (text && text.length < 400 ? text : '') || `Apify HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return raw ? json : json;
}

// ─── Google Maps place → standart müşteri adayı şeması ──────────
function normalizePlace(item) {
  if (!item || typeof item !== 'object') return null;
  const loc = item.location || {};
  const email =
    (Array.isArray(item.emails) && item.emails[0]) ||
    item.email ||
    (item.contactDetails && Array.isArray(item.contactDetails.emails) && item.contactDetails.emails[0]) ||
    '';
  const closed = item.permanentlyClosed ? 'kapali'
    : (item.temporarilyClosed ? 'gecici_kapali' : 'acik');

  return {
    placeId: item.placeId || item.place_id || item.fid || item.cid || '',
    isim: item.title || item.name || '',
    kategori: item.categoryName || (Array.isArray(item.categories) && item.categories[0]) || '',
    adres: item.address || item.fullAddress || [item.street, item.city].filter(Boolean).join(', ') || '',
    sehir: item.city || '',
    telefon: item.phone || item.phoneUnformatted || '',
    email,
    website: item.website || item.webSite || '',
    puan: typeof item.totalScore === 'number' ? item.totalScore
      : (typeof item.rating === 'number' ? item.rating : null),
    yorum_sayisi: item.reviewsCount ?? item.reviewsCounts ?? item.reviewCount ?? null,
    lat: typeof loc.lat === 'number' ? loc.lat : null,
    lng: typeof loc.lng === 'number' ? loc.lng : null,
    google_maps_url: item.url || item.googleMapsUrl || '',
    durum: closed,
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
