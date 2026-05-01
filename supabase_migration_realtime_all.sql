-- ═══════════════════════════════════════════════════════════════════════
-- Realtime Publication — TÜM Tablolar
-- ═══════════════════════════════════════════════════════════════════════
-- Mevcut migration sadece 7 tabloda realtime'ı aktif etmişti
-- (messages, notifications, insurance_claims, insurance_offers,
--  appraisals, appointments, activity_logs).
--
-- Bu migration TÜM tablolar için realtime'ı aktive eder. Böylece bir
-- client'ta yapılan değişiklik diğer client'lara anında yansır.
--
-- Kullanım:
--   Supabase Dashboard > SQL Editor > yapıştır > Run
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: bir tabloyu güvenli şekilde realtime'a ekle (zaten varsa hata vermez)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'customers',
    'vehicles',
    'appraisals',
    'invoices',
    'appointments',
    'customer_documents',
    'customer_notes',
    'vehicle_notes',
    'lawyers',
    'lawyer_assignments',
    'lawyer_tasks',
    'lawyer_cases',
    'court_dates',
    'messages',
    'notifications',
    'activity_logs',
    'satisfaction_surveys',
    'insurers',
    'insurance_claims',
    'insurance_offers',
    'damage_photos',
    'damage_timeline',
    'objection_templates',
    'file_flows',
    'whatsapp_templates',
    'gallery',
    'reminders'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Tablo varsa ve publication'a henüz dahil değilse ekle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl)
       AND NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname='supabase_realtime' AND tablename=tbl
       )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      RAISE NOTICE '✓ % realtime aktif edildi', tbl;
    ELSE
      RAISE NOTICE '○ % zaten aktif veya tablo yok', tbl;
    END IF;
  END LOOP;
END $$;

-- Doğrulama: hangi tablolar realtime'da
SELECT tablename FROM pg_publication_tables
WHERE pubname='supabase_realtime'
ORDER BY tablename;
