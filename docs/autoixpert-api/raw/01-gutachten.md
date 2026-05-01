# AutoiXpert API — Gutachten (Reports)

> **Kaynak:** https://dev.autoixpert.de/dokumentation/ressourcen/gutachten
> **Çeviri durumu:** Türkçe (Chrome auto-translate AÇIK) — JSON anahtarları İngilizce kaldı, açıklamalar ve TIP adları çevrildi.
> **Çeviri sözlüğü (anlama için):**
> - `sicim` / `dize` = string
> - `sayı` = number
> - `mantıksal` = boolean
> - `doğru/yanlış/tanımlanmamış` = true/false/undefined
> - `Tarih` = date
> - `Zaman damgası` = timestamp
> - `Dizi` = Array
> - `salt okunur` = readonly

---

## Genel Tanım

Araç değerleme — kaza sonrası, hasar tazminatı, satış vs. durumlarda yapılır. AutoiXpert API ile rapor:
- oluşturulabilir (POST)
- güncellenebilir (PATCH)
- alınabilir (GET)
- silinebilir (DELETE)

Rapor belgeleri ve görselleri de API üzerinden yönetilir.

---

## Rapor Türleri (`type` enum)

| Türkçe | API Değeri |
|---|---|
| Sorumluluk talebi (Haftpflicht) | `liability` |
| Kısa rapor / maliyet tahmini | `short_assessment` |
| Kısmi kasko | `partial_kasko` |
| Tam kasko | `full_kasko` |
| Değerleme | `valuation` |
| Klasik otomobil küçük değerleme | `oldtimer_valuation_small` |
| Kiralama iadesi | `lease_return` |
| 2. el araç kontrolü | `used_vehicle_check` |
| Fatura denetimi | `invoice_audit` |

> Rapor tipi sadece UI'dan değiştirilebilir, API'den sonradan değiştirilemez.

---

## Harici Kimlik (`external_id`)

Mevcut sistemle entegrasyon için `external_id` parametresi raporu kendi sistemimizdeki kayda bağlamaya yarar. URL'lerde rapor ID yerine kullanılabilir.

---

## Sorumlu Uzman (`responsible_assessor_id`)

Rapor oluşturulurken zorunlu. Sonradan API ile değiştirilebilir.

---

## Özel Alanlar (`custom_fields`)

`custom_fields` objesi içinde key-value şeklinde tutulur. Veri tipi alan tanımına uymalı (String, Boolean, Number).

---

## Üst Düzey Rapor Alanları

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string, readonly | AutoiXpert dahili kimlik |
| `external_id` | string | Harici sistemdeki ID — `{report_id}` URL'sinde kullanılabilir |
| `type` | string, readonly | Rapor türü (yukarıdaki enum) |
| `created_at` | timestamp, readonly | |
| `updated_at` | timestamp, readonly | |
| `state` | string, readonly | `recorded` / `locked` / `deleted` |
| `completion_date` | date | Tamamlanma tarihi |
| `order_date` | date | Sipariş tarihi |
| `order_time` | string (ISO datetime) | Saat dilimi: Europe/Berlin |
| `token` | string | Dosya numarası (Aktenzeichen) |
| `responsible_assessor_id` | string | ID, e-posta veya baş harfler |
| `location_id` | string | ID veya kısaltma |
| `use_factoring` | bool/null | Faktoring sağlayıcılar aktif mi |
| `use_dekra_fees` | bool/null | DEKRA atölye tarifelerini kullan |
| `vin_was_checked` | bool/null | VIN kontrol edildi mi |
| `source_of_technical_data` | string | Örn. "Araç tescil belgesi (orijinal)" |
| `test_drive_carried_out` | bool/null | Test sürüşü yapıldı mı |
| `claimant` | object (Claimant) | Davacı (asıl müşteri) |
| `owner_of_claimants_car` | object | Davacının aracının sahibi |
| `intermediary` | object | Aracı / arabulucu |
| `lawyer` | object | Davacı avukatı |
| `author_of_damage` | object | Kazada karşı taraf |
| `owner_of_author_of_damages_car` | object | Karşı tarafın aracının sahibi |
| `insurance` | object | Sigorta |
| `garage` | object | Atölye / Tamirhane |
| `car` | object (Car) | Araç verisi |
| `accident` | object (Accident) | Kaza verisi |
| `damage` | object, readonly | Hasar verisi |
| `visits` | array | Saha ziyaretleri |
| `photos` | array | Fotoğraflar |
| `paint_thickness_measurements` | array | Boya kalınlığı ölçümleri |
| `paint_thickness_measurement_comment` | string | Genel boya yorumu |
| `paint_thickness_selected_scale_id` | string | Seçilen ölçek kimliği |
| `lease_return` | object | Kiralama iadesi muayene kılavuzu |
| `labels` | array | Etiketler |
| `custom_fields` | object | Özel alanlar |

---

## Sub-object: `claimant` (Davacı)

| Alan | Tip | Notlar |
|---|---|---|
| `contact_id` | string | İletişim yönetiminden referans (kopya tutulur) |
| `salutation` | string | "Herr" / "Frau" |
| `first_name` | string | |
| `last_name` | string | |
| `organization_name` | string | Firma |
| `email` | string | |
| `phone` | string | |
| `phone2` | string | İkinci telefon |
| `street_and_housenumber_or_lockbox` | string | Sokak/Postafiş |
| `zip` | string | Posta kodu |
| `city` | string | |
| `notes` | string | |
| `is_owner` | bool | Davacı aynı zamanda araç sahibi mi |
| `case_number` | string | Müşteri sipariş no (filo için) |
| `may_deduct_taxes` | bool/null | KDV indirim hakkı |
| `vat_id` | string | KDV numarası |
| `iban` | string | |
| `represented_by_lawyer` | bool/null | |

## Sub-object: `owner_of_claimants_car`
`claimant` ile benzer (notes, case_number, iban yok); + `may_deduct_taxes`, `vat_id`.

## Sub-object: `intermediary`
Sadece `contact_id`, `organization_name`.

## Sub-object: `author_of_damage`
`claimant` benzeri + `license_plate`, `insurance_number` (DEPRECATED).

## Sub-object: `owner_of_author_of_damages_car`
`claimant` benzeri ama daha az alan (case_number, may_deduct_taxes vb. yok).

## Sub-object: `garage`
`claimant` benzeri (organization_name odaklı).

## Sub-object: `lawyer`
`claimant` benzeri + `case_number` (hukuk bürosu dosya no).

## Sub-object: `insurance`

| Alan | Tip | Notlar |
|---|---|---|
| Tüm iletişim alanları | — | claimant gibi |
| `case_number` | string | Sigorta hasar numarası |
| `contract_number` | string | Poliçe numarası |
| `deductible_partial_kasko` | number | Muafiyet (€) |
| `deductible_full_kasko` | number | Muafiyet (€) |

---

## Sub-object: `car`

| Alan | Tip | Notlar |
|---|---|---|
| `license_plate` | string | "A-AX-2017" / "B-AX-2025E" |
| `vin` | string | Kontrol basamağı yok |
| `make` | string | Üretici |
| `model` | string | |
| `shape` | string | Araç tipi (enum aşağıda) |
| `custom_shape_label` | string | Özel ad |
| `performance_kw` | number | |
| `performance_hp` | number | |
| `first_registration_date` | date | İlk kayıt |
| `latest_registration_date` | date | Son kayıt |
| `next_general_inspection_date` | date | TÜV/HU |
| `mileage_estimated` | number | |
| `mileage_as_stated` | number | |
| `mileage_meter` | number | |
| `mileage_unit` | string | km / mil / saat |
| `service_book_complete` | bool/null | |
| `last_service_date` | date | |
| `last_service_mileage` | number | |
| `general_condition` | string | |
| `paint_condition` | string | |
| `body_condition` | string | |
| `interior_condition` | string | |
| `condition_comment` | string | |
| `repaired_previous_damage` | string | Önceki onarılmış hasar |
| `unrepaired_previous_damage` | string | Onarılmamış hasar |
| `roadworthiness` | string | Yol güvenliği |
| `damage_description` | string | |
| `axles` | array (Axle) | Akslar |
| `has_second_tire_set` | bool/null | İkinci lastik takımı |
| `spare_tire_equipment` | object | Yedek lastik |

### Vehicle `shape` enum
`bicycle, e-bike, pedelec, sedan, compact, coupe, stationWagon, suv, convertible, van, transporter, motorcycle, pickup, motorHome, caravanTrailer, trailer, truck, semiTruck, semiTrailer, bus`

---

## Sub-object: `axles[]`

| Alan | Tip | Notlar |
|---|---|---|
| `axle_number` | number | 1, 2, 3... |
| `axle_position` | string | `front` / `rear` |
| `axle_load` | number | kg |
| `is_steerable` | bool/null | |
| `left_tire` | object (Tire) | |
| `right_tire` | object (Tire) | |
| `center_tire` | object (Tire) | sadece motosiklet |
| `outer_left_tire` | object (Tire) | sadece kamyon |
| `outer_right_tire` | object (Tire) | sadece kamyon |

### Tire

| Alan | Tip | Notlar |
|---|---|---|
| `axle` | number | |
| `position` | string | `left/right/center/outerLeft/outerRight` |
| `type` | string | "205/55 R16" |
| `tread_in_mm` | number | Diş derinliği |
| `season` | string | `summer/winter/allyear/custom` |
| `custom_type` | string | season=`custom` ise |
| `manufacturer` | string | |
| `comment` | string | |
| `second_tire_set` | object | İkinci lastik takımı |

### Spare tire (`spare_tire_equipment`)

| Alan | Tip | Notlar |
|---|---|---|
| `type` | string | `spareWheel/compactSpareWheel/tireRepairKit` |
| `dimension` | string | "205/55 R16" |
| `tread_in_mm` | number | |
| `season` | string | summer/winter/allyear/custom |
| `custom_type` | string | |
| `manufacturer` | string | |
| `comment` | string | |

---

## Sub-object: `paint_thickness_measurements[]`

| Alan | Tip | Notlar |
|---|---|---|
| `position` | string | Konum (enum aşağıda) |
| `title` | string | |
| `comment` | string | |
| `values` | number[] | µm cinsinden ölçümler |
| `manual_type` | string | `thin/original/secondCoatOfPaint/thinFillerLayer/thickFillerLayer/none` |
| `no_measurement_reason` | string | Ölçüm yapılamama sebebi |

### Paint position enums

**Binek/hafif ticari:**
`frontLeft, frontCenter, frontRight, fenderFrontLeft, hood, fenderFrontRight, doorDriver, windshield, doorFrontPassenger, doorBackPassengerLeft, roof, doorBackPassengerRight, fenderRearLeft, fenderRearRight, centerLeft, centerRight, rearLeft, rearWindow, roofRear, rearCenter, rearRight`

**Kamyon/yarı römork:**
`leftWallFront, leftWallCenter, leftWallRear, ceilingFront, ceilingCenter, ceilingRear, rightWallFront, rightWallCenter, rightWallRear`

**Çekici:**
`frameLeft, frameRight`

**Genel:** `custom`

---

## Sub-object: `lease_return`

| Alan | Tip | Notlar |
|---|---|---|
| `title` | string | Test kılavuzu başlığı |
| `relative_residual_value` | number | Orijinal fiyatın %'si |
| `lease_return_item_taxation_type` | string | `net` / `gross` |
| `sections` | array (Section) | Bölümler |

### Lease return section
| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `title` | string | "İç Mekan", "Gövde" vb. |
| `items` | array (Item) | |

### Lease return item
| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `is_required` | bool/null | Onarım gerekli mi |
| `comment` | string | |
| `repair_costs_net` | number | € |
| `repair_costs_gross` | number | € |
| `above_average_wear_costs_net` | number | € |
| `above_average_wear_costs_gross` | number | € |
| `is_vat_neutral` | bool/null | Vergi-nötr mü |

---

## Sub-object: `accident`

| Alan | Tip | Notlar |
|---|---|---|
| `location` | string | Adres veya açıklama |
| `date` | date | |
| `time` | string (ISO timestamp) | Europe/Berlin |
| `police_case_number` | string | |
| `police_department` | string | |
| `circumstances` | string | HTML olabilir (free text) |

---

## Sub-object: `visits[]`

Saha ziyaretleri ayrı endpoint'te yönetilir: `/reports/{report_id}/visits/{visit_id}`. PATCH sadece ayrı endpoint'te. POST /reports'a `visits[]` dahil edilebilir.

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `location_name` | string | |
| `street` | string | |
| `zip` | string | |
| `city` | string | |
| `date` | date | |
| `dateTime` | ISO 8601 | |
| `assessor_id` | string | |
| `conditions` | string | "yeterli" vb. |
| `auxiliary_devices` | string[] | ["kaldırma platformu"] |

---

## Sub-object: `photos[]`

Ayrı endpoint: `/reports/{report_id}/photos/{photo_id}`. Detay sayfasına bak: "Uzman Raporu Görüntüleri" (henüz alınmadı).

---

## Sub-object: `labels[]`

Etiketler 3 farklı şekilde verilebilir:
1. **String ID** — `"W7mwZrPXOqi4"`
2. **Object with `id`** — `{"id": "W7mwZrPXOqi4"}`
3. **Object with `name` (+`color`)** — `{"name": "Wartend", "color": "#FFA500"}`

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `color` | string | Hex (#RRGGBB) |

Sistem yoksa otomatik oluşturur.

---

## Endpoint'ler

### GET tek rapor
```
GET https://app.autoixpert.de/externalApi/v1/reports/{report_id}
```
`report_id` yerine `external_id` de kullanılabilir.

### POST yeni rapor
```
POST https://app.autoixpert.de/externalApi/v1/reports
```
Zorunlu: `type`, `responsible_assessor` (ID, e-mail veya inisyaller).

Query parametresi:
- `generate_token=true` → otomatik dosya numarası oluşturur

`created_by` API anahtarına atanır (izlenebilirlik için).

### POST şablondan rapor
```
POST https://app.autoixpert.de/externalApi/v1/reports
{ "template_id": "template_abc123", ... }
```
Şablon kullanılabilir endpoint: `GET /report-templates`

Şablondan kopyalanan veriler:
- İlgili taraflar (claimant, insurance, garage, vb.)
- Araç verileri ve donanımı
- Belge yapısı
- Fotoğraflar
- Hesaplama (DAT dosyası hariç)
- Kalan değer reklamları
- Pazar analizi
- Yüklenen belgeler
- Görevler
- İmzalar

Sıfırlanır: ücret hesaplaması, e-posta teslim durumu, dosya numarası.

### PATCH rapor güncelleme
```
PATCH https://app.autoixpert.de/externalApi/v1/reports/{report_id}
```

> ⚠️ **PUT desteklenmiyor** — istem dışı veri kaybı riskine karşı sadece PATCH.

Dot-notation desteklenir:
```json
{ "claimant.email": "info@example.de" }
```

`garage.contact_id` verirsek AutoiXpert iletişim ve atölye ücretlerini otomatik çeker.

> ⚠️ Sorumlu uzman değiştirilirse, eski uzman raporu artık göremeyebilir (izin ayarına bağlı).

### Lease-return alt endpoint'leri (tam CRUD)

```
GET    /reports/{report_id}/lease-return/sections
GET    /reports/{report_id}/lease-return/sections/{section_id}
POST   /reports/{report_id}/lease-return/sections
PUT    /reports/{report_id}/lease-return/sections/{section_id}
PATCH  /reports/{report_id}/lease-return/sections/{section_id}
DELETE /reports/{report_id}/lease-return/sections/{section_id}

GET    /reports/{report_id}/lease-return/sections/{section_id}/items
GET    /reports/{report_id}/lease-return/sections/{section_id}/items/{item_id}
POST   /reports/{report_id}/lease-return/sections/{section_id}/items
PUT    /reports/{report_id}/lease-return/sections/{section_id}/items/{item_id}
PATCH  /reports/{report_id}/lease-return/sections/{section_id}/items/{item_id}
DELETE /reports/{report_id}/lease-return/sections/{section_id}/items/{item_id}
```

Section item zorunlu alan: `title`. PUT sıfırlar, PATCH parçalı günceller.

### PATCH — Sub-object güncelleme (ÖNEMLİ kural)

`garage`, `claimant`, `lawyer`, `owner_of_claimants_car`, `insurance` gibi sub-object'lere PATCH yaparken, **objenin kendisine işaret etmek** gerekir, alana değil:

```bash
# DOĞRU
curl -X PATCH /reports/{id} -d '{
  "garage": { "contact_id": "...", "email": "..." }
}'

# YANLIŞ
curl -X PATCH /reports/{id} -d '{
  "garage.contact_id": "..."
}'
```

> 🟡 Yukarıdaki dot-notation `claimant.email` örneği SCALAR alanlar için (string vb.). Sub-object'in tamamına dokunulacaksa obje olarak gönder.

Sub-object PATCH desteği şu taraflar için geçerli:
- claimant, lawyer, owner_of_claimants_car, insurance, garage

### PATCH — Etiketler (tam değiştirme)

Labels array tamamen değiştirilir (REPLACE semantik):

```bash
curl -X PATCH /reports/{id} -d '{
  "labels": [
    "r6rzxxfh5jra",
    { "id": "NdkQQ7Rha3Eg" },
    { "name": "Rückruf", "color": "#FFB333" },
    { "name": "Zu Versenden" }
  ]
}'
```

### DELETE Rapor (Soft Delete)

```
DELETE /externalApi/v1/reports/{report_id}
```

- Soft delete: `state` → `deleted` olur
- **30 gün** içinde UI'dan geri yüklenebilir (geri dönüşüm kutusu)
- 30 gün sonra **kalıcı olarak silinir**
- Silindikten sonra bile API'den ID ile sorgulanabilir (30 gün içinde)

Yanıt:
```json
{ "report": { "id": "lsa2t8l9rryk" } }
```

### GET /reports (Liste)

```
GET https://app.autoixpert.de/externalApi/v1/reports
```

| Davranış | Değer |
|---|---|
| Varsayılan sayfa boyutu | **10 rapor** |
| `limit` query parametresi | Var ama **maksimum 10** (10'dan büyük → yok sayılır) |
| Pagination | Cursor tabanlı |
| Cursor parametresi | `next_page` (yanıt) |
| Bitiş işareti | `has_more: false` |

Yanıt:
```json
{
  "reports": [/* ... */],
  "has_more": true,
  "next_page": "CM4IGgw6CjIwMjEtMDUtMTQaCSmQ2IBVeQEAAA=="
}
```

> ⚠️ **KRİTİK KISIT — limit=10**
> Müşteri 100 raporu varsa: 10 sayfa × 1 istek/sayfa = **10 istek**.
> 1000 raporu varsa: **100 istek**. Bu yüzden import script:
> 1. Cursor pagination kullanmalı (`next_page` ile)
> 2. Rate limit'e dikkat etmeli (Pricing sayfasından kontrol edilecek)
> 3. Ara durumu kaydetmeli (kesilirse kaldığı yerden devam)

### Filtreler ve Sıralama (TAM LİSTE)

#### Sıralama
| Param | Değerler |
|---|---|
| `sort` | `report_token` / `completion_date` / `order_date` / `updated_at` / `created_at` |
| `sort_direction` | `asc` / `desc` |

> Default: `created_at desc`. Aynı değer durumunda fallback yine `created_at`.

#### Filtreler

| Param | Tip | Açıklama |
|---|---|---|
| `is_done` | bool | Yalnızca tamamlanmış raporlar (`state=locked`) |
| `is_open` | bool | Yalnızca açık raporlar |
| `report_type` | string | Tek bir rapor türü (yukarıdaki enum) |
| `responsible_assessor_id` | string | Sorumlu uzman (ID, e-mail veya inisyaller) |
| `location_id` | string | Konum (ID veya kısaltma) |
| `created_at_gte` | timestamp | ≥ bu tarihten itibaren oluşturulanlar |
| `created_at_lte` | timestamp | ≤ bu tarihe kadar oluşturulanlar |
| `updated_at_gte` | timestamp | Son güncelleme ≥ |
| `updated_at_lte` | timestamp | Son güncelleme ≤ |
| `completion_date_gte` | date | Tamamlanma ≥ |
| `completion_date_lte` | date | Tamamlanma ≤ |

> 💡 **Incremental sync (Faz 2):** `updated_at_gte={son_sync_tarihi}` ile ⚡ verimli senkronizasyon yapabiliriz.

### Excel İhracatı

```
GET /externalApi/v1/exports/reports
```

Aynı filtreler/sıralama geçerli. **`.xlsx`** dosyası döner.
Bu bizim için ana use-case değil ama ileride yedekleme için faydalı olabilir.

---

## ✅ Gutachten Endpoint'i — TAMAM

Bu sayfanın tamamı alındı. Eksik kalan **alt endpoint'lerin detay sayfaları**:

- [ ] Photos endpoint detay sayfası (upload, list, delete)
- [ ] Visits endpoint detay sayfası (PATCH)
- [ ] Damage objesi (readonly) detayları — kalkulasyon
- [ ] Report templates endpoint
- [ ] Custom fields field-definitions endpoint
- [ ] Calculation results (🚧 future)

---

## Örnek Tam Yanıt (gerçek veri)

`docs/autoixpert-api/raw/01-gutachten-example-response.json` dosyasına bak.
