# AutoiXpert API — Rechnungen (Faturalar)

> **Kaynak:** https://dev.autoixpert.de/dokumentation/ressourcen/rechnungen (tahmini)
> **Dil:** Almanca (orijinal) ✅

---

## 🔴 KRİTİK: Read-Only API

> ⚠️ **"Es ist aktuell nicht geplant, dass über die API Rechnungen angelegt oder verändert werden können."**

Rechnungen endpoint **sadece okuma** destekliyor:
- ✅ GET (tek + liste + döküman indirme)
- ❌ POST, PUT, PATCH, DELETE — **YOK**

Bu, fatura yaratmanın AutoiXpert UI üzerinden yapıldığı anlamına geliyor. Bizim için faza-1 import'ta sorun değil — biz zaten okuma-yazma değil, mirror yapıyoruz.

---

## Üst Düzey Alanlar

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | AutoiXpert internal ID |
| `number` | string | Fatura numarası |
| `report_ids` | string[] | Bağlı Gutachten ID'leri (1+ olabilir) ⭐ |
| `created_at` | timestamp | |
| `date` | date | Fatura tarihi (Rechnungsdatum) |
| `date_of_supply` | date | Hizmet tarihi (Leistungsdatum) |
| `recipient` | object (Empfänger) | Alıcı |
| `line_items` | object[] (Position) | Satır kalemleri |
| `vat_rate` | number | KDV oranı **ondalık** (`0.19` = %19) |
| `total_net` | number | Net toplam (€) |
| `total_gross` | number | Brüt toplam (€) |
| `due_date` | date | Vade tarihi |
| `days_until_due` | number | Kalan gün |
| `has_outstanding_payments` | bool | Ödenmemiş tutar var mı (Gutschriften/Storno için `false`) |
| `current_unpaid_amount` | number | Kalan tutar (Gutschriften/Storno için `0`) |
| `is_fully_canceled` | bool | Tamamen iptal edildi mi |
| `ids_of_cancellation_invoices` | string[] | İlişkili (kısmi) iptal faturalarının ID'leri |
| `cancels_invoice_id` | string | İptal faturası ise: orijinal faturanın ID'si |
| `is_electronic_invoice_enabled` | bool | E-fatura (XRechnung XML) aktif mi |
| `payments` | object[] | Ödemeler |
| `short_payments` | object[] | Kesintiler |
| `partial_cancellations` | object[] | Fatura düzeltmeleri |
| `location_id` | string | İlgili Gutachten'in konumu |
| `documents` | object[] (Dokument) | Belgeler |

---

## Sub-object: `recipient`

| Alan | Tip |
|---|---|
| `salutation` | string ("Herr"/"Frau") |
| `first_name`, `last_name` | string |
| `organization_name` | string |
| `email`, `phone`, `phone2` | string |
| `street_and_housenumber_or_lockbox` | string |
| `zip`, `city` | string |

(Kontakt'tan ufak farkla: `notes`, `vat_id`, `debtor_number` vb. yok)

## Sub-object: `line_items[]` (Pozisyonlar)

| Alan | Tip |
|---|---|
| `position` | number (sıra) |
| `description` | string |
| `quantity` | number |
| `unit_price` | number (€) |
| `unit` | string |

## Sub-object: `payments[]` (Ödemeler)

| Alan | Tip |
|---|---|
| `amount` | number |
| `date` | date |
| `payer` | string |

## Sub-object: `short_payments[]` (Kesintiler)

| Alan | Tip | Notlar |
|---|---|---|
| `amount` | number | |
| `date` | date | |
| `status` | string | `outstanding_claim` / `written_off` / `paid` |
| `cancellation_invoice_id` | string | Sadece `written_off` ise |

## Sub-object: `partial_cancellations[]` (Düzeltmeler)

| Alan | Tip |
|---|---|
| `amount` | number |
| `date` | date |
| `cancellation_invoice_id` | string |

## Sub-object: `documents[]` (Belgeler)

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | Belge ID |
| `download_url` | string | Hazır indirme URL'i |
| `recipient_role` | string | Alıcı rolü (enum aşağıda) |
| `type` | string | Belge tipi (enum aşağıda) |
| `title` | string | |

### Belge Tipleri (`type`)

| Türkçe | API |
|---|---|
| Fatura | `invoice` |
| Ödeme hatırlatması | `payment_reminder_level_0` |
| 1. İhtar (Mahnung) | `payment_reminder_level_1` |
| 2. İhtar | `payment_reminder_level_2` |
| 3. İhtar | `payment_reminder_level_3` |
| Yazışma (Anschreiben) | `letter` |
| Özel belge | `custom_document` |

### Alıcı Rolleri (`recipient_role`)

| Türkçe | API |
|---|---|
| Fatura alıcısı | `invoice_recipient` |
| Davacı | `claimant` |
| Avukat | `lawyer` |
| Kiralayan | `lease_provider` |
| Sigorta | `insurance` |

> ℹ️ Aynı belge tipi farklı alıcılara aynı anda gidebilir (örn. parçalı ödeme talebi davacı + ihtar avukata). Bu yüzden belge listesi `recipient_role`'a göre çoklu olabilir.

> ℹ️ Faturanın bağlı Gutachten'i yoksa sadece `invoice_recipient` rolü mevcut.

---

## Endpoint'ler

### GET tek fatura
```
GET /externalApi/v1/invoices/{invoice_id}
```

### GET belge indir (ID ile)
```
GET /externalApi/v1/invoices/{invoice_id}/documents/{document_id}/download
```
Yanıt: dosya binary. URL zaten `invoice.documents[].download_url` içinde var.

### GET belge indir (tip + alıcı ile)
```
GET /externalApi/v1/invoices/{invoice_id}/documents/{type}/download?recipient_role={role}
```
Sadece şu tipler için: `invoice`, `payment_reminder_level_0..3`.
`recipient_role` verilmezse → varsayılan `invoice_recipient`.

Belge alıcı için yoksa **404** + structured error döner:
```json
{
  "status_code": 404,
  "endpoint": "...",
  "error_code": "DOCUMENT_DOES_NOT_EXIST_FOR_RECIPIENT",
  "error_message": "...",
  "error_details": {
    "invoice_id": "...",
    "document_type": "invoice",
    "requested_recipient_role": "insurance",
    "available_for_recipient_roles": ["invoice_recipient"]
  }
}
```

> ⭐ **Önemli yeni gözlem:** Hatalar `error_details` (structured) alanı içerebilir. Auth hataları'nda yoktu ama burada var. API client'ta bunu tip-güvenli ele almalıyız:
> ```typescript
> type AutoiXpertError = {
>   status_code: number;
>   endpoint: string;
>   error_code: string;
>   error_message: string;
>   error_details?: Record<string, unknown>;  // opsiyonel
> };
> ```

### GET XRechnung (XML) indir
```
GET /externalApi/v1/invoices/{invoice_id}/xrechnung/download
```
- Content-Type: `application/xml`
- Önerilen dosya adı: `xrechnung-{invoice_id}.xml`
- Eğer XML hatalıysa **HTTP 422** + JSON hata:
  - `XRECHNUNG_CONTAINS_ERRORS`
  - `XRECHNUNG_CONTAINS_WARNINGS`

### GET liste
```
GET /externalApi/v1/invoices
```

| Davranış | Değer |
|---|---|
| Default sayfa boyutu | **10** |
| **Maksimum `limit`** | **20** ⭐ (farklı: Kontakte=100, Gutachten=10) |
| **Sıralama** | **SABİT** — her zaman `created_at` |

#### Filtreler

| Param | Açıklama |
|---|---|
| `report_ids` | Bağlı Gutachten ID'sine göre (internal veya external) |
| `location_id` | Konum (ID veya kısaltma) |
| `created_at_gte` | Oluşturma tarihi ≥ |
| `created_at_lte` | Oluşturma tarihi ≤ |
| `date_gte` | Fatura tarihi ≥ |
| `date_lte` | Fatura tarihi ≤ |
| `has_outstanding_payments` | bool — ödenmemişler |

> ⚠️ **Filtre listesi sayfa sonunda kesilmiş olabilir** — `has_outstanding_payments` filtresinin açıklaması yarım. Mahnstufe (ihtar seviyesi) gibi filtreler de olabilir. Daha sonra doğrulayacağız.

---

## Pagination Limit Karşılaştırması (3 endpoint)

| Endpoint | Default | Max |
|---|---|---|
| Reports (Gutachten) | 10 | **10** |
| Contacts (Kontakte) | 50 | **100** |
| Invoices (Rechnungen) | 10 | **20** |

> Bu farklılıklar import script'i tasarlarken önemli. Her resource için ayrı pagination konfigürasyonu olacak.

## İlişki Yapısı (Schema açısından)

```
autoixpert_invoices  N---N  autoixpert_reports
   (junction tablosu: report_ids array → ayrı junction table)

autoixpert_invoices  1---N  autoixpert_invoice_documents
                     1---N  autoixpert_invoice_payments
                     1---N  autoixpert_invoice_short_payments
                     1---N  autoixpert_invoice_partial_cancellations
                     1---N  autoixpert_invoice_line_items
```

Bu alt tablolar **ayrı tutulabilir** (normalize) çünkü:
- `payments`, `short_payments` zaman içinde değişir (ödemeler eklenir)
- Her ödeme için ayrı sorgu/filtre gerekebilir
- JSONB de mantıklı ama normalize daha esnek

> **Karar (taslak):** Önce JSONB tutalım (basit, hızlı). Eğer ileride raporlama/analiz gerekirse normalize ederiz. Bu, "büyük altta yat" prensibine uygun — başta minimal, sonra büyüt.

## Bizim Şema Tarafına Etkisi

```
autoixpert_invoices (yeni tablo)
├── id (PK)
├── external_id (yok — Rechnungen'da external_id alanı YOK!) ⚠️
├── number (TEXT, unique?)
├── created_at, date, date_of_supply, due_date
├── total_net, total_gross, vat_rate
├── has_outstanding_payments, current_unpaid_amount
├── is_fully_canceled, cancels_invoice_id
├── is_electronic_invoice_enabled
├── location_id
├── recipient (JSONB)
├── line_items (JSONB)
├── payments (JSONB)
├── short_payments (JSONB)
├── partial_cancellations (JSONB)
├── documents (JSONB)
├── report_ids (text[]) — VEYA junction tablo
├── synced_at, raw_payload
└── (silme yok — soft-delete veya hard-delete?)

autoixpert_invoice_reports (junction)  ← OPSİYONEL
   ├── invoice_id (FK)
   └── report_id (FK)
```

> ⚠️ Rechnungen'in DELETE endpoint'i **yok** — silinemiyor (read-only). Bizim tarafta da silme gerekmeyebilir. Ama AutoiXpert'te storno yapılabilir → `is_fully_canceled` ile takip edilir.

---

## Eksik / Sonraki Sorular

- [ ] Filtre listesi tam mı? (`has_outstanding_payments` sonrası kesik gibi görünüyor — Mahnstufe filtresi var mı?)
- [ ] Faturanın silinme davranışı (DELETE yok — UI'dan silinebilir mi? bu durumda biz nasıl haberdar oluruz? webhook?)
- [ ] `report_ids` array'i her zaman dolu mu, yoksa Gutachten'siz fatura olabilir mi? (örnekte: "Bei Rechnungen ohne verknüpftes Gutachten" → demek ki olabilir)
- [ ] Rate limit — özellikle binary download'ları için
