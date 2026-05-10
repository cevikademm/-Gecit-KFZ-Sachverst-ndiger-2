-- customers tablosuna AutoiXpert mirror için ek kolonlar.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS autoixpert_contact_id TEXT REFERENCES autoixpert_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'autoixpert', 'imported')),
  ADD COLUMN IF NOT EXISTS tc TEXT,
  ADD COLUMN IF NOT EXISTS birthdate DATE,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS phone2 TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_axcontact ON customers(autoixpert_contact_id);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers(LOWER(email));

-- Email NULL olabilsin (AutoiXpert claimant'larında hep yok)
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Email UNIQUE constraint'i partial yap (NULL email'lere izin ver)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique
  ON customers(LOWER(email)) WHERE email IS NOT NULL;

-- vehicles: license_plate AutoiXpert'tan farklı format gelebilir, ek alanlar
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS autoixpert_report_id TEXT,
  ADD COLUMN IF NOT EXISTS first_registration_date DATE,
  ADD COLUMN IF NOT EXISTS performance_kw INTEGER,
  ADD COLUMN IF NOT EXISTS shape TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicles_axreport ON vehicles(autoixpert_report_id);

-- appraisals: AutoiXpert rapor bağı
ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS autoixpert_report_id TEXT,
  ADD COLUMN IF NOT EXISTS report_token TEXT,
  ADD COLUMN IF NOT EXISTS report_type TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_appraisals_axreport ON appraisals(autoixpert_report_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_token ON appraisals(report_token) WHERE report_token IS NOT NULL;

NOTIFY pgrst, 'reload schema';
