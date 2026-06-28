# CHANGELOG

Bu proje [Conventional Commits](https://www.conventionalcommits.org/) ve
[Keep a Changelog](https://keepachangelog.com/) yaklaşımını izler.

## [Unreleased]

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
