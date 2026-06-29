import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import testAccountsDevPlugin from './dev-tools/vitePluginTestAccounts.js';
import apiFunctionsDevPlugin from './dev-tools/vitePluginApiFunctions.js';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Tüm env değişkenlerini (VITE_ öneksizler dahil) Node tarafına yükle.
  // SUPABASE_SERVICE_ROLE_KEY yalnızca dev plugin (Node) içinde kullanılır,
  // tarayıcı bundle'ına ASLA girmez.
  const env = loadEnv(mode, process.cwd(), '');

  // ── Production build guard (build-time fail-fast) ───────────────────────────
  // Üretim build'i VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY OLMADAN alınırsa,
  // bundle'a Supabase config gömülmez → getSupabaseClient() null döner →
  // her kullanıcı login'de "Bağlantı hatası: ... localStorage.clear()" görür.
  // (Bu, kfzgutachter.ac'de yaşanan kesintinin tam kök nedeniydi.)
  // Bu guard, config'siz bir build'in SESSİZCE üretime çıkmasını engeller:
  // env eksikse build burada görünür şekilde fail eder, bozuk artefakt üretmez.
  // Dev sunucusu (command === 'serve') etkilenmez — uygulama orada 'local' moda düşebilir.
  if (command === 'build') {
    const url = (env.VITE_SUPABASE_URL || '').trim();
    const key = (env.VITE_SUPABASE_ANON_KEY || '').trim();
    const urlOk = url.startsWith('https://') && url.includes('.supabase.co') && !/your[-_]?project|abc123/i.test(url);
    const keyOk = key.length > 30 && !key.includes('...');
    if (!urlOk || !keyOk) {
      throw new Error(
        '[vite build] Supabase ortam değişkenleri eksik/geçersiz — bozuk production build engellendi.\n' +
        '  VITE_SUPABASE_URL ' + (urlOk ? 'OK' : 'EKSİK/GEÇERSİZ') + '\n' +
        '  VITE_SUPABASE_ANON_KEY ' + (keyOk ? 'OK' : 'EKSİK/GEÇERSİZ') + '\n' +
        '  → Vercel: Project Settings > Environment Variables (Production) içine ekleyin; lokal: .env.local.'
      );
    }
  }

  return {
    plugins: [
      react(),
      testAccountsDevPlugin(env),
      apiFunctionsDevPlugin(env),
    ],
    server: {
      port: 5500,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2020',
    },
    // Banner / logo / icon dosyalarini root'tan erisilebilir tutuyoruz.
    publicDir: 'public',
  };
});
