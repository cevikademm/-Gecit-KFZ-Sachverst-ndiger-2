-- =====================================================================
-- 01 — EXTENSIONS & ENUMS
-- =====================================================================
-- Amaç: PostgreSQL extension'larını ve uygulama genelinde kullanılan
--       sabit/check değerlerini tanımlar.
-- Sıra: 1/8 — bu dosya HER ŞEYDEN ÖNCE çalıştırılmalı.
-- Idempotent: Evet (CREATE EXTENSION IF NOT EXISTS)
-- Çalıştırma: Supabase Dashboard → SQL Editor → New Query → yapıştır → Run
-- =====================================================================

-- ─── Extensions ──────────────────────────────────────────────────────
-- uuid-ossp : uuid_generate_v4() — autoixpert_sync_log için
-- pgcrypto  : gen_random_uuid() + md5() rastgele PK
-- pg_trgm   : (opsiyonel) müşteri arama için trigram benzerlik
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Notlar: ENUM seçimi ─────────────────────────────────────────────
-- Bu projede ENUM TİPİ KULLANILMIYOR. Status alanları TEXT + CHECK
-- constraint olarak tanımlandı. Sebepleri:
--   1. CHECK constraint'leri ALTER TABLE ile kolay genişletilebilir.
--   2. ENUM tipi PostgREST üzerinden filtre/sort için ek tip dönüşümü
--      gerektiriyor; TEXT direkt çalışıyor.
--   3. Frontend (React) zaten string karşılaştırması yapıyor.
--
-- Kullanılan değer setleri (referans):
--   user_profiles.role        : super_admin, admin, customer, lawyer, insurance
--   customers.type            : bireysel, kurumsal
--   appraisals.status         : bekliyor, teslim_alindi, inceleniyor,
--                               rapor_yaziliyor, tamamlandi, mekanik,
--                               kaporta, rapor
--   invoices.status           : bekliyor, ödendi, iptal
--   appointments.status       : aktif, iptal, tamamlandi
--   lawyer_cases.status       : aktif, beklemede, kazanildi, kaybedildi, kapali
--   insurance_claims.status   : inceleniyor, teklif_verildi, onaylandi,
--                               reddedildi, kapali
--   messages.contact_type     : customer, lawyer, insurance
--   damage_photos.type        : before, after, detail
--   damage_timeline.actor     : customer, admin, system, insurance, lawyer
--   accounting_entries.type   : income, expense
--   autoixpert_reports.type   : liability, short_assessment, partial_kasko,
--                               full_kasko, valuation,
--                               oldtimer_valuation_small, lease_return,
--                               used_vehicle_check, invoice_audit
--   autoixpert_reports.state  : done, recorded, locked, deleted
--   autoixpert_sync_log.resource: reports, contacts, invoices
--   autoixpert_sync_log.status: running, success, failed, partial

-- ─── Doğrulama ───────────────────────────────────────────────────────
-- Bu sorgu en az 3 satır dönmeli (uuid-ossp, pgcrypto, pg_trgm):
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm')
ORDER BY extname;
