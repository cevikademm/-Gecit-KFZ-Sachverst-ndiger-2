export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  const env = {
    SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT ? 'SET' : 'MISSING',
    SMTP_SECURE: process.env.SMTP_SECURE ? 'SET' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER ? 'SET' : 'MISSING',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'MISSING',
    MAIL_FROM: process.env.MAIL_FROM ? 'SET' : 'MISSING',
    MAIL_REPLY_TO: process.env.MAIL_REPLY_TO ? 'SET' : 'MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    NODE_VERSION: process.version,
  };
  res.status(200).json({ ok: true, env, time: new Date().toISOString() });
}
