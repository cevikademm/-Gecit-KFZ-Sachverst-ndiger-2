-- ════════════════════════════════════════════════════════════════════════
-- Appraisals — Agent için ek kolonlar
-- ════════════════════════════════════════════════════════════════════════
-- Yarattıkları:
--   1. customer_id   — hızlı müşteri-bazlı sorgular için (denormalize)
--   2. draft_data    — Agent'ın ürettiği tam JSON draft (AdminReportEditor formatı)
--   3. created_by    — 'manual' | 'ai_agent' | 'autoixpert'
--   4. agent_session_id — gutachten_agent_sessions ile bağ (opsiyonel ama yararlı)
--
-- Mevcut satırlar otomatik olarak 'manual' olarak işaretlenir; customer_id
-- vehicle.owner_id'den backfill edilir.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS customer_id        text REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_data         jsonb,
  ADD COLUMN IF NOT EXISTS created_by         text NOT NULL DEFAULT 'manual'
    CHECK (created_by IN ('manual', 'ai_agent', 'autoixpert')),
  ADD COLUMN IF NOT EXISTS agent_session_id   text REFERENCES gutachten_agent_sessions(id) ON DELETE SET NULL;

-- Backfill: mevcut appraisals için customer_id'yi vehicle.owner_id'den doldur
UPDATE appraisals a
   SET customer_id = v.owner_id
  FROM vehicles v
 WHERE a.vehicle_id = v.id
   AND a.customer_id IS NULL;

-- Performans index'leri
CREATE INDEX IF NOT EXISTS idx_appraisals_customer    ON appraisals(customer_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_created_by  ON appraisals(created_by);
CREATE INDEX IF NOT EXISTS idx_appraisals_session     ON appraisals(agent_session_id);

-- PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- ─── Doğrulama (migration sonrası çalıştır) ──────────────────────────
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_name = 'appraisals'
--    AND column_name IN ('customer_id', 'draft_data', 'created_by', 'agent_session_id')
--  ORDER BY column_name;

-- SELECT created_by, COUNT(*)
--   FROM appraisals
--  GROUP BY 1;
