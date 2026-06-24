-- =====================================================================
-- MIGRATION — KAPORTA (Body Shop) TABLOLARI + GİRİŞ ROLÜ + RLS
-- =====================================================================
-- TEK DOSYA. Supabase → SQL Editor → tamamını yapıştır → "Run".
--
-- Bu migration:
--   1) bodyshops + bodyshop_assignments tablolarını oluşturur (yoksa).
--   2) Bu tablolara RLS + admin policy + realtime ekler.
--   3) user_profiles.role CHECK kısıtına 'kaporta' ekler.
--   4) Kaporta kullanıcısı için RLS (lawyer mimarisinin aynısı):
--      kendi firma kaydı + atamaları + atanmış müşteri/araç/ekspertiz (SELECT).
--   5) PostgREST şema cache'ini yeniler (NOTIFY).
--
-- Bağımlılık: public.is_admin() (ana şemada mevcut).
-- Idempotent: Evet. Tekrar çalıştırmak güvenli.
-- =====================================================================

BEGIN;

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

CREATE INDEX IF NOT EXISTS idx_bodyshop_assignments_bodyshop ON public.bodyshop_assignments(bodyshop_id);
CREATE INDEX IF NOT EXISTS idx_bodyshop_assignments_customer ON public.bodyshop_assignments(customer_id);

-- ─── 2) RLS + admin policy (insurers ile aynı mimari) ────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['bodyshops', 'bodyshop_assignments'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bodyshops; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bodyshop_assignments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ─── 3) role CHECK kısıtına 'kaporta' ekle ───────────────────────────
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'customer', 'lawyer', 'insurance', 'kaporta'));

-- ─── 4) Kaporta self-access RLS (lawyer deseninin birebir kopyası) ───
DROP POLICY IF EXISTS kaporta_self ON public.bodyshops;
CREATE POLICY kaporta_self ON public.bodyshops FOR SELECT
  USING (id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'kaporta'));

DROP POLICY IF EXISTS kaporta_assignments_own ON public.bodyshop_assignments;
CREATE POLICY kaporta_assignments_own ON public.bodyshop_assignments FOR SELECT
  USING (bodyshop_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'kaporta'));

DROP POLICY IF EXISTS kaporta_customers_assigned ON public.customers;
CREATE POLICY kaporta_customers_assigned ON public.customers FOR SELECT
  USING (id IN (
    SELECT customer_id FROM public.bodyshop_assignments
    WHERE bodyshop_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'kaporta')
  ));

DROP POLICY IF EXISTS kaporta_vehicles_assigned ON public.vehicles;
CREATE POLICY kaporta_vehicles_assigned ON public.vehicles FOR SELECT
  USING (owner_id IN (
    SELECT customer_id FROM public.bodyshop_assignments
    WHERE bodyshop_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'kaporta')
  ));

DROP POLICY IF EXISTS kaporta_appraisals_assigned ON public.appraisals;
CREATE POLICY kaporta_appraisals_assigned ON public.appraisals FOR SELECT
  USING (vehicle_id IN (
    SELECT v.id FROM public.vehicles v
    JOIN public.bodyshop_assignments ba ON ba.customer_id = v.owner_id
    WHERE ba.bodyshop_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'kaporta')
  ));

-- ─── 4b) Avukat (lawyer) tam self-access (eksik politikalar tamamlanır) ─
-- Not: lawyer_assignments için self-SELECT yoksa "atanmış müşteri" alt
-- sorgusu RLS altında boş döner; avukat panelinde müşteri görünmez.
DROP POLICY IF EXISTS lawyer_assignments_own ON public.lawyer_assignments;
CREATE POLICY lawyer_assignments_own ON public.lawyer_assignments FOR SELECT
  USING (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

DROP POLICY IF EXISTS lawyer_customers_assigned ON public.customers;
CREATE POLICY lawyer_customers_assigned ON public.customers FOR SELECT
  USING (id IN (
    SELECT customer_id FROM public.lawyer_assignments
    WHERE lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer')
  ));

DROP POLICY IF EXISTS lawyer_vehicles_assigned ON public.vehicles;
CREATE POLICY lawyer_vehicles_assigned ON public.vehicles FOR SELECT
  USING (owner_id IN (
    SELECT customer_id FROM public.lawyer_assignments
    WHERE lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer')
  ));

DROP POLICY IF EXISTS lawyer_appraisals_assigned ON public.appraisals;
CREATE POLICY lawyer_appraisals_assigned ON public.appraisals FOR SELECT
  USING (vehicle_id IN (
    SELECT v.id FROM public.vehicles v
    JOIN public.lawyer_assignments la ON la.customer_id = v.owner_id
    WHERE la.lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer')
  ));

-- ─── 4c) Sigorta (insurance) tam self-access ────────────────────────
DROP POLICY IF EXISTS insurance_assignments_own ON public.insurance_assignments;
CREATE POLICY insurance_assignments_own ON public.insurance_assignments FOR SELECT
  USING (insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance'));

DROP POLICY IF EXISTS insurance_customers_assigned ON public.customers;
CREATE POLICY insurance_customers_assigned ON public.customers FOR SELECT
  USING (id IN (
    SELECT customer_id FROM public.insurance_assignments
    WHERE insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance')
  ));

DROP POLICY IF EXISTS insurance_vehicles_assigned ON public.vehicles;
CREATE POLICY insurance_vehicles_assigned ON public.vehicles FOR SELECT
  USING (owner_id IN (
    SELECT customer_id FROM public.insurance_assignments
    WHERE insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance')
  ));

DROP POLICY IF EXISTS insurance_appraisals_assigned ON public.appraisals;
CREATE POLICY insurance_appraisals_assigned ON public.appraisals FOR SELECT
  USING (vehicle_id IN (
    SELECT v.id FROM public.vehicles v
    JOIN public.insurance_assignments ia ON ia.customer_id = v.owner_id
    WHERE ia.insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance')
  ));

COMMIT;

-- ─── 5) PostgREST şema cache'ini yenile (yeni tablolar görünsün) ─────
NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- DOĞRULAMA:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='user_profiles_role_check';
--   SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE 'kaporta%';
--   SELECT * FROM public.bodyshops;
-- =====================================================================
