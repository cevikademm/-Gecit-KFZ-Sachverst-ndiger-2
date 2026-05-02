import { getSession } from './supabaseAuth.js';

const API_BASE = (typeof window !== 'undefined' && window.location?.origin) || '';

async function authHeader() {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function postJson(path, body) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function inviteUser({ email, fullName, role, linkedId, phone }) {
  return postJson('/api/invite-user', { email, fullName, role, linkedId, phone });
}

export async function sendMail({ to, subject, message, ctaLabel, ctaUrl, html, cc, bcc }) {
  if (html) {
    return postJson('/api/send-mail', { to, subject, html, cc, bcc });
  }
  return postJson('/api/send-mail', {
    to,
    subject,
    template: 'generic',
    templateData: { heading: subject, message, ctaLabel, ctaUrl },
    cc,
    bcc,
  });
}

export async function sendReportReady({ to, name, reportNumber, reportUrl, subject }) {
  return postJson('/api/send-mail', {
    to,
    subject: subject || `Gutachten ${reportNumber || ''} hazır`,
    template: 'report-ready',
    templateData: { name, reportNumber, reportUrl },
  });
}
