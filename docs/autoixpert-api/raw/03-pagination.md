# AutoiXpert API — Pagination

> **Kaynak:** https://dev.autoixpert.de/dokumentation/loslegen/pagination (tahmini)
> **Dil:** Almanca (orijinal) ✅

---

## Genel Davranış

- Cursor-based pagination (offset/skip **yok**)
- Liste endpoint'leri (Gutachten, Kontakte, Rechnungen) için aynı sistem
- `has_more: true` ise → daha fazla veri var → `next_page` cursor'unu kullan
- `has_more: false` ise → bitti, `next_page` dönmez

## Parametreler

| Parametre | Tip | Açıklama |
|---|---|---|
| `sort` | string | Sıralama alanı (endpoint-specific) |
| `sort_direction` | string | `asc` (default) / `desc` |
| **`starting_after`** | string | ⭐ Önceki yanıttaki `next_page` değeri |
| `limit` | number | Sayfa boyutu — endpoint-specific maksimum aşılırsa max kullanılır |

> Ek olarak endpoint-specific filtreler (Gutachten için: `is_done`, `report_type`, `created_at_gte` vb.)

## Yanıt Formatı

```json
{
  "reports": [/* ... */],
  "has_more": true,
  "next_page": "CKAoGgkpcPMwVXkBAAA="
}
```

Son sayfa:
```json
{
  "reports": [/* ... */],
  "has_more": false
  // next_page YOK
}
```

> ℹ️ **Doküman tutarsızlığı:** Örnek yanıtta `contacts` array'i geçiyor ama istek `/reports`'a yapılıyor — bu doküman yazım hatası. Asıl array adı endpoint'e göre değişir (`reports`, `contacts`, `invoices`).

## ⚠️ KRİTİK Cursor Kuralları

1. **`starting_after` verilmezse** → her zaman ilk sayfadan başlar
2. **Sıralama veya filtre değiştirilirse** → cursor geçersiz, **istek başarısız** olur
3. **`limit` değişebilir** → ardışık çağrılarda farklı sayfa boyutu sorun değil
4. **`skip` desteği YOK** → kayıt atlama yapılamaz
5. Cursor (next_page) muhtemelen base64 encoded opaque token — biz decode etmemeliyiz

## Bizim Import Script İçin Etkileri

```typescript
// Pseudocode
const FIXED_SORT = 'created_at';
const FIXED_DIRECTION = 'asc';   // En eski kayıttan başla — yeniden başlamak gerekirse stabil
const FIXED_FILTER = {};         // Tam tarama, filtre yok

let cursor: string | undefined = undefined;
let totalFetched = 0;

while (true) {
  const params: Record<string, string> = {
    sort: FIXED_SORT,
    sort_direction: FIXED_DIRECTION,
    limit: '10',  // Reports için max 10
    ...FIXED_FILTER,
  };
  if (cursor) params.starting_after = cursor;

  const res = await fetchReports(params);
  await upsertReportsIntoSupabase(res.reports);  // idempotent
  totalFetched += res.reports.length;

  // Checkpoint: mevcut cursor'ı sync_log tablosuna kaydet (kesinti olursa devam)
  await saveSyncCheckpoint({ cursor: res.next_page, fetched: totalFetched });

  if (!res.has_more) break;
  cursor = res.next_page;

  // Rate limit'e saygı — Pricing sayfasından öğreneceğimiz değer
  await sleep(200);
}
```

## Senkronizasyon Stratejisi (Faz 1 + Faz 2)

### Faz 1 — İlk tam yükleme
- `created_at asc` ile en eski rapora kadar in
- Her sayfa sonrası checkpoint
- Tamamlandığında `last_full_sync_at` kaydet

### Faz 2 — Incremental (cron)
- `updated_at_gte={last_sync_at}` filtresi ile sadece değişenleri çek
- `updated_at asc` ile sırala
- Yine cursor pagination

## Eksik / Sonradan Doğrulanacak

- [ ] `next_page` cursor'unun süresi (örn. 1 saat sonra geçersiz mi?)
- [ ] Reports için `limit` max **10** (Gutachten'de yazıyordu) — diğer endpoint'ler (Kontakte, Rechnungen) için maksimum?
- [ ] Cursor üzerinden geri sayfaya dönüş (backward pagination) var mı? Görünüşe göre yok.
- [ ] Filter değişince hata kodu ne? (`PAGINATION_FILTER_CHANGED` gibi bir error_code mu?)
