-- ════════════════════════════════════════════════════════════════
-- AutoiXpert Photos — Supabase schema + Storage bucket
-- ════════════════════════════════════════════════════════════════
-- Bu migration Supabase SQL Editor'da bir kez çalıştırılır.
-- Çalıştırma: supabase_schema.sql sonrası, scripts/autoixpert/download-photos.js öncesi.
--
-- Yarattıkları:
--   1. autoixpert_photos tablosu (foto metadata + Storage path)
--   2. RLS policies (admin all, service_role all)
--   3. autoixpert-photos Storage bucket (private)
--   4. Storage policies (admin SELECT)

-- ─── 1. Tablo ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_photos (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES autoixpert_reports(id) ON DELETE CASCADE,

  -- Storage referansı
  storage_bucket text NOT NULL DEFAULT 'autoixpert-photos',
  storage_path text,
  variant text NOT NULL DEFAULT 'original',

  -- Foto özellikleri
  title text,
  original_name text,
  description text,
  mimetype text,
  size_bytes bigint,
  width integer,
  height integer,

  -- AutoiXpert bayrakları
  included_in_report boolean DEFAULT false,
  included_in_expert_statement boolean DEFAULT false,
  included_in_repair_confirmation boolean DEFAULT false,
  included_in_residual_value_exchange boolean DEFAULT false,
  lease_return_item_id text,

  -- İndirme durumu
  download_status text NOT NULL DEFAULT 'pending'
    CHECK (download_status IN ('pending', 'downloading', 'done', 'failed', 'skipped')),
  download_error text,
  download_attempts integer NOT NULL DEFAULT 0,
  downloaded_at timestamptz,

  -- Sync metadata
  external_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb
);

CREATE INDEX IF NOT EXISTS idx_axphotos_report ON autoixpert_photos(report_id);
CREATE INDEX IF NOT EXISTS idx_axphotos_status ON autoixpert_photos(download_status);
CREATE INDEX IF NOT EXISTS idx_axphotos_synced_at ON autoixpert_photos(synced_at DESC);

-- ─── 2. RLS ────────────────────────────────────────────────────
ALTER TABLE autoixpert_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS autoixpert_photos_admin_all ON autoixpert_photos;
CREATE POLICY autoixpert_photos_admin_all ON autoixpert_photos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── 3. Storage bucket (private) ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'autoixpert-photos',
  'autoixpert-photos',
  false,
  52428800,  -- 50 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 4. Storage policies — admin only ──────────────────────────
DROP POLICY IF EXISTS axphotos_admin_select ON storage.objects;
CREATE POLICY axphotos_admin_select ON storage.objects
  FOR SELECT USING (bucket_id = 'autoixpert-photos' AND is_admin());

DROP POLICY IF EXISTS axphotos_admin_insert ON storage.objects;
CREATE POLICY axphotos_admin_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'autoixpert-photos' AND is_admin());

DROP POLICY IF EXISTS axphotos_admin_update ON storage.objects;
CREATE POLICY axphotos_admin_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'autoixpert-photos' AND is_admin())
  WITH CHECK (bucket_id = 'autoixpert-photos' AND is_admin());

DROP POLICY IF EXISTS axphotos_admin_delete ON storage.objects;
CREATE POLICY axphotos_admin_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'autoixpert-photos' AND is_admin());

-- Service role her zaman bypass eder, ek policy gerekmez.
