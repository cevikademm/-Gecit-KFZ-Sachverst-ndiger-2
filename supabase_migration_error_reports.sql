-- ═══════════════════════════════════════════════════════════════════════
-- Hata Bildirimi Modülü — error_reports tablosu + Storage bucket
-- ───────────────────────────────────────────────────────────────────────
-- Amaç: Admin sistemi kontrol ederken bir hata aldığında, ekran görüntüsü +
-- açıklama ile bunu kayıt altına alır ve WhatsApp ile destek hattına iletir.
-- Ekran görüntüsü Storage'a (error-screenshots, public) yüklenir; satırda
-- sadece path + public URL tutulur. Yükleme başarısızsa base64 fallback
-- (screenshot_data) kullanılır.
--
-- ÇALIŞTIRMA: Supabase Dashboard → SQL Editor → yapıştır → RUN
-- GÜVENLİ: idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) — tekrar çalışır.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Tablo ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_reports (
  id              TEXT PRIMARY KEY,
  reporter_name   TEXT,
  reporter_email  TEXT,
  reporter_role   TEXT,
  description     TEXT NOT NULL,
  page_url        TEXT,
  page_path       TEXT,
  user_agent      TEXT,
  screen_size     TEXT,
  app_version     TEXT,
  severity        TEXT DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high')),
  status          TEXT DEFAULT 'new'    CHECK (status IN ('new', 'in_progress', 'resolved')),
  screenshot_path TEXT,
  screenshot_url  TEXT,
  screenshot_data TEXT,   -- base64 fallback (yalnızca yükleme başarısız / local mod)
  console_errors  TEXT,   -- yakalanmış son konsol hataları (opsiyonel)
  created_at      TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS error_reports_created_idx ON public.error_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS error_reports_status_idx  ON public.error_reports (status);

-- ─── 2. RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Admin (super_admin/admin) → tam erişim. is_admin() helper supabase_schema.sql'de tanımlı.
DROP POLICY IF EXISTS error_reports_admin_all ON public.error_reports;
CREATE POLICY error_reports_admin_all ON public.error_reports FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Authenticated kullanıcı yeni bildirim ekleyebilir (modül yalnızca admin'e
-- görünür ama insert'i auth seviyesinde de serbest bırakıyoruz — esneklik için).
DROP POLICY IF EXISTS error_reports_auth_insert ON public.error_reports;
CREATE POLICY error_reports_auth_insert ON public.error_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── 3. Realtime ───────────────────────────────────────────────────────
-- Yeni bildirimler admin panelinde anında görünsün.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'error_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.error_reports;
  END IF;
END $$;

-- ─── 4. Storage bucket (error-screenshots, public) ─────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('error-screenshots', 'error-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Herkes okuyabilir (public bucket — WhatsApp mesajındaki link açılabilsin)
DROP POLICY IF EXISTS error_screenshots_public_read ON storage.objects;
CREATE POLICY error_screenshots_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'error-screenshots');

-- Authenticated kullanıcı yükleyebilir
DROP POLICY IF EXISTS error_screenshots_auth_upload ON storage.objects;
CREATE POLICY error_screenshots_auth_upload ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'error-screenshots');

-- Admin silebilir / güncelleyebilir
DROP POLICY IF EXISTS error_screenshots_admin_manage ON storage.objects;
CREATE POLICY error_screenshots_admin_manage ON storage.objects FOR ALL
  USING (bucket_id = 'error-screenshots' AND is_admin())
  WITH CHECK (bucket_id = 'error-screenshots' AND is_admin());

-- PostgREST şema cache'ini tazele
NOTIFY pgrst, 'reload schema';

-- ─── Doğrulama ─────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name='error_reports';
-- SELECT id, public FROM storage.buckets WHERE id='error-screenshots';
