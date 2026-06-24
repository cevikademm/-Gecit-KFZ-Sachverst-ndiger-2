-- ═══════════════════════════════════════════════════════════════
-- Gecit KFZ — Şema Senkron Yaması (Schema Drift Fix)
-- ───────────────────────────────────────────────────────────────
-- AMAÇ: Uygulama kodunun (App.jsx → KNOWN_COLUMNS) yazmaya çalıştığı
-- ama canlı veritabanında BULUNMAYAN kolonları ekler. Bu kolonlar
-- eksik olduğunda ilgili kaydın upsert'ü tümüyle patlıyordu ve kayıt
-- KAYDEDİLMİYORDU. Bu dosya çalıştırıldığında ilgili alanlar da kalıcı olur.
--
-- ÇALIŞTIRMA: Supabase Dashboard → SQL Editor → bu dosyanın tamamını yapıştır → RUN
-- GÜVENLİ: Hepsi "ADD COLUMN IF NOT EXISTS" (idempotent) + nullable + FK'siz.
--          Mevcut veriyi DEĞİŞTİRMEZ, tekrar tekrar çalıştırılabilir.
-- ═══════════════════════════════════════════════════════════════

-- ─── appraisals ─────────────────────────────────────────────
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS type        TEXT;
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS total_value NUMERIC(12,2);
ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS damage_sum  NUMERIC(12,2);

-- ─── invoices ───────────────────────────────────────────────
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS appraisal_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date     TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax          NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total        NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency     TEXT DEFAULT 'EUR';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_path     TEXT;

-- ─── insurance_claims ───────────────────────────────────────
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS claim_no TEXT;

-- ─── insurance_offers ───────────────────────────────────────
ALTER TABLE insurance_offers ADD COLUMN IF NOT EXISTS valid_until TEXT;

-- ─── lawyer_tasks ───────────────────────────────────────────
ALTER TABLE lawyer_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- ─── lawyer_cases ───────────────────────────────────────────
ALTER TABLE lawyer_cases ADD COLUMN IF NOT EXISTS case_no TEXT;
ALTER TABLE lawyer_cases ADD COLUMN IF NOT EXISTS court   TEXT;

-- ─── messages ───────────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS case_id        TEXT;

-- ─── activity_logs ──────────────────────────────────────────
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_role  TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- ─── damage_photos ──────────────────────────────────────────
ALTER TABLE damage_photos ADD COLUMN IF NOT EXISTS appraisal_id   TEXT;
-- (storage_bucket / public_url canlıda zaten var; yine de güvence:)
ALTER TABLE damage_photos ADD COLUMN IF NOT EXISTS storage_bucket TEXT;
ALTER TABLE damage_photos ADD COLUMN IF NOT EXISTS public_url     TEXT;

-- ─── reminders ──────────────────────────────────────────────
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ─── customer_documents (güvence — canlıda var) ─────────────
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS storage_bucket TEXT;
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS public_url     TEXT;

-- PostgREST şema cache'ini tazele (yeni kolonlar hemen görünür olsun)
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- Doğrulama (opsiyonel): çalıştırdıktan sonra şunu koşabilirsin —
-- SELECT table_name, column_name FROM information_schema.columns
-- WHERE table_schema='public'
--   AND (table_name,column_name) IN (
--     ('appraisals','total_value'),('invoices','total'),('messages','attachment_url'),
--     ('activity_logs','user_role'),('reminders','user_id'))
-- ORDER BY 1,2;
-- ═══════════════════════════════════════════════════════════════
