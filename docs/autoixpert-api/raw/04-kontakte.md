# AutoiXpert API — Kontakte (Contacts)

> **Kaynak:** https://dev.autoixpert.de/dokumentation/ressourcen/kontakte (tahmini)
> **Dil:** Almanca (orijinal) ✅

---

## Genel Tanım

AutoiXpert iletişim yönetimi (Kontaktmanagement). Bu kontaklar Gutachten oluştururken otomatik öneriliyor. CRM senkronizasyonu için kullanılabilir.

**Base endpoint:** `/externalApi/v1/contacts`

**Kontakt tanıma:** `contact_id` parametresi ya AutoiXpert internal ID (`id`) ya da harici ID (`external_id`) olabilir.

---

## Üst Düzey Alanlar

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string, readonly | AutoiXpert internal ID |
| `external_id` | string | Harici sistem ID (CRM ID) |
| **`organization_type`** | string | ⭐ **ZORUNLU** — `OrganizationTypes` enum'undan |
| `salutation` | string | "Herr" / "Frau" |
| `first_name` | string | |
| `last_name` | string | |
| `organization_name` | string | Firma adı |
| `email` | string | Birden fazla → **noktalı virgülle** ayrılır (`a@x.de;b@x.de`) ⭐ |
| `phone` | string | |
| `phone2` | string | İkinci telefon |
| `street_and_housenumber_or_lockbox` | string | Sokak + ev no veya posta kutusu |
| `zip` | string | PLZ |
| `city` | string | |
| `notes` | string | |
| `may_deduct_taxes` | bool/null | Vorsteuerabzugsberechtigung — `null` UI'da '?' veya 'unbekannt' |
| `vat_id` | string | KDV no |
| `debtor_number` | string | Borçlu no (muhasebe) |
| `garage_fee_sets` | GarageFeeSet[] | **Sadece** `organization_type=garage` için |
| `created_at` | timestamp, readonly | |

> ⚠️ **EKSİK:** `OrganizationTypes` enum'unun tam listesi belgelenmemiş. Bilinen tek değer: `garage`. Diğerleri muhtemelen: `claimant`, `insurance`, `lawyer`, `intermediary`, `owner`, `author_of_damage` (Gutachten taraflarından çıkarımla). Bu enum'u API'yi test ederken (veya başka bir referans sayfada) öğreneceğiz.

---

## Sub-object: `garage_fee_sets[]` (Werkstattkostensätze)

Sadece atölye (garage) tipindeki kontaklar için. Hesaplama yapılırken kullanılır.

> 🔴 **Kural:** Eğer `garage_fee_sets` boş değilse, **en az biri** `is_default: true` olmalı.

| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | Set ID |
| `title` | string | Örn. "Standard Rates 2025" |
| `valid_from` | date | ISO `YYYY-MM-DD` |
| `is_default` | bool | En az biri `true` olmalı |
| `selected_work_fraction_unit` | number | İş birimi: `1`(saat), `10`, `12`, `100` (AW=Arbeitswert) |
| `mechanics` | GarageWageLevels | Mekanik işçilik |
| `electrics` | GarageWageLevels | Elektrik işçilik |
| `car_body` | GarageWageLevels | Karoseri işçilik |
| `car_paint` | CarPaint | Boyacı yapılandırması |
| `transport` | Transport | Transport ücretlendirme |
| `dents_wage` | number | Göçük çıkarma saatlik ücret (€) |
| `spare_parts_surcharge` | number | Ondalık (`0.15` = %15) |
| `small_parts_surcharge` | number | Birim'e bağlı |
| `small_parts_unit` | string | `percent` / `flatFee` |
| `custom_calculation_items` | CustomItem[] | Özel kalemler |
| `audatex_config_codes` | AudatexCode[] | Audatex entegrasyon kodları |

### `GarageWageLevels` (mechanics, electrics, car_body)
| Alan | Tip | Notlar |
|---|---|---|
| `first_level` | number | Lohnstufe 1 (€/saat veya AW) |
| `second_level` | number | Lohnstufe 2 |
| `third_level` | number | Lohnstufe 3 |

### `CarPaint` (`car_paint`)
| Alan | Tip | Notlar |
|---|---|---|
| `paint_system` | string | `allianzCenterForTechnology` / `manufacturer` / `eurolack` |
| `wage` | number | Boyama saatlik ücret (€) |
| `material_surcharge_unit` | string | `percent` / `materialIndex` / `materialPointsOrUnits` / `flatFee` |
| `material_surcharge_default` | number | Varsayılan |
| `material_surcharges_by_paint_type` | PaintSurcharge[] | Boya tipine göre |

### `PaintSurcharge` (`material_surcharges_by_paint_type[]`)
| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `paint_type` | string | `uni` / `metallic` / `perlcolor` |
| `value` | number | `material_surcharge_unit`'e göre |

### `Transport` (`transport`)
| Alan | Tip | Notlar |
|---|---|---|
| `calculation_type` | string | `none` / `mechanics` / `electrics` / `carBody` / `fixedPrice` |
| `time_required` | number | İş birimi cinsinden |
| `fixed_price` | number | Sadece `fixedPrice` ise (€) |

### `CustomItem` (`custom_calculation_items[]`)
| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `value_net` | number | Net (€) |

### `AudatexCode` (`audatex_config_codes[]`)
| Alan | Tip | Notlar |
|---|---|---|
| `id` | string | |
| `numerical_code` | number | Audatex kodu |
| `title` | string | |
| `value_type` | string | `currency` / `workFractionUnits` / `percent` |
| `value` | number | |

---

## Endpoint'ler

### GET tek kontakt
```
GET /externalApi/v1/contacts/{contact_id}
```
`contact_id` = `id` veya `external_id`.

### POST yeni kontakt
```
POST /externalApi/v1/contacts
```
- Zorunlu: `organization_type`
- `id` gönderilirse yok sayılır (otomatik oluşturulur)
- Gönderilmeyen alanlar default'a alınır

### PUT kontakt değiştir (full replace)
```
PUT /externalApi/v1/contacts/{contact_id}
```
- Zorunlu: `organization_type`
- **⚠️ Gönderilmeyen alanlar default'a sıfırlanır**
- Yan ilişkiler korunur (örn. atölye ücretleri)
- `id` yoksayılır

### PATCH kontakt parçalı güncelleme
```
PATCH /externalApi/v1/contacts/{contact_id}
```
- Sadece gönderilen alanlar güncellenir
- **🔴 Önemli kural — `garage_fee_sets`:**
  - Tek bir element güncellenemez (`garage_fee_sets.0.title` ❌)
  - Tüm array değiştirilmeli
  - Boş değilse en az biri `is_default: true` olmalı

### DELETE kontakt
```
DELETE /externalApi/v1/contacts/{contact_id}
```
- ⚠️ **GERİ ALINAMAZ** (Gutachten'in aksine soft-delete YOK)
- Atölye silinirse `garage_fee_sets` de silinir
- **Açık veya kapalı bir Gutachten'de kullanılan kontakt orada kalır**
- Gutachten ilk kez (veya yeniden) tamamlandığında kontakt **yeni bir ID ile** kontak yönetimine eklenir → bu, ilginç bir davranış (referansial bütünlük)

### GET liste
```
GET /externalApi/v1/contacts
```

| Davranış | Değer |
|---|---|
| **Default sayfa boyutu** | **50** ⭐ (Gutachten'in 10'unun 5x'i) |
| **Maksimum `limit`** | **100** |
| **Sıralama** | **SABİT** — her zaman `created_at` (değiştirilemez!) |
| Pagination | `starting_after` cursor (standart) |

> ⚠️ **DİKKAT:** Kontakte için `sort` parametresi **yoksayılır** — her zaman `created_at`. Bu Gutachten'den farklı.

#### Filtreler
| Param | Açıklama |
|---|---|
| `organization_type` | Tek bir tipe filtre |
| `created_at_gte` | Oluşturma ≥ |
| `created_at_lte` | Oluşturma ≤ |
| `search` | Tam metin araması |

#### `search` Parametresi (özel davranış)

- Boşlukla ayrılmış kelimeler → **VE** mantığı (hepsi olmalı)
- Her kelime **en az 3 karakter** olmalı
- Aranacak alanlar:
  - `first_name`, `last_name`, `organization_name`
  - `street_and_housenumber_or_lockbox`, `zip`, `city`
  - `phone`, `email`
  - Atölye için ek: marka, atölye özellikleri

Örnek:
```
GET /v1/contacts?search=BMW%20Ulm
```
→ Hem "BMW" hem "Ulm" geçen tüm kontakları getirir.

---

## 🔴 Önemli Farklar — Gutachten vs Kontakte

| Özellik | Gutachten | Kontakte |
|---|---|---|
| Default sayfa | 10 | **50** |
| Max limit | 10 | **100** |
| Sort değiştirilebilir mi | ✅ Evet (5 alan) | ❌ Sabit `created_at` |
| Delete davranışı | Soft (30 gün geri alma) | **Hard (geri alınamaz)** |
| PUT desteği | ❌ Yok (sadece PATCH) | ✅ Var (full replace) |
| `state` alanı | Var (recorded/locked/deleted) | Yok |

## Bizim Şema Tarafına Etkisi

```
autoixpert_contacts                      ← yeni tablo
├── id (PK, AutoiXpert internal)
├── external_id (nullable, unique?)
├── organization_type (NOT NULL)
├── ...iletişim alanları (string sütunlar)
├── may_deduct_taxes (bool nullable)
├── vat_id, debtor_number
├── garage_fee_sets (JSONB nullable)    ← karmaşık yapı, JSONB makul
├── created_at (timestamp)
├── synced_at (timestamp)               ← bizim ekleme
├── raw_payload (JSONB)                 ← yedek
└── deleted_at (timestamp nullable)     ← soft delete BİZ tarafında

autoixpert_contact_garage_fee_sets       ← OPSİYONEL ayrı tablo
                                          (garage_fee_sets normalize edilirse;
                                           ama JSONB ile başlamak daha basit)
```

> **Karar:** `garage_fee_sets` JSONB olarak tutulacak. Çünkü:
> - 5 nested obje + 4 array içeriyor
> - Her güncelleme tüm array'i değiştiriyor (PATCH kuralı)
> - Sorgulama gerekirse JSONB indeksleriyle hâlâ performans alınabilir
> - İlerde gerekirse normalize edilir (faz 3)

## Eksik Bilgi

- [ ] `OrganizationTypes` enum'unun TAM listesi (`garage` biliniyor, diğerleri?)
- [ ] Atölye markaları/özellikleri için ayrı endpoint var mı? (search'te geçiyor)
- [ ] Aynı `external_id`'ye sahip iki kontakt oluşturulabilir mi? (constraint)
- [ ] Bir kontakta birden fazla `email` (semicolon-separated) — UI'da nasıl gözüküyor?
