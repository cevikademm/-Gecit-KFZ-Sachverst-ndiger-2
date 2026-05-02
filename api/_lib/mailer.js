import nodemailer from 'nodemailer';

let _transporter = null;

export function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER veya SMTP_PASS environment variable eksik. Vercel → Settings → Environment Variables\'dan ekleyin.');
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure,
    tls: { ciphers: 'TLSv1.2', minVersion: 'TLSv1.2' },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  return _transporter;
}

export function getMailDefaults() {
  return {
    from: process.env.MAIL_FROM || `Gecit KFZ <${process.env.SMTP_USER}>`,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
  };
}

export async function sendMail({ to, subject, html, text, cc, bcc, attachments, headers }) {
  if (!to) throw new Error('Alıcı (to) zorunlu');
  if (!subject) throw new Error('Konu (subject) zorunlu');
  if (!html && !text) throw new Error('İçerik (html veya text) zorunlu');

  const transporter = getTransporter();
  const defaults = getMailDefaults();

  const info = await transporter.sendMail({
    from: defaults.from,
    replyTo: defaults.replyTo,
    to,
    cc,
    bcc,
    subject,
    text: text || stripHtml(html),
    html,
    attachments,
    headers: {
      'X-Mailer': 'Gecit-KFZ-App',
      ...headers,
    },
  });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

function stripHtml(html) {
  return String(html || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
