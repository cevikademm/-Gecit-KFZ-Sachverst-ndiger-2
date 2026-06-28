# Sekme: Hata Bildirimleri (Error Reporter)

## Amaç ve Hedef Kullanıcı
Admin sistemi kontrol ederken veya rutin kullanım sırasında bir hata aldığında, bunu **tek
tıkla** kayıt altına alıp WhatsApp destek hattına iletmesini sağlayan yardımcı modül.
Ekranın sağ-altında bir **WhatsApp ikonu (FAB)** durur; "Hata Bildir" denince O AN görünen
ekranın görüntüsü alınır, kullanıcı hatayı açıklar ve kayıt admin'e iletilir. Böylece destek
ekibi **hatanın tam olarak nerede** olduğunu görüntü + açıklama + sayfa bilgisiyle anlar.

- **Hedef kullanıcı:** YALNIZCA `super_admin` / `admin` (FAB ve sekme bu rollerde görünür).
  `lawyer`, `kaporta`, `insurance`, `customer` panellerinde **görünmez**.
- **Tipik kullanım:** "Gutachten kaydederken Speichern butonu çalışmadı → WhatsApp ikonuna bas →
  ekran görüntüsü otomatik geldi → 'Speichern tıklayınca hiçbir şey olmuyor' yaz → WhatsApp ile gönder."

## Bağlı Route / Dosya Yolları / Bileşenler
| Katman | Dosya |
|--------|-------|
| FAB + bildirim modalı (UI) | [src/components/HataBildirWidget.jsx](../../src/components/HataBildirWidget.jsx) |
| Admin görüntüleme paneli (sekme) | [src/components/HataBildirimleriPanel.jsx](../../src/components/HataBildirimleriPanel.jsx) |
| Yardımcı istemci (screenshot/upload/WhatsApp) | [src/utils/errorReportClient.js](../../src/utils/errorReportClient.js) |
| Ekran görüntüsü kütüphanesi | `html2canvas@1.4.1` (package.json'a eklendi) |
| Supabase client (storage/insert) | [src/utils/supabaseAuth.js](../../src/utils/supabaseAuth.js) → `getSupabaseClient()` |
| DB migration | [supabase_migration_error_reports.sql](../../supabase_migration_error_reports.sql) |
| App entegrasyonu | `src/App.jsx` — `TABLE_MAP` / `KNOWN_COLUMNS` / `SYNC_TABLE_ORDER` + AdminApp render |

## İş Akışı
1. **FAB tıklanır** → modal AÇILMADAN ÖNCE `captureScreenshot()` çağrılır (modülün kendi DOM'u
   `data-hata-bildir-skip="1"` + `ignoreElements` ile görüntüye dahil **edilmez**).
2. Modal açılır: ekran görüntüsü "dosya eki" olarak gösterilir (yeniden çek / dosya ekle / kaldır),
   açıklama (zorunlu), önem derecesi (düşük/normal/yüksek), otomatik meta (sayfa/ekran/bildiren).
3. **WhatsApp ile Gönder:**
   - **Önce native paylaşım denenir:** ekran görüntüsü **dosya olarak** mesaja iliştirilir
     (`navigator.share({ files: [...] })`, Web Share API). Mobil + modern masaüstü Chromium'da
     çalışır; kullanıcı paylaşım sayfasından WhatsApp'ı (veya başka hedefi) seçer, görüntü
     **doğrudan eklenmiş** olarak gider. Görüntüyü gerçekten iliştirmenin tek web yolu budur.
   - Kayıt `error_reports` tablosuna **durable** yazılır (`setDb` → SyncQueue otomatik retry);
     görüntü Storage'a yüklenir (`error-screenshots`, public bucket) → `screenshot_url`.
     Yükleme başarısız/local mod ise base64 `screenshot_data` olarak saklanır (kayıp önlenir).
   - **Native paylaşım yoksa/iptal edilirse (yedek):** görüntü cihaza **indirilir** ve
     `https://wa.me/<admin>?text=<önceden doldurulmuş metin>` açılır (metinde Storage URL'i varsa link).
4. **Sadece Kaydet:** WhatsApp açmadan yalnızca kayıt oluşturur.

> ⚠️ **WhatsApp kısıtı:** `wa.me` deep-link **yalnızca metin** taşır, dosya ekleyemez. Bu yüzden
> görüntü öncelikle **Web Share API ile dosya olarak** iliştirilir; bu desteklenmiyorsa görüntü
> Storage linki olarak metne eklenir + cihaza indirilir (admin sohbette 📎 ile iliştirir).
> Görüntü her hâlükârda admin panelinde (bu sekme) tam olarak görünür.

## Veri Şeması — `error_reports`
`id` (PK, `err_<base36ts>_<rnd>`), `reporter_name`, `reporter_email`, `reporter_role`,
`description` (NOT NULL), `page_url`, `page_path`, `user_agent`, `screen_size`, `app_version`,
`severity` (`low|normal|high`), `status` (`new|in_progress|resolved`),
`screenshot_path`, `screenshot_url`, `screenshot_data` (base64 fallback), `console_errors`,
`created_at`, `resolved_at`.

Storage bucket: **`error-screenshots`** (public) — `<id>.jpg`.

## State Yönetimi
- **Widget** kendi lokal state'ini tutar (open, capturing, screenshot, description, severity, meta, sending, toast).
- Persistans global `db.error_reports` dizisine `setDb` (= `useDB().update`) üzerinden yazılır →
  localStorage cache + live modda otomatik Supabase sync (SyncQueue, durable).
- **Panel** `db.error_reports`'tan okur; durum değişimi/silme yine `setDb` ile yapılır; live modda
  Realtime ile yeni kayıtlar anında panele düşer.

## Erişim Kontrolü (RLS / Role)
- **UI:** FAB ve sekme `['super_admin','admin'].includes(user.role)` ile gate'lenir (çift kontrol:
  hem AdminApp nav/section hem widget içi `isAdmin`).
- **DB:** `error_reports` RLS aktif; `error_reports_admin_all` → `public.is_admin()` tam erişim;
  `error_reports_auth_insert` → authenticated insert.
- **Storage:** `error-screenshots` public read; authenticated upload; admin manage.

## Yapılandırma
- **Admin WhatsApp numarası:** Varsayılan `+905324961412`. Override sırası:
  `localStorage['gecit_kfz_hata_admin_phone']` > `import.meta.env.VITE_HATA_ADMIN_PHONE` > varsayılan.
  (Sadece rakam; `wa.me` ülke kodu + numara ister.)
- **Kurulum:** `supabase_migration_error_reports.sql`'i Supabase SQL Editor'de çalıştır → tablo,
  RLS, realtime ve `error-screenshots` bucket'ı oluşur.

## Test Senaryoları
1. Admin girişi → sağ-altta WhatsApp FAB görünür; lawyer/kaporta/customer girişinde görünmez.
2. FAB → modal açılır, ekran görüntüsü gelir; görüntüde FAB/modal **yer almaz**.
3. Açıklama boş → "Lütfen hatayı kısaca açıklayın" uyarısı; gönderim engellenir.
4. "WhatsApp ile Gönder" → kayıt oluşur, görüntü iner, WhatsApp önceden doldurulmuş metinle açılır.
5. Live mod: kayıt Supabase `error_reports`'a düşer, görüntü `error-screenshots`'a yüklenir,
   `screenshot_data` NULL (link kullanılır).
6. Panel: filtreler (Tümü/Yeni/İnceleniyor/Çözüldü), durum değişimi, görüntü büyütme, sil çalışır.

## Bilinen Sınırlamalar
- `wa.me` dosya ekleyemez; bu yüzden **Web Share API** ile dosya iliştirme birincil yoldur.
  Web Share API'yi desteklemeyen (eski masaüstü tarayıcı, güvensiz bağlam) durumlarda görüntü
  manuel iliştirilir veya Storage linki açılır.
- Web Share file paylaşımı **güvenli bağlam** (HTTPS veya `localhost`) ister; ayrıca paylaşım
  sayfasında WhatsApp'ın hedef olarak çıkması için cihazda yüklü olması gerekir.
- `html2canvas` cross-origin (CORS'suz) görselleri / bazı modern CSS efektlerini boş render edebilir;
  bu durumda "Dosya Ekle" ile manuel görüntü yüklenebilir.
- Çok uzun sayfalarda yalnızca **görünür alan (viewport)** yakalanır (tasarım gereği).

## Değişiklik Geçmişi
| Tarih | Değişiklik |
|-------|-----------|
| 2026-06-28 | İlk sürüm — FAB + ekran görüntüsü + WhatsApp gönderimi + admin paneli + `error_reports` tablosu. |
| 2026-06-29 | **Düzeltme:** Ekran görüntüsü artık mesaja gerçekten iliştiriliyor — `errorReportClient.js`'e `dataUrlToFile` + `shareScreenshotFile` (Web Share API) eklendi; `handleSend` önce dosyayı native paylaşımla iliştiriyor, desteklenmeyen cihazda eski wa.me + indirme yoluna düşüyor. `buildWhatsAppText` `attached` seçeneği aldı. |
| 2026-06-29 | **Kalite:** Ekran görüntüsü çözünürlüğü artırıldı — `captureScreenshot` scale `min(DPR,1.5)` (DPR=1 masaüstünde 1x → bulanık) yerine `min(max(DPR,2),2.5)` ile **en az 2x supersampling**; JPEG kalite `0.82 → 0.95`. Metin artık net. |
