// =====================================================================
// VITE DEV PLUGIN — Vercel serverless fonksiyonlarını dev'de servis et
// =====================================================================
// `vite dev` (localhost:5500) yalnızca frontend'i servis eder; `api/*.js`
// dosyaları Vercel fonksiyonlarıdır ve normalde sadece prod'da / `vercel dev`
// ile çalışır. Bu plugin, dev sunucusunda /api/<isim> isteklerini ilgili
// api/<isim>.js handler'ına yönlendirir ve Vercel-benzeri (req/res) ortamı
// taklit eder. Böylece send-mail, invite-user, find-customers vb. lokalde de çalışır.
//
// - Yalnızca dev'de (apply: 'serve'); production build'e dahil edilmez.
// - .env.local (VITE_ öneksiz dahil) değişkenleri process.env'e enjekte edilir,
//   handler'lar process.env.APIFY_TOKEN / SUPABASE_SERVICE_ROLE_KEY okuyabilsin.
// - /api/dev/* yolları (test-accounts plugin'i) burada atlanır.
// =====================================================================

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default function apiFunctionsDevPlugin(env = {}) {
  return {
    name: 'gecit-api-functions-dev',
    apply: 'serve',
    configureServer(server) {
      // Env'i Node sürecine taşı (handler'lar process.env okur)
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const pathOnly = rawUrl.split('?')[0];
        if (!pathOnly.startsWith('/api/')) return next();
        // /api/dev/* → test-accounts plugin'ine bırak
        if (pathOnly.startsWith('/api/dev/')) return next();

        const name = pathOnly.replace(/^\/api\//, '').replace(/\/+$/, '');
        if (!name) return next();

        const file = resolve(process.cwd(), 'api', `${name}.js`);
        if (!existsSync(file)) return next();

        // ── Vercel-benzeri res helper'ları ──
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
          return res;
        };
        res.send = (data) => {
          res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
          return res;
        };

        // ── query parse ──
        try {
          const u = new URL(rawUrl, 'http://localhost');
          req.query = Object.fromEntries(u.searchParams.entries());
        } catch { req.query = {}; }

        // ── body'yi önceden oku (race-condition'ı önle) → req.body ──
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          const raw = await new Promise((resolveBody) => {
            let buf = '';
            req.on('data', (c) => { buf += c; });
            req.on('end', () => resolveBody(buf));
            req.on('error', () => resolveBody(''));
          });
          try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
        }

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          const handler = mod?.default;
          if (typeof handler !== 'function') return next();
          await handler(req, res);
        } catch (e) {
          server.config.logger.error(`[dev-api] /api/${name} → ${e?.stack || e?.message || e}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: String(e?.message || e) }));
          }
        }
      });
    },
  };
}
