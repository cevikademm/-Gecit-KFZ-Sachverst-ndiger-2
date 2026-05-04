-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION DEBUG HELPERS
-- Sorun: scripts/autoixpert/migration-debug.js modülü information_schema'ya
--        REST üzerinden erişemiyor; bunun için bir RPC fonksiyonu gerekiyor.
-- Etki:  public.debug_table_schema(text) fonksiyonu — sadece public şemadaki
--        kolon meta verisini döndürür. SECURITY DEFINER + sabit search_path.
-- Geri alma: DROP FUNCTION public.debug_table_schema(text);
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.debug_table_schema(p_table text)
RETURNS TABLE (
  column_name      text,
  data_type        text,
  is_nullable      text,
  column_default   text,
  ordinal_position integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table
  ORDER BY c.ordinal_position;
$$;

REVOKE ALL ON FUNCTION public.debug_table_schema(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_table_schema(text) TO authenticated, service_role;

-- Doğrulama:
-- SELECT * FROM public.debug_table_schema('autoixpert_reports');

-- ═══════════════════════════════════════════════════════════════════════════
-- ATOMIC JUNCTION REBUILD
-- Sorun: scripts/autoixpert/upsert.js içindeki invoice→reports junction
--        rebuild'i iki ayrı network çağrısıyla (DELETE + INSERT) yapılıyor.
--        Aralarda hata olursa junction yarım kalıyor.
-- Etki:  public.rebuild_junction_atomic(...) — tek transaction içinde
--        verilen invoice_id seti için eski linkleri silip yenilerini yazar.
-- Geri alma: DROP FUNCTION public.rebuild_junction_atomic(uuid[], jsonb);
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rebuild_junction_atomic(
  p_invoice_ids uuid[],
  p_links       jsonb            -- [{"invoice_id":"...","report_id":"..."}, ...]
)
RETURNS TABLE (deleted bigint, inserted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted  bigint := 0;
  v_inserted bigint := 0;
BEGIN
  IF p_invoice_ids IS NULL OR array_length(p_invoice_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  -- 1) Eski linkleri sil
  WITH d AS (
    DELETE FROM public.autoixpert_invoice_reports
    WHERE invoice_id = ANY (p_invoice_ids)
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM d;

  -- 2) Yenilerini yaz (boşsa atla)
  IF p_links IS NOT NULL AND jsonb_typeof(p_links) = 'array' AND jsonb_array_length(p_links) > 0 THEN
    WITH ins AS (
      INSERT INTO public.autoixpert_invoice_reports (invoice_id, report_id)
      SELECT
        (elem->>'invoice_id')::uuid,
        (elem->>'report_id')::uuid
      FROM jsonb_array_elements(p_links) AS elem
      ON CONFLICT DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_inserted FROM ins;
  END IF;

  RETURN QUERY SELECT v_deleted, v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_junction_atomic(uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebuild_junction_atomic(uuid[], jsonb) TO service_role;

-- Doğrulama:
-- SELECT * FROM public.rebuild_junction_atomic(
--   ARRAY['00000000-0000-0000-0000-000000000000']::uuid[],
--   '[]'::jsonb
-- );

COMMIT;
