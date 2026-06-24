# Sekme: Müşteri Bulma (Lead Generation)

## Amaç ve Hedef Kullanıcı
Admin panelindeki bu sekme, **Apify Google Maps Scraper** (`compass~crawler-google-places`) ile
hedef ülke + şehir + kategoride işletme (potansiyel müşteri/lead) bulmayı sağlar. Bulunan işletmeler
filtrelenir, Supabase'e kaydedilir ve isteğe bağlı **toplu kişiselleştirilmiş e-posta** gönderilir.

- **Hedef kullanıcı:** `admin`, `super_admin` (RLS + `requireAdmin` ile sınırlı)
- **Tipik kullanım:** "Berlin'deki Autohaus'ları bul → e-postası olanları seç → tanıtım maili gönder → lead olarak takip et"

## Bağlı Route / Dosya Yolları / Bileşenler
| Katman | Dosya |
|--------|-------|
| Sekme bileşeni (UI) | [src/components/MusteriBulmaPanel.jsx](../../src/components/MusteriBulmaPanel.jsx) |
| Frontend client | [src/utils/musteriBulmaClient.js](../../src/utils/musteriBulmaClient.js) |
| Serverless API | [api/find-customers.js](../../api/find-customers.js) |
| Mail gönderimi (mevcut) | [src/utils/mailService.js](../../src/utils/mailService.js) → `/api/send-mail` |
| DB migration | [supabase/migrations_fresh/12_musteri_bulma.sql](../../supabase/migrations_fresh/12_musteri_bulma.sql) |
| App entegrasyonu | `src/App.jsx` — section key: `musteri_bulma` (sidebar + mobil nav + render) |

## API Çağrıları ve Veri Şeması
### `/api/find-customers` (async + poll deseni)
Apify aktörü dakikalarca sürebildiği için (Vercel `maxDuration=30s`), senkron beklemek yerine:

1. **POST** `/api/find-customers` — gövde: `{ ulke, sehir, kategori, limit, language }`
   → aktör run'ını başlatır, `202` ile `{ runId, datasetId, status }` döner.
2. **GET** `/api/find-customers?runId=<id>` — run durumunu sorgular.
   → `RUNNING` iken `{ status, finished:false }`; `SUCCEEDED` olunca dataset normalize edilip `{ items: [...] }` döner.

Frontend `runSearch()` bu iki adımı yönetir (4sn aralıkla poll, 240sn timeout, `AbortController` ile iptal).

### Normalize edilmiş `item` şeması (Google Place → standart)
```
placeId, isim, kategori, adres, sehir, telefon, email, website,
puan, yorum_sayisi, lat, lng, google_maps_url, durum (acik|kapali|gecici_kapali)
```

### Supabase tablosu: `musteri_adaylari`
`place_id` (UNIQUE — dedup), `isim`, `kategori`, `adres`, `sehir`, `ulke`, `telefon`, `email`,
`website`, `puan`, `yorum_sayisi`, `lat`, `lng`, `google_maps_url`, `durum`,
`lead_durumu` (yeni|iletisimde|musteri|elendi), `mail_durumu` (gonderilmedi|gonderildi|hata),
`mail_gonderim_at`, `yanit_kategorisi`, `notlar`, `arama_kategori`, `arama_konum`,
`created_by`, `created_at`, `updated_at`.

## State Yönetimi
Panel kendi lokal state'ini tutar (global `db`/`setDb` mega-state'e dokunmaz):
- `form` (arama girdileri), `results` (ham sonuçlar), `selected` (Set), `filters` (minPuan/onlyEmail/onlyPhone/onlyWeb)
- `leads` (Supabase'den yüklenen kayıtlı adaylar), `view` ('arama' | 'kayitli')
- Filtreler **client-side** uygulanır → yeniden scrape etmeden anlık süzme.

## Erişim Kontrolü (RLS / Role)
- **API:** `requireAdmin(req)` — yalnızca `admin`/`super_admin` Supabase JWT'si.
- **DB:** `musteri_adaylari` RLS aktif; tek policy `musteri_adaylari_admin_all` → `public.is_admin()`.
- **Token güvenliği:** `APIFY_TOKEN` yalnızca sunucu env'inde (`.env.local`, `VITE_` prefix'i YOK) → browser'a sızmaz.

## Kurulum Adımları
1. `.env.local` içinde `APIFY_TOKEN` tanımlı (kaydedildi). Vercel'de de aynı env var'ı ekleyin.
2. Migration'ı çalıştırın: `supabase/migrations_fresh/12_musteri_bulma.sql` (Supabase SQL Editor veya CLI).
3. Admin olarak giriş yapın → sol menü **"Müşteri Bulma"**.

## Test Senaryoları
- [ ] Kategori/şehir boşken "Müşteri Bul" → validasyon hatası.
- [ ] Geçerli arama → poll sırasında "Aranıyor…" + iptal butonu çalışır.
- [ ] Sonuçlar geldiğinde filtreler (min puan / e-posta var / telefon var / web var) doğru süzer.
- [ ] "Kaydet" → seçilenler `musteri_adaylari`'ya upsert (place_id ile dedup).
- [ ] "Mail" → `{isim}` yer tutucusu doğru değişir, mail_durumu güncellenir.
- [ ] "CSV" → filtrelenmiş sonuç indirilir (UTF-8 BOM, Excel uyumlu).
- [ ] Kayıtlı Adaylar → lead_durumu güncelleme + silme; tablo yoksa migration uyarısı.
- [ ] Non-admin kullanıcı API'ye erişemez (401/403).

## Bilinen Sınırlamalar
- **Lokal `vite dev`** ortamında `/api/*` çalışmaz (Vercel serverless gerekir). `vercel dev` veya prod kullanın.
- Apify aktörü **e-posta** alanını her zaman döndürmez (işletme web sitesi taranabiliyorsa gelir).
- **Yarıçap (radius)** v1'de yok; arama `kategori` + `şehir, ülke` (locationQuery) ile yapılır.
- `created_by` yalnızca oturum kullanıcısında `id` mevcutsa dolar (aksi halde `NULL`).
- Apify kullanımı **ücretlidir** (compute units) — `limit`i makul tutun (varsayılan 30, maks 200).

## Değişiklik Geçmişi
| Tarih | Değişiklik |
|-------|-----------|
| 2026-06-24 | İlk sürüm: Apify arama (async+poll), filtre, Supabase kaydı, toplu mail, CSV, lead takibi. |
