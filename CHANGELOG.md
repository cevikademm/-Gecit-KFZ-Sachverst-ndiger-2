# CHANGELOG

Bu proje [Conventional Commits](https://www.conventionalcommits.org/) ve
[Keep a Changelog](https://keepachangelog.com/) yaklaşımını izler.

## [Unreleased]

### fix: Login "Bağlantı hatası" kesintisi — kök neden + tekrar önleme — 2026-06-29
Üretimde (`kfzgutachter.ac`) tüm kullanıcılar girişte **"Bağlantı hatası: F12 → Console →
localStorage.clear() → yenileyin"** alıyordu.

- **Kök neden:** Custom domain `www.kfzgutachter.ac`, `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  ortam değişkenleri Vercel'e eklenmeden ÖNCE üretilmiş **eski bir deployment'a sabitliydi**. O build'de
  Supabase config bundle'a gömülmediği için `getSupabaseClient()` null dönüyor, `signIn()`
  `'Supabase ayarları eksik'` veriyor ve UI bunu "Bağlantı hatası" olarak gösteriyordu. En son
  production deployment'ı (commit `a6d6aa1`) ve `gecit-kfz.vercel.app` ise config'i içeriyordu — yani
  kod ve Vercel env'leri sağlamdı, sorun domain'in eski build'e bağlı kalmasıydı.
- **Acil çözüm (operasyonel):** Vercel → Deployments → en son READY production deployment → **Promote
  to Production** ile custom domain sağlıklı build'e yönlendirildi.
- **Tekrar önleme (kod):** `vite.config.js`'e **build-time guard** eklendi — production build'i
  (`command === 'build'`) Supabase env'leri eksik/placeholder ise görünür bir hatayla durur; config'siz
  bir bundle bir daha SESSİZCE üretime çıkamaz. Dev sunucusu etkilenmez. Anahtar koda **gömülmedi**
  (CLAUDE.md §7); anon key yalnızca env üzerinden gelir.

### feat: Kopyalanabilir e-posta adresleri (sistem geneli) — 2026-06-29
Sistemdeki tüm e-posta adresleri tek tıkla panoya kopyalanabilir hale getirildi.

- **Yeni dosya:** `src/components/Copyable.jsx` — `CopyableEmail` / `CopyableText` bileşenleri +
  `copyText()` yardımcısı. Clipboard API + güvensiz bağlam (http) için `execCommand` fallback;
  tıklayınca kısa "Kopyalandı ✓" geri bildirimi; parent tıklamayı engeller (`stopPropagation`);
  erişilebilir (`role=button`, `tabIndex`, Enter/Space).
- **Uygulandı:** Müşteri kartları/drawer, bireysel/kurumsal listeler, avukat/sigorta/kaporta
  panelleri, test hesapları, kullanıcı profilleri, AutoiXpert, müşteri-bulma, druck-versand,
  hata-bildirimleri, case-status (App.jsx + 8 bileşen).
- **Kapsam dışı (bilerek):** Alıcı-seçim `<button>`'ı ve compose chip'leri (iç içe interaktif
  geçersiz HTML olurdu), bir de e-postanın yalnızca son-çare isim fallback'i olduğu yerler.

### feat: Hata Bildirimi modülü (Error Reporter) — 2026-06-28
Admin sistemi kullanırken aldığı hataları ekran görüntüsü + açıklama ile WhatsApp destek
hattına ileten yardımcı modül.

- **Yeni:** Ekranın sağ-altında WhatsApp FAB — **yalnızca `super_admin`/`admin`** girişinde görünür.
- **Yeni:** "Hata Bildir" modalı — otomatik ekran görüntüsü (html2canvas), açıklama, önem derecesi,
  otomatik meta (sayfa/ekran/bildiren). WhatsApp'a önceden doldurulmuş metinle iletir + görüntüyü indirir.
- **Yeni:** Admin sekmesi **🐞 Hata Bildirimleri** — kayıtları filtreleme (Yeni/İnceleniyor/Çözüldü),
  durum değişimi, görüntü büyütme, WhatsApp'tan tekrar iletme, silme.
- **Yeni dosyalar:** `src/components/HataBildirWidget.jsx`, `src/components/HataBildirimleriPanel.jsx`,
  `src/utils/errorReportClient.js`, `supabase_migration_error_reports.sql`,
  `docs/sekmeler/15-hata-bildirimleri.md`.
- **App.jsx:** `error_reports` tablosu kaydı (`TABLE_MAP`, `KNOWN_COLUMNS`, `SYNC_TABLE_ORDER`,
  `sanitizeRecordForSync`, `loadDB`) + AdminApp nav/section/FAB entegrasyonu.
- **package.json:** `html2canvas@^1.4.1` açık bağımlılık olarak eklendi.
- **Yapılandırma:** Admin WhatsApp numarası varsayılan `+905324961412`
  (`localStorage['gecit_kfz_hata_admin_phone']` veya `VITE_HATA_ADMIN_PHONE` ile override edilebilir).

> Kurulum: `supabase_migration_error_reports.sql`'i Supabase SQL Editor'de çalıştırın
> (tablo + RLS + realtime + `error-screenshots` public bucket).
