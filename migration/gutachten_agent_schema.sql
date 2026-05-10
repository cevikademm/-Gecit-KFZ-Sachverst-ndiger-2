-- ════════════════════════════════════════════════════════════════════════
-- Gutachten Agent — Supabase Schema
-- ════════════════════════════════════════════════════════════════════════
-- Bu migration tek seferde Supabase SQL Editor'da çalıştırılır.
--
-- Yarattıkları:
--   1. gutachten_agent_sessions   — kullanıcının rapor oluşturma oturumu (draft + state)
--   2. gutachten_agent_messages   — chat geçmişi (user / assistant / system)
--   3. gutachten_agent_corpus_stats — pre-computed istatistik cache (RAG için)
--   4. RLS politikaları (admin all, service_role bypass)
--   5. updated_at otomatik trigger
--   6. Performans index'leri
--
-- Önkoşul:
--   - is_admin() SECURITY DEFINER fonksiyonu mevcut (supabase_fix_rls_recursion.sql)
--   - autoixpert_reports tablosu mevcut (corpus stats join için)
-- ════════════════════════════════════════════════════════════════════════

-- ─── 0. Yardımcı: updated_at trigger fonksiyonu ────────────────────────
-- (zaten varsa atla)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════
-- 1. gutachten_agent_sessions
-- ════════════════════════════════════════════════════════════════════════
-- Bir admin "Rapor Oluştur" butonuna bastığında bir session açılır.
-- Agent kullanıcıyla diyalog kurar; topladığı veriler `draft` JSONB'sine eklenir.
-- Session bittikçe `status` = 'completed' olur, draft form'a inject edilir.

CREATE TABLE IF NOT EXISTS gutachten_agent_sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Bu session'ı başlatan kullanıcı (genelde admin)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- (opsiyonel) Agent başlangıçta hangi müşteri/araç için açıldıysa
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id text,  -- vehicles tablosu var ama opsiyonel; FK koymadık ki agent yeni araç da yaratabilsin

  -- Rapor türü (liability / partial_kasko / full_kasko / valuation / ...)
  -- AutoiXpert API enum'u ile aynı
  report_type text,

  -- Session durumu
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned', 'injected', 'error')),

  -- 14 adımlı akışta hangi adımda? (1..14 veya 'review')
  current_step text,

  -- Toplanmış veri — AdminReportEditor.jsx initialDraft formatıyla aynı
  -- Anahtarlar: claimant, report, accident, visit, opponent, insurance,
  --             vehicle, condition, damages, tires, calculation, invoice, signatures
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Agent'ın kullandığı LLM model adı (örn. "claude-opus-4-7")
  model text,

  -- Tahmini token sayacı (cost takibi için)
  total_tokens_input integer NOT NULL DEFAULT 0,
  total_tokens_output integer NOT NULL DEFAULT 0,

  -- Hata varsa
  error_message text,

  -- Session form'a inject edildikten sonra appraisal'a bağlanır
  injected_appraisal_id text,  -- appraisals.id (text); injection sonrası set edilir

  -- Zaman damgaları
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Index'ler — sık sorgular
CREATE INDEX IF NOT EXISTS idx_gas_user      ON gutachten_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gas_customer  ON gutachten_agent_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_gas_vehicle   ON gutachten_agent_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gas_status    ON gutachten_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_gas_started   ON gutachten_agent_sessions(started_at DESC);
-- "Aktif session var mı?" sorgusu için partial index
CREATE INDEX IF NOT EXISTS idx_gas_active_user ON gutachten_agent_sessions(user_id, started_at DESC)
  WHERE status = 'active';

-- updated_at otomatik
DROP TRIGGER IF EXISTS trg_gas_updated_at ON gutachten_agent_sessions;
CREATE TRIGGER trg_gas_updated_at
  BEFORE UPDATE ON gutachten_agent_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE gutachten_agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gas_admin_all ON gutachten_agent_sessions;
CREATE POLICY gas_admin_all ON gutachten_agent_sessions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- (İleride) Kullanıcı kendi session'larını okuyabilsin — şimdilik sadece admin
-- DROP POLICY IF EXISTS gas_owner_read ON gutachten_agent_sessions;
-- CREATE POLICY gas_owner_read ON gutachten_agent_sessions
--   FOR SELECT USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════════
-- 2. gutachten_agent_messages
-- ════════════════════════════════════════════════════════════════════════
-- Bir session'daki mesaj geçmişi. LLM context window için kronolojik tutulur.
-- Replay/audit için kalıcı; sınırlı tutmak istenirse partition + drop policy eklenir.

CREATE TABLE IF NOT EXISTS gutachten_agent_messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,

  session_id text NOT NULL REFERENCES gutachten_agent_sessions(id) ON DELETE CASCADE,

  -- 'user' = admin'in girdiği mesaj
  -- 'assistant' = agent'ın cevabı
  -- 'system' = system prompt veya tool call (debug)
  -- 'tool' = araç çağrısı sonucu (DAT lookup, supabase query vs.)
  role text NOT NULL
    CHECK (role IN ('user', 'assistant', 'system', 'tool')),

  -- Mesaj içeriği (markdown destekli)
  content text NOT NULL,

  -- Hangi adımda sorulmuş / hangi field'a bağlı (debug + analytics)
  -- Örn: { "step": 4, "field": "vehicle.vin", "expecting": "string", "validation": "vin17" }
  metadata jsonb,

  -- Token sayacı (bu spesifik mesaj için)
  tokens_input integer,
  tokens_output integer,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gam_session     ON gutachten_agent_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gam_role        ON gutachten_agent_messages(role);
CREATE INDEX IF NOT EXISTS idx_gam_created     ON gutachten_agent_messages(created_at DESC);

ALTER TABLE gutachten_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gam_admin_all ON gutachten_agent_messages;
CREATE POLICY gam_admin_all ON gutachten_agent_messages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ════════════════════════════════════════════════════════════════════════
-- 3. gutachten_agent_corpus_stats
-- ════════════════════════════════════════════════════════════════════════
-- Pre-computed istatistik cache: agent her sorduğunda 200 raporu yeniden tarar
-- yerine, periyodik olarak hesaplanmış değerlere bakar (RAG hızlandırma).
--
-- Örnek satırlar:
--   ('make_model', 'BMW', '320d', { "avg_repair": 4823.50, "avg_wm": 715.20, "n": 12 })
--   ('damage_combo', 'frontLeft+hood', null, { "typical_repair_range": [2500, 8500], "n": 28 })
--
-- Yeniden hesaplama: scripts/autoixpert/compute-corpus-stats.js (yapılacak)

CREATE TABLE IF NOT EXISTS gutachten_agent_corpus_stats (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- İstatistik kategorisi
  -- 'make_model'        → marka+model bazlı
  -- 'make_year'         → marka+yaş bazlı
  -- 'damage_combo'      → hasar bölgesi kombinasyonu
  -- 'shape'             → araç tipi (sedan/suv/...)
  -- 'wm_ratio'          → wertminderung / repair oranı
  -- 'bvsk_distribution' → BVSK koridoru dağılımı
  -- 'circumstances'     → sık kullanılan kaza ifadeleri
  -- 'damage_description' → sık kullanılan hasar açıklamaları
  category text NOT NULL,

  -- Anahtar 1 (örn. marka)
  key1 text,
  -- Anahtar 2 (örn. model)
  key2 text,
  -- Anahtar 3 (örn. yıl aralığı)
  key3 text,

  -- Hesaplanmış değerler — esnek JSONB
  -- {
  --   "n": 12,                         -- örnek sayısı
  --   "avg_repair_net": 4823.50,
  --   "p50_repair_net": 4500.00,       -- median
  --   "p90_repair_net": 7200.00,
  --   "avg_wm": 715.20,
  --   "wm_to_repair_ratio": 0.148,
  --   "examples": ["report_id_1", ...] -- temsili örnekler (opsiyonel)
  -- }
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Hangi raporlar baz alındı (en son hesaplama zamanı)
  -- Yeni raporlar geldikçe eski stats güncel olmaz; yeniden compute gerekir
  source_count integer,
  computed_at timestamptz NOT NULL DEFAULT now(),

  -- Aynı (category, key1, key2, key3) tek satır
  UNIQUE (category, key1, key2, key3)
);

CREATE INDEX IF NOT EXISTS idx_gacs_category   ON gutachten_agent_corpus_stats(category);
CREATE INDEX IF NOT EXISTS idx_gacs_lookup     ON gutachten_agent_corpus_stats(category, key1, key2);
CREATE INDEX IF NOT EXISTS idx_gacs_computed   ON gutachten_agent_corpus_stats(computed_at DESC);

ALTER TABLE gutachten_agent_corpus_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gacs_admin_all ON gutachten_agent_corpus_stats;
CREATE POLICY gacs_admin_all ON gutachten_agent_corpus_stats
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Service role'un kompüt script'i çalıştırırken yazabilmesi için ek policy değil,
-- service_role anahtarı RLS'i bypass eder, gerek yok.


-- ════════════════════════════════════════════════════════════════════════
-- 4. Realtime publication (opsiyonel — chat UI canlı güncelleme isterse)
-- ════════════════════════════════════════════════════════════════════════
-- Sadece messages için aç; sessions zaten manuel state update gerektirir.
-- (Mevcut realtime publication varsa)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Tablo zaten publication'da olabilir — IF NOT EXISTS yok, manuel kontrol
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'gutachten_agent_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE gutachten_agent_messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'gutachten_agent_sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE gutachten_agent_sessions;
    END IF;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════
-- 5. PostgREST schema cache reload (alanlar PostgREST'e görünsün)
-- ════════════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';


-- ════════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI (migration sonrası çalıştır, sonuç boş olmamalı)
-- ════════════════════════════════════════════════════════════════════════

-- Tablolar oluşturuldu mu?
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' AND table_name LIKE 'gutachten_agent%'
--  ORDER BY table_name;

-- RLS aktif mi?
-- SELECT tablename, rowsecurity FROM pg_tables
--  WHERE schemaname = 'public' AND tablename LIKE 'gutachten_agent%';

-- Policy'ler var mı?
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE tablename LIKE 'gutachten_agent%';

-- Index'ler var mı?
-- SELECT tablename, indexname FROM pg_indexes
--  WHERE tablename LIKE 'gutachten_agent%' ORDER BY 1, 2;
