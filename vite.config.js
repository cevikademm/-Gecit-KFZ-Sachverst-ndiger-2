import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import testAccountsDevPlugin from './dev-tools/vitePluginTestAccounts.js';
import apiFunctionsDevPlugin from './dev-tools/vitePluginApiFunctions.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Tüm env değişkenlerini (VITE_ öneksizler dahil) Node tarafına yükle.
  // SUPABASE_SERVICE_ROLE_KEY yalnızca dev plugin (Node) içinde kullanılır,
  // tarayıcı bundle'ına ASLA girmez.
  const env = loadEnv(mode, process.cwd(), '');
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
