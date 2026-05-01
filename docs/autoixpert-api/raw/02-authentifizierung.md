# AutoiXpert API — Authentifizierung

> **Kaynak:** https://dev.autoixpert.de/dokumentation/loslegen/authentifizierung (tahmini)
> **Dil:** Almanca (orijinal) ✅

---

## Header Format

```http
Authorization: Bearer API_KEY
```

```bash
curl https://app.autoixpert.de/externalApi/v1/reports \
-H "Authorization: Bearer API_KEY"
```

## API Anahtarı Özellikleri

| Özellik | Davranış |
|---|---|
| Yetki kapsamı | API-Schlüssel sahibinin tüm AutoiXpert hesabına erişim |
| Çoklu anahtar | ✅ Destekleniyor — birden fazla anahtar oluşturulabilir |
| İsimlendirme | Her anahtara label/Bezeichnung verilebilir |
| Süre (expiration) | ❌ Belirtilmemiş — kalıcı görünüyor (manuel yönetim) |
| **İzinler (Berechtigungen)** | ⭐ Anahtar başına özelleştirilebilir |
| Deaktivasyon | Geri alınabilir (deaktivieren / aktivieren) |
| Silme | ❌ Geri alınamaz |

## İzinler (Berechtigungen) — KRİTİK

> _"Für API-Schlüssel können dieselben Berechtigungen vergeben werden, wie für reguläre Nutzer."_

API anahtarına **normal kullanıcı izinleri** atanabilir. Her izin tek tek aç/kapa yapılabilir.

> 🔐 **Güvenlik prensibi (least privilege):** AutoiXpert açıkça belirtiyor — sadece zorunlu izinler verilmeli.

**Bizim için yapacağımız:**
- Tek seferlik **read-only** import için: minimum izin = "Gutachten okuma" + "Kontakte okuma" + "Rechnungen okuma"
- Yazma izinleri (POST/PUT/PATCH/DELETE) **VERİLMEMELİ** — bizim use-case'imiz okuma odaklı

> ⚠️ Müşteri şu an verdiği `qcA33B4ulNyv` anahtarının izinleri ne? **Müşteriden öğrenmemiz gerekiyor:** AutoiXpert'te → Einstellungen → Externe API → İlgili anahtar → 3-nokta menü → "Berechtigungen" — listeyi paylaşmasını rica edeceğiz.

## Anahtar Yaşam Döngüsü

UI üzerinden (AutoiXpert ayarlarında):
1. **Erstellung** — "Neuer Zugangsschlüssel"
2. **Bezeichnung ändern** — yeniden adlandırma (3-nokta menü)
3. **Berechtigungen einstellen** — izin yönetimi
4. **Deaktivieren** — geçici devre dışı (geri alınabilir)
5. **Aktivieren** — yeniden aktif et
6. **Löschen** — kalıcı silme (geri alınamaz)

> **Hatalı durum senaryoları:**
> - Anahtar deaktif edildiyse → tüm istekler `API_AUTHENTICATION_KEY_DEACTIVATED` ile reddedilir
> - Anahtar silindiyse → `API_AUTHENTICATION_KEY_NOT_FOUND`

## Hata Yanıt Formatı (KRİTİK)

```json
{
  "status_code": 400,
  "endpoint": "/v1/reports/1",
  "error_code": "...",
  "error_message": "..."
}
```

Tüm hatalarda 4 alan tutarlı:
- `status_code` — HTTP kodu (yanıt başlığıyla aynı)
- `endpoint` — istek yolu
- `error_code` — programatik handling için (sabit string)
- `error_message` — insan-okur mesaj (İngilizce)

> ℹ️ **Önemli gözlem:** Auth hataları **400** döner, **401 değil**. Bu standart dışı (RFC 7235'e göre 401 Unauthorized olmalı). Kod yazarken `response.status === 401` yerine `error_code` ile kontrol etmeliyiz.

## Auth Error Codes (TAM LİSTE)

| `error_code` | HTTP | Anlam | Senaryo |
|---|---|---|---|
| `API_AUTHENTICATION_MISSING` | 400 | Header yok | `Authorization` header gönderilmedi |
| `API_AUTHENTICATION_INVALID_FORMAT` | 400 | Format hatalı | Header var ama `Bearer ...` değil |
| `API_AUTHENTICATION_KEY_NOT_FOUND` | 400 | Anahtar yok | Yanlış anahtar veya silinmiş |
| `API_AUTHENTICATION_KEY_DEACTIVATED` | 400 | Anahtar deaktif | Müşteri anahtarı geçici durdurmuş |

## Bizim Kod Tarafında Yapılacaklar

```typescript
// API client'ta error handling
type AutoiXpertError = {
  status_code: number;
  endpoint: string;
  error_code: string;
  error_message: string;
};

// Auth hata kontrolü — status code DEĞİL, error_code üzerinden
if (error.error_code?.startsWith('API_AUTHENTICATION_')) {
  // Anahtar sorunu — kullanıcıya bildir, retry yapma
  throw new AuthenticationError(error.error_code);
}
```

## Eksik Bilgi

- [ ] Authorization header eksik formatları için exact error mesajları (Bearer yerine Basic gönderilirse?)
- [ ] Rate limit hata kodları (429 ile mi gelir, başka error_code mu?) — Fehlerbehandlung sayfasından
- [ ] Yetkisiz erişim (anahtar var ama izin yok) — `API_AUTHORIZATION_*` mı bakıyor?
