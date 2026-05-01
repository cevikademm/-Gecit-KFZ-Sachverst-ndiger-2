# AutoiXpert API — Einleitung (Giriş)

> **Kaynak:** https://dev.autoixpert.de/dokumentation/loslegen/einleitung (tahmini)
> **Dil:** Almanca (orijinal, çevirisiz) ✅

---

## Genel Bakış (Übersicht)

| Özellik | Değer |
|---|---|
| Base URL | `https://app.autoixpert.de/externalApi` |
| Versiyon prefix'i | `/v1/` (örnek: `/externalApi/v1/reports`) |
| HTTPS zorunlu | Evet — HTTP istekleri reddedilir |
| Format | JSON (gelen ve giden) |
| **Naming convention** | **`snake_case`** (tüm property'ler) ⭐ |
| HTTP metotları | POST, PUT, PATCH, DELETE |
| Mimari | RESTful — her kaynak benzersiz URL'de |

## API'nin Kapsamı

API üzerinden yapılabilenler:
- ✅ **Gutachten** okuma / oluşturma / değiştirme / silme
- ✅ **Kontakte** okuma / oluşturma / değiştirme / silme
- ✅ **Rechnungen** okuma / oluşturma / değiştirme / silme
- ✅ **Webhooks** ile değişiklik bildirimleri

## Destek Politikası

- AutoiXpert'in ücretsiz desteği **API kullanımı için yardım sağlamaz**
- API _"eigenständige Integration"_ (bağımsız entegrasyon) için tasarlandı
- Bireysel destek için Vertriebsteam (satış) ile iletişim gerekli

## İlk Örnek — Rapor Oluşturma (POST)

```bash
curl -X POST https://app.autoixpert.de/externalApi/v1/reports \
-H "Authorization: Bearer API_KEY" \
-H "Content-Type: application/json" \
--data '{
  "token": "GA-HS-2024-01-001",
  "type": "liability"
}'
```

Yanıt:
```json
{
  "report": {
    "id": "WqJF5FtPaXL8",
    "token": "GA-HS-2024-01-001",
    "type": "liability"
  }
}
```

> ℹ️ Not: Doküman örneğindeki `token:` (tırnaksız) yazım stili **gerçek JSON değildir** — sadece dökümantasyon kolaylığı için. Gerçek istekte `"token": "..."` şeklinde olmalı.

## Geliştirici Seçenekleri (Entwickleroptionen)

API ayarlarından açılabilen **"AutoiXpert internal IDs in UI"** seçeneği:
- AutoiXpert UI'sında her kaydın ID'si gösterilir
- ID'ye tıklandığında otomatik panoya kopyalanır
- Test/debugging sırasında çok faydalı

**Bizim için anlamı:** Müşteri AutoiXpert UI'sından bir ID görmek istediğinde bu ayarı açabiliriz. Kod tarafında etkisi yok.

## Header Format (örnekten)

```http
Authorization: Bearer API_KEY
Content-Type: application/json
```

> Detaylar Authentifizierung sayfasından gelecek (token süresi, scope, yenileme vb.)
