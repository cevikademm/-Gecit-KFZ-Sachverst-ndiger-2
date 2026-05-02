import { sendMail } from './_lib/mailer.js';
import { requireAdmin, readJsonBody } from './_lib/auth.js';
import { genericTemplate, reportReadyTemplate } from './_lib/templates.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  cors(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST kabul edilir' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  let body;
  try { body = await readJsonBody(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const {
    to,
    subject,
    template,
    templateData,
    html: customHtml,
    text,
    cc,
    bcc,
  } = body || {};

  if (!to) return res.status(400).json({ error: 'Alıcı (to) zorunlu' });
  if (!subject) return res.status(400).json({ error: 'Konu (subject) zorunlu' });

  let html = customHtml;
  if (!html && template) {
    if (template === 'generic') html = genericTemplate(templateData || {});
    else if (template === 'report-ready') html = reportReadyTemplate(templateData || {});
    else return res.status(400).json({ error: `Bilinmeyen şablon: ${template}` });
  }
  if (!html && !text) return res.status(400).json({ error: 'İçerik (html, text veya template) zorunlu' });

  try {
    const result = await sendMail({ to, subject, html, text, cc, bcc });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[send-mail] hata:', err);
    return res.status(500).json({ error: err.message || 'Mail gönderim hatası' });
  }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
