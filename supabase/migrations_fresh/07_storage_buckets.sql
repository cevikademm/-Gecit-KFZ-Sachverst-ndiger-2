-- =====================================================================
-- 07 — STORAGE BUCKETS + STORAGE RLS
-- =====================================================================
-- Amaç: Supabase Storage bucket'larını ve dosya erişim policy'lerini kurar.
-- Sıra: 7/8
-- Idempotent: Evet (ON CONFLICT DO UPDATE)
-- Bağımlılık: 02 (customers), 03 (lawyer_assignments), 05 (is_admin)
-- Frontend bağlantı: src/App.jsx → DOC_BUCKET='documents', PHOTO_BUCKET='photos'
-- =====================================================================

-- ─── 7.1 Realtime publication (kritik tablolar için) ─────────────────
-- Realtime'ı 09 yerine burada hallediyoruz — bağımsız çalışır.
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'customers', 'vehicles', 'appraisals', 'invoices', 'appointments',
    'customer_documents', 'customer_notes', 'vehicle_notes', 'paint_maps',
    'lawyers', 'lawyer_assignments', 'lawyer_tasks', 'lawyer_cases', 'court_dates',
    'insurers', 'insurance_assignments', 'insurance_claims', 'insurance_offers',
    'damage_photos', 'damage_timeline',
    'messages', 'notifications', 'activity_logs', 'satisfaction_surveys',
    'objection_templates', 'file_flows', 'whatsapp_templates',
    'gallery', 'reminders', 'live_feed', 'accounting_entries'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename=tbl)
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ─── 7.2 Storage bucket'ları (idempotent UPSERT) ─────────────────────
-- documents : private — KFZ-Schein, fatura, hukuki belge (signed URL)
-- photos    : public  — hasar/araç fotoğrafları (public URL)
-- gallery   : public  — galeri görselleri
-- avatars   : public  — profil resimleri

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', FALSE, 52428800,  -- 50 MB
    ARRAY['application/pdf','image/jpeg','image/png','image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('photos',    'photos',    TRUE,  10485760,  -- 10 MB
    ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']),
  ('gallery',   'gallery',   TRUE,  10485760,
    ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']),
  ('avatars',   'avatars',   TRUE,  2097152,   -- 2 MB
    ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 7.3 Storage RLS politikaları ────────────────────────────────────
-- Storage objects tablosunda RLS varsayılan olarak aktif.

-- Eski politikaları temizle (idempotent)
DROP POLICY IF EXISTS storage_admin_all          ON storage.objects;
DROP POLICY IF EXISTS storage_public_read        ON storage.objects;
DROP POLICY IF EXISTS storage_documents_self     ON storage.objects;
DROP POLICY IF EXISTS storage_authenticated_upload ON storage.objects;
DROP POLICY IF EXISTS storage_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS storage_authenticated_delete ON storage.objects;

-- Admin → tüm bucket'larda tam yetki
CREATE POLICY storage_admin_all ON storage.objects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Herkes (anon + auth) → public bucket'ları okuyabilir
CREATE POLICY storage_public_read ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('photos', 'gallery', 'avatars'));

-- Authenticated user → kendi documents dosyasını okuyabilir
-- Path konvansiyonu: {customer_id}/{timestamp}_{filename}
CREATE POLICY storage_documents_self ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.customers c
        JOIN public.user_profiles up ON up.email = c.email
        WHERE up.id = auth.uid() AND up.role = 'customer'
          AND split_part(name, '/', 1) = c.id
      )
      OR EXISTS (
        SELECT 1 FROM public.lawyer_assignments la
        JOIN public.user_profiles up ON up.linked_id = la.lawyer_id
        WHERE up.id = auth.uid() AND up.role = 'lawyer'
          AND split_part(name, '/', 1) = la.customer_id
      )
    )
  );

-- Authenticated user → tüm 4 bucket'a yükleyebilir
CREATE POLICY storage_authenticated_upload ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('documents', 'photos', 'gallery', 'avatars')
  );

-- Authenticated user → kendi yüklediği dosyayı güncelleyebilir
CREATE POLICY storage_authenticated_update ON storage.objects FOR UPDATE
  TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

-- Authenticated user → kendi yüklediği dosyayı silebilir
CREATE POLICY storage_authenticated_delete ON storage.objects FOR DELETE
  TO authenticated
  USING (owner = auth.uid() OR public.is_admin());

-- ─── Doğrulama ───────────────────────────────────────────────────────
-- 1) Bucket listesi (4 satır beklenir):
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('documents', 'photos', 'gallery', 'avatars')
ORDER BY id;

-- 2) Storage policy'leri:
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
ORDER BY polname;
-- Beklenen: storage_admin_all, storage_public_read, storage_documents_self,
--           storage_authenticated_upload, storage_authenticated_update,
--           storage_authenticated_delete (= 6)

-- 3) Realtime publication:
SELECT COUNT(*) AS realtime_table_sayisi
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public';
-- Beklenen: 30+
