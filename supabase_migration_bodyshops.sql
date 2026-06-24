-- =====================================================================
-- MIGRATION — KAPORTA (Body Shop / Karosserie) ŞİRKETLERİ
-- =====================================================================
-- Amaç: Sigorta şirketleri (insurers) yapısının birebir kaportası —
--       bodyshops + bodyshop_assignments tabloları, RLS, admin policy,
--       indeksler ve realtime publication.
-- Idempotent: Evet (IF NOT EXISTS / DROP POLICY IF EXISTS ...)
-- Bağımlılık: customers tablosu + public.is_admin() fonksiyonu (06_rls_policies.sql)
-- Çalıştırma: Supabase SQL Editor'de tek seferde çalıştırın.
-- =====================================================================

-- ─── 1) Tablolar ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bodyshops (
  id           TEXT        PRIMARY KEY DEFAULT 'bs' || substr(md5(random()::text), 1, 7),
  company      TEXT        NOT NULL,
  name         TEXT,
  email        TEXT        UNIQUE NOT NULL,
  phone        TEXT,
  password     TEXT,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bodyshop_assignments (
  id           TEXT        PRIMARY KEY DEFAULT 'ba' || substr(md5(random()::text), 1, 7),
  bodyshop_id  TEXT        NOT NULL REFERENCES public.bodyshops(id) ON DELETE CASCADE,
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bodyshop_id, customer_id)
);

-- ─── 2) İndeksler ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bodyshop_assignments_bodyshop ON public.bodyshop_assignments(bodyshop_id);
CREATE INDEX IF NOT EXISTS idx_bodyshop_assignments_customer ON public.bodyshop_assignments(customer_id);

-- ─── 3) RLS + admin policy (insurers ile aynı mimari) ────────────────
-- Service role RLS'i bypass eder; admin (is_admin()) full CRUD yapar.
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['bodyshops', 'bodyshop_assignments'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── 4) Realtime publication (supabase_realtime) ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.bodyshops;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.bodyshop_assignments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ─── 5) Örnek kayıtlar (opsiyonel — seedDB ile uyumlu) ───────────────
INSERT INTO public.bodyshops (id, company, name, email, phone, password, active, created_at) VALUES
  ('bs1', 'AutoLack & Karosserie Köln', 'Mehmet Yıldız', 'info@autolack-koeln.de', '+49 221 555 1010', 'kaporta123', TRUE, '2026-04-02'),
  ('bs2', 'Karosseriebau Schmitz GmbH', 'Stefan Schmitz', 'kontakt@schmitz-kfz.de', '+49 211 555 2020', 'kaporta123', TRUE, '2026-04-06'),
  ('bs3', 'Premium Dellen & Lack', 'Ali Demir', 'service@premium-lack.de', '+49 231 555 3030', 'kaporta123', TRUE, '2026-04-11')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- SON. Doğrulama:
--   SELECT * FROM public.bodyshops;
--   SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE 'bodyshop%';
-- =====================================================================
