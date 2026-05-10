-- ─────────────────────────────────────────────────────────────────────────
-- 11_termin_planlayici.sql
-- Termin Planlayici (Appointment Scheduler) — admin musaitligi, slot mantigi,
-- Google Calendar entegrasyonu. Musteriler kendi panelinden bos slot'lari gorur,
-- secip randevu olusturur. Tum randevular Google Calendar ile cift-yonlu sync.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1) appointments tablosunu genislet ──
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS duration_minutes    INT     DEFAULT 30,
  ADD COLUMN IF NOT EXISTS end_time            TEXT,                          -- 'HH:MM' — start + duration
  ADD COLUMN IF NOT EXISTS location            TEXT,                          -- atölye / saha / video
  ADD COLUMN IF NOT EXISTS location_type       TEXT    DEFAULT 'office'       -- office | onsite | video | phone
                                                CHECK (location_type IN ('office','onsite','video','phone')),
  ADD COLUMN IF NOT EXISTS google_event_id     TEXT,                          -- Google Calendar event id (sync)
  ADD COLUMN IF NOT EXISTS google_calendar_id  TEXT,                          -- hangi takvim
  ADD COLUMN IF NOT EXISTS google_meet_link    TEXT,                          -- otomatik üretilen
  ADD COLUMN IF NOT EXISTS attendee_email      TEXT,                          -- müşteri email (kayıttan)
  ADD COLUMN IF NOT EXISTS attendee_name       TEXT,
  ADD COLUMN IF NOT EXISTS attendee_phone      TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_id          TEXT    REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booked_by           TEXT    DEFAULT 'admin'        -- admin | customer | public
                                                CHECK (booked_by IN ('admin','customer','public')),
  ADD COLUMN IF NOT EXISTS booked_at           TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS color               TEXT;                          -- takvim rengi (#RRGGBB)

-- Status check'i genişlet (eğer 06_rls'te değil ise)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status = ANY (ARRAY['aktif','bekliyor','onaylandi','iptal','tamamlandi','no_show']));

CREATE INDEX IF NOT EXISTS appointments_date_time_idx ON public.appointments (date, time);
CREATE INDEX IF NOT EXISTS appointments_google_event_idx ON public.appointments (google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_customer_idx ON public.appointments (customer_id) WHERE customer_id IS NOT NULL;

-- ── 2) admin_availability — Admin'in haftalik calisma saatleri ──
-- Her admin için her gün için 0+ slot tanımı. Müşteri sadece bu slot'lar
-- içindeki BOŞ zamanları görür.
CREATE TABLE IF NOT EXISTS public.admin_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Pazar, 1=Pzt, ..., 6=Cmt
  start_time   TEXT NOT NULL,                                          -- 'HH:MM' (örn '09:00')
  end_time     TEXT NOT NULL,                                          -- 'HH:MM' (örn '12:30')
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  label        TEXT,                                                   -- 'Sabah', 'Öğleden sonra', vb.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_availability_admin_day_idx
  ON public.admin_availability (admin_id, day_of_week) WHERE is_active = TRUE;

COMMENT ON TABLE public.admin_availability IS
  'Admin haftalık çalışma saatleri. Pazar=0, Pazartesi=1, ..., Cumartesi=6';

-- ── 3) admin_availability_exception — özel günler (tatil, blok, ek mesai) ──
CREATE TABLE IF NOT EXISTS public.admin_availability_exception (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('blocked','extra_hours')),
  start_time   TEXT,                                                   -- extra_hours için zorunlu
  end_time     TEXT,
  reason       TEXT,                                                   -- "Tatil", "Eğitim", vb.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_exception_admin_date_idx
  ON public.admin_availability_exception (admin_id, date);

-- ── 4) admin_calendar_settings — Google Calendar bağlantısı + slot ayarları ──
CREATE TABLE IF NOT EXISTS public.admin_calendar_settings (
  admin_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Slot ayarları
  slot_duration_minutes INT NOT NULL DEFAULT 30 CHECK (slot_duration_minutes IN (15,20,30,45,60,90,120)),
  buffer_before_minutes INT NOT NULL DEFAULT 0,                       -- iki randevu arası tampon
  buffer_after_minutes  INT NOT NULL DEFAULT 0,
  min_notice_hours      INT NOT NULL DEFAULT 2,                       -- min X saat önceden booking
  max_notice_days       INT NOT NULL DEFAULT 60,                      -- max X gün ileriye booking
  timezone              TEXT NOT NULL DEFAULT 'Europe/Berlin',
  -- Lokasyon varsayılanları
  default_location      TEXT,                                          -- 'Atölye - Alsdorf'
  default_location_type TEXT DEFAULT 'office',
  -- Google Calendar OAuth
  google_calendar_id    TEXT,                                          -- primary | custom calendar id
  google_access_token   TEXT,                                          -- şifrelenmiş tutulmalı (Vault)
  google_refresh_token  TEXT,                                          -- şifrelenmiş tutulmalı
  google_token_expires_at TIMESTAMPTZ,
  google_sync_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  google_last_sync_at   TIMESTAMPTZ,
  -- Email/SMS bildirimleri
  notify_email_on_booking BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email_on_cancel  BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_hours_before INT[]  NOT NULL DEFAULT ARRAY[24, 2]::INT[],   -- 24 saat + 2 saat öncesi
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5) appointment_services — hangi hizmetler randevu alabilir + süreleri ──
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,                                          -- 'ekspertiz_standart', 'video_konsultasyon'
  label        TEXT NOT NULL,                                          -- 'Standart Ekspertiz'
  description  TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price_eur    NUMERIC(10,2),                                          -- gösterilir, ödeme alınmaz
  color        TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT TRUE,                          -- müşteri görür mü
  icon         TEXT,                                                   -- emoji veya icon adı
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id, slug)
);

-- ── 6) Trigger: updated_at ──
DROP TRIGGER IF EXISTS trg_admin_availability_updated_at ON public.admin_availability;
CREATE TRIGGER trg_admin_availability_updated_at
  BEFORE UPDATE ON public.admin_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_calendar_settings_updated_at ON public.admin_calendar_settings;
CREATE TRIGGER trg_admin_calendar_settings_updated_at
  BEFORE UPDATE ON public.admin_calendar_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7) RLS — admin kendi kayitlarini yonetir, herkes admin musaitligini gorebilir ──
ALTER TABLE public.admin_availability             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_availability_exception   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_calendar_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services           ENABLE ROW LEVEL SECURITY;

-- admin_availability: oku herkes (slot hesabı için), yaz sadece admin
DROP POLICY IF EXISTS adminavl_public_read ON public.admin_availability;
CREATE POLICY adminavl_public_read ON public.admin_availability
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS adminavl_admin_write ON public.admin_availability;
CREATE POLICY adminavl_admin_write ON public.admin_availability
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS adminexc_public_read ON public.admin_availability_exception;
CREATE POLICY adminexc_public_read ON public.admin_availability_exception
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS adminexc_admin_write ON public.admin_availability_exception;
CREATE POLICY adminexc_admin_write ON public.admin_availability_exception
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- admin_calendar_settings: oku admin (kendi token'ları), yaz admin
DROP POLICY IF EXISTS calset_admin_all ON public.admin_calendar_settings;
CREATE POLICY calset_admin_all ON public.admin_calendar_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- appointment_services: public_read (public_only filter ile UI tarafında),
-- yaz admin
DROP POLICY IF EXISTS aptserv_public_read ON public.appointment_services;
CREATE POLICY aptserv_public_read ON public.appointment_services
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS aptserv_admin_write ON public.appointment_services;
CREATE POLICY aptserv_admin_write ON public.appointment_services
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── 8) Yardımcı fonksiyon: müşterinin görebileceği boş slot'ları üret ──
-- get_available_slots(admin_id, start_date, end_date, duration_minutes)
-- Returns: setof (slot_date, slot_start, slot_end)
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_admin_id     UUID,
  p_start_date   DATE,
  p_end_date     DATE,
  p_duration_min INT DEFAULT NULL
)
RETURNS TABLE (
  slot_date   DATE,
  slot_start  TEXT,
  slot_end    TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settings        public.admin_calendar_settings%ROWTYPE;
  v_duration        INT;
  v_buffer_before   INT;
  v_buffer_after    INT;
  v_min_notice_hr   INT;
  v_current         DATE := p_start_date;
  v_dow             INT;
  v_avl             RECORD;
  v_exc             RECORD;
  v_slot_min        TIMESTAMP;
  v_slot_end        TIMESTAMP;
  v_taken           BOOLEAN;
  v_step_min        INT;
  v_now_threshold   TIMESTAMPTZ;
BEGIN
  -- Ayarları çek (yoksa varsayılan)
  SELECT * INTO v_settings FROM public.admin_calendar_settings WHERE admin_id = p_admin_id LIMIT 1;
  v_duration      := COALESCE(p_duration_min, v_settings.slot_duration_minutes, 30);
  v_buffer_before := COALESCE(v_settings.buffer_before_minutes, 0);
  v_buffer_after  := COALESCE(v_settings.buffer_after_minutes, 0);
  v_min_notice_hr := COALESCE(v_settings.min_notice_hours, 2);
  v_step_min      := v_duration;
  v_now_threshold := NOW() + (v_min_notice_hr || ' hours')::INTERVAL;

  WHILE v_current <= p_end_date LOOP
    v_dow := EXTRACT(DOW FROM v_current)::INT;

    -- Bu gün için BLOCKED exception varsa atla
    IF EXISTS (
      SELECT 1 FROM public.admin_availability_exception
       WHERE admin_id = p_admin_id AND date = v_current AND kind = 'blocked'
    ) THEN
      v_current := v_current + 1;
      CONTINUE;
    END IF;

    -- Bu gün için tüm aktif availability satırlarını gez
    FOR v_avl IN
      SELECT start_time, end_time
        FROM public.admin_availability
       WHERE admin_id = p_admin_id AND day_of_week = v_dow AND is_active = TRUE
      UNION ALL
      SELECT start_time, end_time
        FROM public.admin_availability_exception
       WHERE admin_id = p_admin_id AND date = v_current AND kind = 'extra_hours'
    LOOP
      v_slot_min := (v_current::TEXT || ' ' || v_avl.start_time)::TIMESTAMP;
      v_slot_end := (v_current::TEXT || ' ' || v_avl.end_time)::TIMESTAMP;

      WHILE v_slot_min + (v_duration || ' minutes')::INTERVAL <= v_slot_end LOOP
        -- min_notice kontrolü
        IF v_slot_min::TIMESTAMPTZ < v_now_threshold THEN
          v_slot_min := v_slot_min + (v_step_min || ' minutes')::INTERVAL;
          CONTINUE;
        END IF;

        -- Bu slot dolu mu kontrol et — appointments tablosuna bak (iptal hariç)
        v_taken := EXISTS (
          SELECT 1 FROM public.appointments a
           WHERE a.date = v_current
             AND a.status NOT IN ('iptal','no_show')
             AND tstzrange(
                   (a.date || ' ' || a.time)::TIMESTAMP - (v_buffer_before || ' minutes')::INTERVAL,
                   (a.date || ' ' || COALESCE(a.end_time, a.time))::TIMESTAMP
                     + (COALESCE(a.duration_minutes, v_duration) || ' minutes')::INTERVAL
                     + (v_buffer_after || ' minutes')::INTERVAL,
                   '[)'
                 ) && tstzrange(v_slot_min, v_slot_min + (v_duration || ' minutes')::INTERVAL, '[)')
        );

        IF NOT v_taken THEN
          slot_date  := v_current;
          slot_start := to_char(v_slot_min, 'HH24:MI');
          slot_end   := to_char(v_slot_min + (v_duration || ' minutes')::INTERVAL, 'HH24:MI');
          RETURN NEXT;
        END IF;

        v_slot_min := v_slot_min + (v_step_min || ' minutes')::INTERVAL;
      END LOOP;
    END LOOP;

    v_current := v_current + 1;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_available_slots IS
  'Belirtilen admin için tarih aralığındaki BOŞ randevu slot''larını döner. Çalışma saatleri + exceptions + mevcut randevular dikkate alınır.';

-- ── 9) Varsayilan calisma saatleri — kuruluştan sonra admin manuel düzenler ──
-- (Sadece şu anki admin için, varsa)
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.user_profiles
    WHERE role IN ('super_admin','admin') AND active = TRUE
    ORDER BY created_at LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    -- Pzt-Cuma 09:00-12:30 ve 13:30-18:00
    INSERT INTO public.admin_availability (admin_id, day_of_week, start_time, end_time, label)
    SELECT v_admin_id, d, s, e, l FROM (VALUES
      (1, '09:00', '12:30', 'Vormittag'), (1, '13:30', '18:00', 'Nachmittag'),
      (2, '09:00', '12:30', 'Vormittag'), (2, '13:30', '18:00', 'Nachmittag'),
      (3, '09:00', '12:30', 'Vormittag'), (3, '13:30', '18:00', 'Nachmittag'),
      (4, '09:00', '12:30', 'Vormittag'), (4, '13:30', '18:00', 'Nachmittag'),
      (5, '09:00', '12:30', 'Vormittag'), (5, '13:30', '17:00', 'Nachmittag')
    ) AS t(d, s, e, l)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.admin_availability WHERE admin_id = v_admin_id
    );

    -- Varsayılan settings
    INSERT INTO public.admin_calendar_settings (admin_id, slot_duration_minutes, timezone, default_location, default_location_type)
    VALUES (v_admin_id, 30, 'Europe/Berlin', 'Atölye - Alsdorf', 'office')
    ON CONFLICT (admin_id) DO NOTHING;

    -- Varsayılan hizmetler
    INSERT INTO public.appointment_services (admin_id, slug, label, description, duration_minutes, color, icon, sort_order, is_public)
    VALUES
      (v_admin_id, 'ekspertiz_standart', 'Standart Ekspertiz', 'Genel hasar tespiti — 30 dakika', 30, '#E30613', '🔧', 1, TRUE),
      (v_admin_id, 'ekspertiz_premium',  'Premium Ekspertiz',  'Detaylı analiz + PDF rapor — 60 dakika', 60, '#3B82F6', '⭐', 2, TRUE),
      (v_admin_id, 'video_konsultasyon', 'Video Konsültasyon', 'Online ön görüşme — 15 dakika', 15, '#10B981', '📹', 3, TRUE),
      (v_admin_id, 'onsite_filo',        'Saha / Filo Ziyareti', 'Müşteri adresinde tespit — 90 dakika', 90, '#F59E0B', '🚗', 4, TRUE)
    ON CONFLICT (admin_id, slug) DO NOTHING;

    RAISE NOTICE 'Admin termin ayarları oluşturuldu: %', v_admin_id;
  END IF;
END $$;

-- ── 10) Realtime publication ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'admin_availability'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.admin_availability,
      public.admin_availability_exception,
      public.admin_calendar_settings,
      public.appointment_services;
  END IF;
END $$;

-- ── Doğrulama ──
SELECT
  (SELECT COUNT(*) FROM public.admin_availability)        AS adminavl_satir,
  (SELECT COUNT(*) FROM public.admin_calendar_settings)   AS settings_satir,
  (SELECT COUNT(*) FROM public.appointment_services)      AS services_satir,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appointments'
      AND column_name IN ('duration_minutes','google_event_id','attendee_email','location_type'))
                                                          AS appointments_yeni_kolon;
