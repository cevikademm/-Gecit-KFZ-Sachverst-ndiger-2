// =====================================================================
// VITE DEV PLUGIN — Test Hesapları API (yalnızca geliştirme)
// =====================================================================
// Tarayıcıdaki admin paneli, service-role anahtarını ASLA görmemeli.
// Bu plugin yalnızca `vite` dev sunucusunda (apply: 'serve') çalışır ve
// service-role işlemlerini Node tarafında (dev sunucu süreci) yürütür.
//   GET  /api/dev/test-accounts          → listele
//   POST /api/dev/test-accounts/seed     → üret  { counts, withDemoData }
//   POST /api/dev/test-accounts/delete   → sil   { all } | { targets }
// Production build'e dahil edilmez.
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { seedTestAccounts, listTestAccounts, deleteTestAccounts } from './testAccounts.js';

export default function testAccountsDevPlugin(env = {}) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  let _admin = null;
  const admin = () => {
    if (!url || !key) return null;
    if (!_admin) _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return _admin;
  };

  const send = (res, status, obj) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
  };
  const readBody = (req) => new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });

  return {
    name: 'gecit-test-accounts-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (!path.startsWith('/api/dev/test-accounts')) return next();

        const sb = admin();
        if (!sb) return send(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil (.env.local).' });

        try {
          if (req.method === 'GET' && path === '/api/dev/test-accounts') {
            const projectRef = (String(url).match(/https:\/\/([a-z0-9]+)\.supabase\.co/i) || [])[1] || null;
            return send(res, 200, { ...(await listTestAccounts(sb)), projectRef });
          }
          if (req.method === 'POST' && path === '/api/dev/test-accounts/seed') {
            const body = await readBody(req);
            return send(res, 200, await seedTestAccounts(sb, body));
          }
          if (req.method === 'POST' && path === '/api/dev/test-accounts/delete') {
            const body = await readBody(req);
            return send(res, 200, await deleteTestAccounts(sb, body));
          }
          return send(res, 404, { error: 'bilinmeyen endpoint' });
        } catch (e) {
          server.config.logger.error('[test-accounts] ' + (e?.stack || e?.message || e));
          return send(res, 500, { error: String(e?.message || e) });
        }
      });
    },
  };
}
