// AutoiXpert PDF/dokümant proxy — admin yetki kontrolü + sunucu taraflı API key
// Tarayıcıdan gelen istekleri AutoiXpert'in /reports/{id}/documents/{doc_id}/download
// endpoint'ine bearer auth ile iletir. PDF olarak browser'a stream eder.
//
// Endpoint: GET /api/autoixpert-document?report=<id>&document=<id>

import { requireAdmin } from './_lib/auth.js';

export const config = { runtime: 'nodejs' };

const AUTOIXPERT_BASE = (process.env.AUTOIXPERT_API_BASE_URL || 'https://app.autoixpert.de/externalApi/v1').replace(/\/+$/, '');
const ALLOW_ID = /^[A-Za-z0-9_-]{1,80}$/;

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
  const documentId = String(req.query?.document || '').trim();

  if (!reportId || !documentId) {
    return res.status(400).json({ error: 'report ve document parametreleri zorunlu' });
  }
  if (!ALLOW_ID.test(reportId) || !ALLOW_ID.test(documentId)) {
    return res.status(400).json({ error: 'Geçersiz id formatı' });
  }

  const url = `${AUTOIXPERT_BASE}/reports/${encodeURIComponent(reportId)}/documents/${encodeURIComponent(documentId)}/download`;

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/pdf, application/octet-stream',
      },
    });

    if (!upstream.ok) {
      const errText = await safeReadText(upstream);
      return res.status(upstream.status).json({
        error: `AutoiXpert ${upstream.status}`,
        details: errText.slice(0, 500),
      });
    }

    const ct = upstream.headers.get('content-type') || 'application/pdf';
    const cd = upstream.headers.get('content-disposition');
    res.setHeader('Content-Type', ct);
    if (cd) res.setHeader('Content-Disposition', cd);
    res.setHeader('Cache-Control', 'private, max-age=300');

    const arrayBuffer = await upstream.arrayBuffer();
    res.status(200).end(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error('[autoixpert-document] hata:', e);
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
