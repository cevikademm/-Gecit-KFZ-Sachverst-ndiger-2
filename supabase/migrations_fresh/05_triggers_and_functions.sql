-- =====================================================================
-- 05 — TRIGGERS & FUNCTIONS
-- =====================================================================
-- Amaç: updated_at trigger'ları, RLS yardımcı fonksiyonu (is_admin),
--       AutoiXpert helper fonksiyonları, view'ler, debug fonksiyonları,
--       ve auth.users → user_profiles otomatik bağlama trigger'ı.
-- Sıra: 5/8
-- Idempotent: Evet
-- Bağımlılık: 02, 03
-- KRİTİK: is_admin() **SECURITY DEFINER** olmalı — user_profiles'ın
--          RLS policy'si içinden çağrıldığı için recursion önlenir.
-- =====================================================================

BEGIN;

-- ─── 5.1 Genel updated_at trigger fonksiyonu ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'BEFORE UPDATE trigger — updated_at''i NOW() ile günceller.';

-- updated_at kolonu olan tüm tablolar için trigger kur
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'user_profiles', 'customers', 'appraisals', 'paint_maps',
    'lawyer_cases', 'insurance_claims'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── 5.2 is_admin() — RLS yardımcısı (SECURITY DEFINER zorunlu) ──────
-- ÖNEMLİ: SECURITY DEFINER + SET search_path = public, pg_temp
--   1. user_profiles tablosunun RLS'i is_admin() çağırınca RLS bypass'lansın.
--   2. search_path injection riski yok.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND active = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_admin() IS
  'RLS helper. SECURITY DEFINER: user_profiles RLS''ini bypass eder, recursion önlenir.';

-- ─── 5.3 auth.users → user_profiles otomatik bağlama ─────────────────
-- Yeni bir kullanıcı kayıt olduğunda user_profiles satırı yoksa otomatik oluştur.
-- Default rol: 'customer' (admin manuel olarak yükseltir).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    'customer',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'auth.users INSERT olduğunda user_profiles satırı oluşturur. raw_user_meta_data.full_name varsa kopyalanır.';

-- ─── 5.4 AutoiXpert sync_status view ─────────────────────────────────
CREATE OR REPLACE VIEW public.autoixpert_sync_status AS
  SELECT
    resource,
    MAX(started_at) FILTER (WHERE status = 'success') AS last_success_at,
    MAX(finished_at) FILTER (WHERE status = 'success' AND cursor_after IS NULL) AS last_complete_run_at,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failures
  FROM public.autoixpert_sync_log
  GROUP BY resource;

COMMENT ON VIEW public.autoixpert_sync_status IS
  'Resource bazlı son başarılı sync özeti. Incremental sync filtre değeri için.';

-- ─── 5.5 AutoiXpert helper fonksiyonları ─────────────────────────────
CREATE OR REPLACE FUNCTION public.autoixpert_last_sync_at(p_resource TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE AS $$
  SELECT last_complete_run_at
  FROM public.autoixpert_sync_status
  WHERE resource = p_resource;
$$;

CREATE OR REPLACE FUNCTION public.autoixpert_reports_for_customer(p_customer_id TEXT)
RETURNS SETOF public.autoixpert_reports
LANGUAGE sql STABLE AS $$
  SELECT r.* FROM public.autoixpert_reports r
  WHERE EXISTS (
    SELECT 1 FROM public.customer_autoixpert_links l
    JOIN public.autoixpert_contacts c ON c.id = l.autoixpert_contact_id
    WHERE l.customer_id = p_customer_id
      AND (
        r.claimant->>'email' = c.email
        OR r.author_of_damage->>'email' = c.email
        OR r.owner_of_claimants_car->>'email' = c.email
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.customers cu
    WHERE cu.id = p_customer_id
      AND cu.email IS NOT NULL
      AND (
        LOWER(r.claimant->>'email') = LOWER(cu.email)
        OR LOWER(r.author_of_damage->>'email') = LOWER(cu.email)
        OR LOWER(r.owner_of_claimants_car->>'email') = LOWER(cu.email)
      )
  )
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.autoixpert_invoices_for_customer(p_customer_id TEXT)
RETURNS SETOF public.autoixpert_invoices
LANGUAGE sql STABLE AS $$
  SELECT i.* FROM public.autoixpert_invoices i
  WHERE EXISTS (
    SELECT 1 FROM public.customers cu
    WHERE cu.id = p_customer_id
      AND cu.email IS NOT NULL
      AND LOWER(i.recipient->>'email') = LOWER(cu.email)
  )
  OR EXISTS (
    SELECT 1 FROM public.customer_autoixpert_links l
    JOIN public.autoixpert_contacts c ON c.id = l.autoixpert_contact_id
    WHERE l.customer_id = p_customer_id
      AND i.recipient->>'email' = c.email
  )
  ORDER BY i.date DESC, i.created_at DESC;
$$;

-- ─── 5.6 Match istatistik view ───────────────────────────────────────
CREATE OR REPLACE VIEW public.customer_autoixpert_match_stats AS
SELECT
  c.id AS customer_id,
  c.email,
  c.full_name,
  c.company,
  COUNT(DISTINCT l.autoixpert_contact_id) FILTER (WHERE l.is_confirmed)     AS confirmed_links,
  COUNT(DISTINCT l.autoixpert_contact_id) FILTER (WHERE NOT l.is_confirmed) AS pending_links,
  MAX(l.created_at) AS last_linked_at
FROM public.customers c
LEFT JOIN public.customer_autoixpert_links l ON l.customer_id = c.id
GROUP BY c.id, c.email, c.full_name, c.company;

-- ─── 5.7 Debug helper RPC ────────────────────────────────────────────
-- scripts/autoixpert/migration-debug.js modülü information_schema'ya
-- REST üzerinden erişemiyor; bu RPC fonksiyonu kolon meta verisi döndürür.
CREATE OR REPLACE FUNCTION public.debug_table_schema(p_table TEXT)
RETURNS TABLE (
  column_name      TEXT,
  data_type        TEXT,
  is_nullable      TEXT,
  column_default   TEXT,
  ordinal_position INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table
  ORDER BY c.ordinal_position;
$$;

REVOKE ALL ON FUNCTION public.debug_table_schema(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_table_schema(TEXT) TO authenticated, service_role;

-- ─── 5.8 Atomic junction rebuild RPC ─────────────────────────────────
-- AutoiXpert invoice→reports junction rebuild'i tek transaction içinde.
CREATE OR REPLACE FUNCTION public.rebuild_junction_atomic(
  p_invoice_ids TEXT[],
  p_links       JSONB
)
RETURNS TABLE (deleted BIGINT, inserted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted  BIGINT := 0;
  v_inserted BIGINT := 0;
BEGIN
  IF p_invoice_ids IS NULL OR array_length(p_invoice_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  WITH d AS (
    DELETE FROM public.autoixpert_invoice_reports
    WHERE invoice_id = ANY (p_invoice_ids)
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM d;

  IF p_links IS NOT NULL AND jsonb_typeof(p_links) = 'array' AND jsonb_array_length(p_links) > 0 THEN
    WITH ins AS (
      INSERT INTO public.autoixpert_invoice_reports (invoice_id, report_id)
      SELECT
        elem->>'invoice_id',
        elem->>'report_id'
      FROM jsonb_array_elements(p_links) AS elem
      ON CONFLICT DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_inserted FROM ins;
  END IF;

  RETURN QUERY SELECT v_deleted, v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_junction_atomic(TEXT[], JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebuild_junction_atomic(TEXT[], JSONB) TO service_role;

COMMIT;

-- ─── Doğrulama ───────────────────────────────────────────────────────
-- Beklenen: en az 6 fonksiyon
SELECT proname, prosecdef AS security_definer, provolatile
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'set_updated_at', 'is_admin', 'handle_new_user',
    'autoixpert_last_sync_at', 'autoixpert_reports_for_customer',
    'autoixpert_invoices_for_customer', 'debug_table_schema',
    'rebuild_junction_atomic'
  )
ORDER BY proname;
