// AutoiXpert foto proxy — admin yetki kontrolü + sunucu taraflı API key
// Tarayıcıdan gelen istekleri AutoiXpert API'sine bearer auth ile iletir.
// Endpoint: GET /api/autoixpert-photo?report=<report_id>&photo=<photo_id>
//
// Varyantlar:
//   ?variant=original (default) | thumbnail
//
// Notlar:
//   - API anahtarı sadece sunucuda tutulur (AUTOIXPERT_API_KEY env).
//   - Yetki: requireAdmin (super_admin/admin) → şu an avukat panelinden de kapalı.
//   - 5 dakikalık tarayıcı cache (admin görüntüsü, hassas değil).

import { requireAdmin } from './_lib/auth.js';

export const config = { runtime: 'nodejs' };

const AUTOIXPERT_BASE = (process.env.AUTOIXPERT_API_BASE_URL || 'https://app.autoixpert.de/externalApi/v1').replace(/\/+$/, '');
const ALLOW_ID = /^[A-Za-z0-9_-]{1,80}$/; // path injection'a karşı whitelist

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  cors(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sadece GET kabul edilir' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const apiKey = process.env.AUTOIXPERT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AUTOIXPERT_API_KEY env ayarlı değil' });
  }

  const reportId = String(req.query?.report || '').trim();
  const photoId = String(req.query?.photo || '').trim();
  const variant = String(req.query?.variant || 'original').trim();

  if (!reportId || !photoId) {
    return res.status(400).json({ error: 'report ve photo parametreleri zorunlu' });
  }
  if (!ALLOW_ID.test(reportId) || !ALLOW_ID.test(photoId)) {
    return res.status(400).json({ error: 'Geçersiz id formatı' });
  }
  if (!['original', 'thumbnail'].includes(variant)) {
    return res.status(400).json({ error: 'variant: original | thumbnail' });
  }

  const url = `${AUTOIXPERT_BASE}/reports/${encodeURIComponent(reportId)}/photos/${encodeURIComponent(photoId)}`;

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*, application/octet-stream',
      },
    });

    if (!upstream.ok) {
      // Upstream hata gövdesini text olarak okuyup ileri ver (kısa)
      const errText = await safeReadText(upstream);
      return res.status(upstream.status).json({
        error: `AutoiXpert ${upstream.status}`,
        details: errText.slice(0, 500),
      });
    }

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=300');

    const arrayBuffer = await upstream.arrayBuffer();
    res.status(200).end(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error('[autoixpert-photo] hata:', e);
    return res.status(502).json({ error: 'Upstream bağlantı hatası', details: e?.message });
  }
}

async function safeReadText(res) {
  try { return await res.text(); } catch { return ''; }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
