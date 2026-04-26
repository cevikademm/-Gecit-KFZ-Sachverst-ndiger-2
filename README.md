# GECIT-KFZ Sachverständigenbüro

Yapay zeka destekli oto ekspertiz platformu. Müşteri portalı, admin paneli, avukat ve sigorta panelleri tek çatı altında.

## Özellikler

- 🚗 Müşteri portalı: araç takibi, ekspertiz raporları, faturalar
- 🛠️ Admin paneli: müşteri/araç yönetimi, termin planlayıcı, hatırlatmalar
- 🛡️ TÜV (Hauptuntersuchung) takip — otomatik bildirim şablonları, PDF + WhatsApp
- ⚖️ Avukat paneli: davalar, dilekçe şablonları
- 🏢 Sigorta paneli: hasar talepleri, teklif yönetimi
- 📱 PWA: offline çalışır, push notification destekli
- 🌐 Çift dil odaklı (TR/DE), Almanya pazarına yönelik

## Teknoloji

- React 18 (CDN, no build step)
- Tailwind CSS (CDN)
- Framer Motion
- jsPDF (rapor üretimi)
- Supabase (opsiyonel — production modunda)
- Service Worker (PWA + push)

## Çalıştırma

Statik bir site — herhangi bir HTTP sunucusuyla yayınlanabilir.

```bash
python -m http.server 5500
# veya
npx serve .
```

Tarayıcıda `http://localhost:5500/` adresini aç.

## Vercel Dağıtımı

`vercel` CLI veya GitHub entegrasyonu ile doğrudan dağıtılabilir. Build adımı yoktur.

## Konfigürasyon

Veri katmanı `local` (localStorage) ve `live` (Supabase) modlarını destekler. Mode geçişi için tarayıcı konsolunda:

```js
localStorage.setItem('gecit_kfz_mode', 'live');
```

Supabase config: `localStorage.setItem('gecit_kfz_supabase_url', '...')` ve `gecit_kfz_supabase_key`.
