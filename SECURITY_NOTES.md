# Güvenlik Notları — Gecit KFZ

Tarih: 2026-06-24 · Denetleyen: otomatik bakım

## Durum Özeti (İYİ)

- ✅ `.gitignore` `.env`, `.env.local`, `.env*.local` ve `.vercel/` dosyalarını kapsıyor.
- ✅ `.env.local` git tarafından **izlenmiyor** (commit edilmemiş).
- ✅ `service_role` anahtarı frontend kodunda (`src/`) **hiç kullanılmıyor** → tarayıcı bundle'ına sızmıyor.
- ✅ Bundle'a giren tek Supabase değişkenleri: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (doğru; anon key zaten herkese açık olabilir).

## Dikkat Edilecekler

1. **`service_role` anahtarı düz metin dosyalarda duruyor** (`.env.local`, `.vercel/.env.production.local`).
   Bu anahtar RLS'i tamamen bypass eder (tüm müşteri verisine admin erişimi). Dosyalar git'te değil
   ama indirilmiş/paylaşılan bir klasörde plaintext duruyor.
   - **Öneri:** Tedbiren anahtarı **rotate et**:
     Supabase Dashboard → Project Settings → API → `service_role` → **Reset/Roll**.
     Sonra yeni anahtarı sadece sunucu tarafı script'lerinde (`.env.local`) güncelle.

2. **Vercel'de `SERVICE_ROLE_KEY` ortam değişkeni** tanımlı görünüyor. Bu proje saf statik bir Vite SPA;
   serverless fonksiyon yok. Yani service_role'u Vercel'de tutmaya gerek yok ve gereksiz risk.
   - **Öneri:** Vercel → Project → Settings → Environment Variables → `SERVICE_ROLE_KEY`'i **sil**
     (yalnızca yerel import script'leri kullanıyorsa orada `.env.local`'de kalsın).

3. **AutoiXpert API anahtarı** (`AUTOIXPERT_API_KEY`) ve SMTP bilgileri de `.env.local`'de.
   Bunlar VITE_ prefix'li olmadığı için bundle'a girmez; yine de dosyayı kimseyle paylaşma.

## Yapılması Gerekenler (senin elinle — ben yapamam)

- [ ] `service_role` anahtarını rotate et (yukarıdaki adım 1).
- [ ] Vercel'den gereksiz `SERVICE_ROLE_KEY` değişkenini kaldır (adım 2).
- [ ] Bu klasörü (ZIP/Drive vb.) kimseyle paylaşma; paylaşman gerekirse `.env*` dosyalarını çıkar.
