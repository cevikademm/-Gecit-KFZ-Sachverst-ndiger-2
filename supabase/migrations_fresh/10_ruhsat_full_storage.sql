-- ─────────────────────────────────────────────────────────────────────────
-- 10_ruhsat_full_storage.sql
-- Vehicles tablosunu Alman Zulassungsbescheinigung Teil I (Fahrzeugschein)
-- + Teil II (Fahrzeugbrief) verilerinin TAMAMINI tutacak sekilde genislet.
--
-- Strateji:
--  • ruhsat_data JSONB → ham OCR ciktisi (47 alanin hepsi key→value).
--  • En sik sorgulanan alanlar ayri kolonlar olarak da indekslenebilir kalir.
--  • Customers tarafinda da ilgili adres parcalari (street/zip/city) zaten var.
-- ─────────────────────────────────────────────────────────────────────────

-- ── VEHICLES — yeni ruhsat alanlari ──
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS ruhsat_data            JSONB,                  -- ham OCR ciktisi
  ADD COLUMN IF NOT EXISTS ruhsat_doc_id          UUID,                   -- customer_documents.id (fk yumuşak)
  ADD COLUMN IF NOT EXISTS ruhsat_uploaded_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ruhsat_ocr_confidence  NUMERIC(4,3),

  -- Belge bilgileri
  ADD COLUMN IF NOT EXISTS document_number        TEXT,                   -- DRUCK
  ADD COLUMN IF NOT EXISTS document_issue_date    DATE,                   -- AUSST
  ADD COLUMN IF NOT EXISTS issuing_authority      TEXT,                   -- BEH
  ADD COLUMN IF NOT EXISTS behoerden_schluessel   TEXT,                   -- 0.1
  ADD COLUMN IF NOT EXISTS verfahrenskennung      TEXT,                   -- 0.2

  -- Sahip alanlari (ruhsattan parse) — customers'a bağlanacaksa orada da var
  ADD COLUMN IF NOT EXISTS halter_anschrift       TEXT,                   -- C.1.3 ham metin

  -- Araç kimlik
  ADD COLUMN IF NOT EXISTS vin                    TEXT,                   -- 5 / FIN — chassis ile aynı
  ADD COLUMN IF NOT EXISTS typ_variante_version   TEXT,                   -- D.2
  ADD COLUMN IF NOT EXISTS handelsbezeichnung     TEXT,                   -- D.3
  ADD COLUMN IF NOT EXISTS eu_type_approval       TEXT,                   -- K

  -- Sınıflandırma
  ADD COLUMN IF NOT EXISTS vehicle_class          TEXT,                   -- 1 (M1, N1, vs.)
  ADD COLUMN IF NOT EXISTS body_type_code         TEXT,                   -- 2 (01, 02, vs.)
  ADD COLUMN IF NOT EXISTS usage_type             TEXT,                   -- 4
  ADD COLUMN IF NOT EXISTS fahrzeugart            TEXT,                   -- J

  -- Motor & yakıt
  ADD COLUMN IF NOT EXISTS displacement_cm3       INT,                    -- P.1
  ADD COLUMN IF NOT EXISTS performance_ps         INT,                    -- P.2 → kW * 1.36
  ADD COLUMN IF NOT EXISTS fuel_type              TEXT,                   -- P.3
  ADD COLUMN IF NOT EXISTS engine_number          TEXT,                   -- P.5
  ADD COLUMN IF NOT EXISTS power_mass_ratio       NUMERIC(6,3),           -- Q
  ADD COLUMN IF NOT EXISTS co2_emission_g_km      INT,                    -- V.7
  ADD COLUMN IF NOT EXISTS emission_class         TEXT,                   -- V.9 (EURO 6 vs.)
  ADD COLUMN IF NOT EXISTS emission_type_approval TEXT,                   -- 14

  -- Ağırlık & boyut
  ADD COLUMN IF NOT EXISTS weight_total_kg        INT,                    -- F.1 / F.2
  ADD COLUMN IF NOT EXISTS weight_empty_kg        INT,                    -- G
  ADD COLUMN IF NOT EXISTS axle_count             SMALLINT,               -- L
  ADD COLUMN IF NOT EXISTS trailer_braked_kg      INT,                    -- O.1
  ADD COLUMN IF NOT EXISTS trailer_unbraked_kg    INT,                    -- O.2
  ADD COLUMN IF NOT EXISTS length_mm              INT,                    -- 18
  ADD COLUMN IF NOT EXISTS width_mm               INT,                    -- 19
  ADD COLUMN IF NOT EXISTS height_mm              INT,                    -- 20
  ADD COLUMN IF NOT EXISTS trailer_load_kg        INT,                    -- 22

  -- Donanım & performans
  ADD COLUMN IF NOT EXISTS seats_count            SMALLINT,               -- S.1
  ADD COLUMN IF NOT EXISTS standing_count         SMALLINT,               -- S.2
  ADD COLUMN IF NOT EXISTS max_speed_kmh          INT,                    -- T
  ADD COLUMN IF NOT EXISTS noise_standstill_db    NUMERIC(5,1),           -- U.1
  ADD COLUMN IF NOT EXISTS noise_standstill_rpm   INT,                    -- U.2
  ADD COLUMN IF NOT EXISTS noise_driving_db       NUMERIC(5,1),           -- U.3
  ADD COLUMN IF NOT EXISTS tire_size              TEXT,                   -- 15
  ADD COLUMN IF NOT EXISTS tire_size_drive_axle   TEXT;                   -- 15.1

-- VIN'in benzersiz olmasini bekleriz (boş olursa null çoklu kayıt sorun değil)
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vin_unique
  ON public.vehicles (vin)
  WHERE vin IS NOT NULL AND vin <> '';

-- Plaka için normal (non-unique) index — fleet/AutoiXpert mirror içinde
-- aynı plakanın birden fazla kaydı olabilir.
CREATE INDEX IF NOT EXISTS vehicles_plate_idx
  ON public.vehicles (UPPER(REPLACE(plate, ' ', '')));

-- JSONB üzerinde hızlı sorgu için GIN index
CREATE INDEX IF NOT EXISTS vehicles_ruhsat_data_gin
  ON public.vehicles USING gin (ruhsat_data);

-- KNOWN_COLUMNS (frontend) eklenmesi gereken alanlari görmek icin sorgu
COMMENT ON COLUMN public.vehicles.ruhsat_data IS
  'Alman Fahrzeugschein/Fahrzeugbrief OCR ham ciktisi (47 alan). Anahtarlar EU kodlari: A, B, C.1.1, ..., 22, AUSST, BEH';

-- ── Doğrulama ──
SELECT
  COUNT(*) FILTER (WHERE column_name = 'ruhsat_data')           AS has_ruhsat_data,
  COUNT(*) FILTER (WHERE column_name = 'vin')                   AS has_vin,
  COUNT(*) FILTER (WHERE column_name = 'displacement_cm3')      AS has_displacement,
  COUNT(*) FILTER (WHERE column_name = 'performance_ps')        AS has_ps,
  COUNT(*) AS total_new_cols
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vehicles'
  AND column_name IN (
    'ruhsat_data','ruhsat_doc_id','ruhsat_uploaded_at','ruhsat_ocr_confidence',
    'document_number','document_issue_date','issuing_authority','behoerden_schluessel','verfahrenskennung',
    'halter_anschrift',
    'vin','typ_variante_version','handelsbezeichnung','eu_type_approval',
    'vehicle_class','body_type_code','usage_type','fahrzeugart',
    'displacement_cm3','performance_ps','fuel_type','engine_number','power_mass_ratio',
    'co2_emission_g_km','emission_class','emission_type_approval',
    'weight_total_kg','weight_empty_kg','axle_count','trailer_braked_kg','trailer_unbraked_kg',
    'length_mm','width_mm','height_mm','trailer_load_kg',
    'seats_count','standing_count','max_speed_kmh','noise_standstill_db','noise_standstill_rpm','noise_driving_db',
    'tire_size','tire_size_drive_axle'
  );
