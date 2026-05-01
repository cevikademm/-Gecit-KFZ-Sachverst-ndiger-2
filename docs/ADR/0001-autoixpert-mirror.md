# ADR-001: AutoiXpert Veri Aynası (Mirror) Mimarisi

- **Durum:** Önerildi (Proposed)
- **Tarih:** 2026-05-01
- **Karar verenler:** Cevikadem (proje sahibi) + Claude (orchestrator)
- **Kapsam:** AutoiXpert (`app.autoixpert.de/externalApi/v1`) verisinin Gecit KFZ Sachverständiger Supabase veritabanına aktarılması.

---

## 1. Bağlam (Context)

Müşteri (Gecit KFZ Sachverständiger) günlük operasyonlarını AutoiXpert üzerinde yürütüyor: ekspertiz raporları (Gutachten), iletişim (Kontakte), faturalar (Rechnungen) AutoiXpert'te tutuluyor. Bu verilere kendi paneli üzerinden raporlama, müşteri portalı, avukat/sigorta entegrasyonu için erişmek istiyor.

AutoiXpert REST API ile dışa aktarım sağlıyor (Bearer auth, JSON, snake_case, cursor pagination). Kapsamlı dokümantasyon: [docs/autoixpert-api/raw/](../autoixpert-api/raw/).

## 2. Karar (Decision)

**Veri aynası (read-only mirror) yaklaşımı seçildi.**

AutoiXpert hâlâ kayıt sistemi (system of record) olarak kalır. Gecit'in Supabase'i AutoiXpert verisinin yerel kopyasını tutar. Kayıtları Gecit tarafından oluşturmak/düzenlemek **bu fazda kapsam dışıdır**.

### Faz 1: Tek seferlik tam içe aktarma
- Manuel tetiklenen Node.js script'i
- Tüm Reports + Contacts + Invoices'i çeker
- Idempotent (UPSERT — aynı script ikinci kez çalışırsa duplicate yaratmaz)
- Checkpoint destekli (ağ kesintisinde kaldığı yerden devam)

### Faz 2: Periyodik artımlı senkronizasyon
- Cron veya Supabase Scheduled Function (henüz **kapsamda değil**)
- `updated_at_gte={son_sync}` filtresi ile sadece değişenleri çeker
- Aynı API client + import logic, farklı tetikleyici

### Faz 3: Webhook tabanlı gerçek zamanlı senkron (gelecek)
- AutoiXpert webhook'larını Supabase Edge Function ile karşılar
- Push tabanlı, polling yok

## 3. Nedenler (Rationale)

### Neden mirror? (Klon değil)
- Gutachten oluşturma domain'e özgü iş kuralları içeriyor (PDF rapor şablonları, hasar hesaplama, DAT/Audatex entegrasyonu, hukuksal metin üretimi). Bunları yeniden inşa etmek **bu projenin kapsamını çok aşar**.
- Müşteri zaten AutoiXpert için lisans ödüyor; oradaki olgun fonksiyonelliği yeniden yazmak ekonomik değil.
- Kendi panelinde **okuma odaklı** ihtiyaçları (raporlama, müşteri portalı, sigorta görünürlüğü) mirror ile karşılanır.

### Neden ayrı `autoixpert_*` prefix'li tablolar?
- Mevcut `customers`, `vehicles`, `appraisals` tabloları farklı bir domain modeli — kendi kullanıcı portalı için tasarlanmış (status değerleri Türkçe: 'bekliyor', 'tamamlandi').
- AutoiXpert verisi farklı bir kaynaktan gelir; karıştırmak kayıt sistemi belirsizliği yaratır.
- Eşleştirme/birleştirme katmanı (mapping layer) **ayrı bir kararla** sonra eklenecek (örn. `gecit_appraisal.autoixpert_report_id` foreign key).

### Neden plain JS (TS değil)?
- Mevcut proje Vite + React 18 + plain JS olarak yazılmış.
- Tek bir entegrasyon script'i için TypeScript kurmak ekstra build/tooling getirir.
- Type-safety bir "nice to have", JSDoc + Zod runtime validation ile %80 fayda sağlanabilir.
- (CLAUDE.md "TypeScript strict" diyor ama proje gerçeği farklı — CLAUDE.md güncellenmeli ayrı bir konu.)

### Neden cursor pagination + checkpoint?
- AutoiXpert reports limit max **10/sayfa**. Müşterinin `app.autoixpert.de/Gutachten` ekranında **30 açık + 15 tamamlanmış** rapor görünüyordu (gerçek müşteri verisi). Demek ki mevcut hacim ~50 rapor.
- Ama cron (Faz 2) açıldığında 1000+ rapor olabilir. Pagination doğru kurulmazsa Faz 2'de yeniden yazılır.
- Filter/sort değişirse cursor invalidate olur → script tek başlangıçla bitirmeli, ortada parametre değiştirmemeli.

### Neden read-only API anahtarı?
- Müşterinin verdiği API anahtarı (`qcA33B4ulNyv`) kapsamlı izinlere sahip olabilir. Yazma izinleri varsa **kazara veri silme/değiştirme riski** var.
- Önerimiz: müşteri AutoiXpert UI'sından **yeni bir API anahtarı** oluştursun, sadece şu izinler aktif:
  - `Gutachten lesen` (raporları okuma)
  - `Kontakte lesen` (kontakları okuma)
  - `Rechnungen lesen` (faturaları okuma)
- Mevcut anahtar deaktif edilebilir.

## 4. Şema (Schema)

### Tablolar (özet — detay migration'da)

```
autoixpert_reports          -- Gutachten ana tablo (~50 üst düzey alan)
autoixpert_contacts         -- Kontakte
autoixpert_invoices         -- Rechnungen (read-only)
autoixpert_invoice_reports  -- N:N junction (faturalar ↔ raporlar)
autoixpert_sync_log         -- her import run'unun kaydı (resumable)
```

### ID Stratejisi
- **PK = AutoiXpert internal ID** (`TEXT NOT NULL PRIMARY KEY`)
- AutoiXpert ID'leri ~12 karakter Base64-ish opak string (örn. `WqJF5FtPaXL8`)
- Bu sayede UPSERT (`ON CONFLICT (id) DO UPDATE`) doğal olarak idempotent
- Yan haneye `external_id` (AutoiXpert tarafındaki) tutulmaz — bizim sistemden AutoiXpert'e gönderdiğimiz bir ID yok (tek yönlü mirror)

### JSONB vs Normalize Tercihi
| Alan | Karar | Gerekçe |
|---|---|---|
| `claimant`, `garage`, `lawyer`, `insurance` vb. | **JSONB** | Doküman _"raporun içinde bağımsız kopya tutulur"_ diyor — normalize edersek anlam kayar |
| `car`, `accident`, `lease_return` | **JSONB** | Tek rapora bağlı, sorgulama nadiren gerekecek |
| `axles`, `paint_thickness_measurements` | **JSONB** (rapor içinde) | Çok nested |
| `visits`, `photos` | **Ayrı tablolar** (faz 2) | Ayrı endpoint'leri var, ayrı yönetilecek |
| `labels`, `custom_fields` | **JSONB** | Bireysel ihtiyaçlar |
| `garage_fee_sets` (contact içinde) | **JSONB** | PATCH bile element-bazında değil, tüm array'i değiştir |
| `line_items`, `payments`, `documents` (invoice) | **JSONB** | İlk faz için yeterli; raporlama gerekirse normalize edilir |
| `report_ids` (invoice → reports) | **Junction table** | N:N ilişki, sorgu performansı için |

> **İlke:** Başta JSONB ile minimal şema, gerektikçe normalize. Erken optimizasyon yapma.

### Soft Delete & State

| Resource | AutoiXpert davranışı | Bizim tarafta |
|---|---|---|
| Reports | Soft delete (`state='deleted'`, 30 gün geri yükleme) | `state` kolonunu mirror et — kendimiz silme |
| Contacts | Hard delete | `last_seen_at` kolonu — orphan tespiti için |
| Invoices | Silinemez (read-only) | Yok |

### Senkron Metadata (her tabloda)
- `synced_at` (TIMESTAMPTZ) — bu kayıt en son ne zaman çekildi
- `external_updated_at` (TIMESTAMPTZ) — AutoiXpert'in `updated_at`
- `raw_payload` (JSONB) — orijinal yanıt payload'ı (debug/replay için)

### RLS (Row Level Security)
- Tüm `autoixpert_*` tabloları **admin-only** (en azından Faz 1'de)
- Service role key ile yapılan import RLS'i bypass eder
- Müşteri/avukat/sigorta rolleri için ekstra policy **sonra** eklenecek (mapping layer ile birlikte)

## 5. API Client Mimarisi

```
scripts/autoixpert/
├── client.js            # HTTP client: fetch + auth + retry + error normalize
├── pagination.js        # Cursor pagination iteratör
├── reports.js           # Reports endpoint wrapper
├── contacts.js          # Contacts endpoint wrapper
├── invoices.js          # Invoices endpoint wrapper
├── upsert.js            # Supabase UPSERT helper'ları
├── checkpoint.js        # sync_log tablosuyla checkpoint
└── import-all.js        # Ana giriş noktası — tüm fazları sırayla çalıştırır
```

### Hata Yönetimi
- AutoiXpert hata yapısı: `{ status_code, endpoint, error_code, error_message, error_details? }`
- Auth hataları **400** döner (401 değil!) — `error_code` üzerinden kontrol
- Retry edilebilir hatalar: 429 (rate limit), 5xx
- Retry **edilmez:** 4xx (auth/validation hataları)
- Exponential backoff: 1s, 2s, 4s, 8s (max 4 deneme)

### Rate Limiting
- AutoiXpert dokümantasyonunda spesifik rate limit verilmemiş (Preise & Limits sayfasından öğrenilecek)
- Konservatif başlangıç: **istek başına 200ms throttle**
- 429 alınırsa exponential backoff
- Faz 2'de `Retry-After` header'ı varsa ona uy

## 6. Sonuçlar (Consequences)

### Olumlu
- Müşterinin verisi yerelleşir → kendi panelinde ek özellikler (raporlama, dashboard, müşteri portalı) inşa edilebilir
- AutoiXpert servis kesintisinde okuma erişimi devam eder
- Veri yedekleme katmanı oluşur (gerçek anlamda olmasa da, kendi DB'mizde kopya var)
- TypeScript zorunluluğu yok → mevcut proje tutarlılığı korunur

### Olumsuz / Risk
- **Tutarlılık:** AutoiXpert'te yapılan değişiklik biz cron çalıştırana kadar Gecit'te görünmez (Faz 2'ye kadar dakikalar~saatler gecikme)
- **Karmaşıklık artışı:** Mapping katmanı (autoixpert_report ↔ gecit_appraisal) ayrı iş — bunu yapmadan AutoiXpert verisi sadece okuma için var
- **API kotası:** Müşterinin AutoiXpert kotası bilinmiyor — Faz 2'de cron sıklığı buna göre ayarlanmalı
- **Şema evrimi:** AutoiXpert API'si değişirse migrasyonumuz kırılabilir → `raw_payload` JSONB sayesinde geri dönüş mümkün

## 7. Alternatifler (Reddedildi)

### Alternatif A: Doğrudan AutoiXpert API'sini frontend'den çağır
- ❌ API anahtarı browser'a sızar
- ❌ CORS sorunları
- ❌ Rate limit kullanıcı sayısıyla katlanır

### Alternatif B: Tam fonksiyonel klon (B seçeneği)
- ❌ KFZ-Sachverständiger domain'i çok geniş (PDF, hesaplama, hukuk metni vb.)
- ❌ Müşteri AutoiXpert'e zaten ödeme yapıyor
- ❌ Mevcut projeyi tamamen yeniden yazmak gerekir

### Alternatif C: Edge Function (Supabase) ile sürekli senkron
- ⏸️ Faz 2/3 için doğru yaklaşım
- ❌ Faz 1'de gereksiz karmaşıklık — önce manuel script ile doğrula

### Alternatif D: TypeScript ile yaz
- ⏸️ Proje TS'e geçtiğinde script'i de port edebiliriz
- ❌ Şimdi tek script için TS toolchain kurmak overkill

## 8. Açık Sorular (Open Questions)

- [ ] AutoiXpert rate limit'i nedir? (Preise & Limits sayfası)
- [ ] `OrganizationTypes` enum'unda `garage` dışında hangi değerler var? (test veya başka doc)
- [ ] Müşteri yeni bir read-only API anahtarı oluşturmaya razı mı?
- [ ] Mapping layer (gecit ↔ autoixpert) ne zaman eklenecek? (ayrı ADR)
- [ ] Photos/Visits binary download — hangi Supabase Storage bucket'ına?

## 9. Referanslar

- [docs/autoixpert-api/raw/00-einleitung.md](../autoixpert-api/raw/00-einleitung.md)
- [docs/autoixpert-api/raw/01-gutachten.md](../autoixpert-api/raw/01-gutachten.md)
- [docs/autoixpert-api/raw/02-authentifizierung.md](../autoixpert-api/raw/02-authentifizierung.md)
- [docs/autoixpert-api/raw/03-pagination.md](../autoixpert-api/raw/03-pagination.md)
- [docs/autoixpert-api/raw/04-kontakte.md](../autoixpert-api/raw/04-kontakte.md)
- [docs/autoixpert-api/raw/05-rechnungen.md](../autoixpert-api/raw/05-rechnungen.md)
