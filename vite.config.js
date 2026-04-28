import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
  // Banner / logo / icon dosyalar?n? root'tan eri?ilebilir tutuyoruz.
  // Vite "public/" klasor?nu otomatik olarak server kok?ne mount eder, ama
  // mevcut yap?da bu dosyalar root'ta. Bunlar? oldu?u gibi b?rak?yoruz.
  publicDir: 'public',
});
