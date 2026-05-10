-- =====================================================================
-- 03 — RELATIONS / SECONDARY TABLES
-- =====================================================================
-- Amaç: Çekirdek tablolara bağlı ikincil tablolar (notlar, belgeler,
--       avukat, sigorta, mesaj, bildirim, log, AutoiXpert mirror).
-- Sıra: 3/8
-- Idempotent: Evet
-- Bağımlılık: 02_core_tables.sql
-- =====================================================================

-- ─── 3.1 customer_documents — Müşteri belgeleri ──────────────────────
-- ÖNEMLİ: storage_bucket + public_url kolonları frontend (App.jsx)
--         StorageService.uploadCustomerDocument() içinde kullanılıyor.
--         Bunlar olmazsa "column does not exist" hatası alırsınız.
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id              TEXT        PRIMARY KEY DEFAULT 'cd' || substr(md5(random()::text), 1, 7),
  customer_id     TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id      TEXT        REFERENCES public.vehicles(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  type            TEXT        DEFAULT 'diger',
  category        TEXT,
  size            INTEGER,
  storage_path    TEXT,
  storage_bucket  TEXT,
  public_url      TEXT,
  data            TEXT,                 -- base64 fallback (eski kayıtlar)
  mime            TEXT,
  uploaded_at     TEXT,
  uploaded_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.customer_documents.data IS 'Base64 fallback — yeni kayıtlar için NULL, storage_path kullanın.';
COMMENT ON COLUMN public.customer_documents.storage_bucket IS 'Hangi bucket''ta? (documents | photos | gallery)';
COMMENT ON COLUMN public.customer_documents.public_url IS 'Public bucket''lar için cache''lenmiş URL — private için NULL kalır.';

-- ─── 3.2 customer_notes / vehicle_notes ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id           TEXT        PRIMARY KEY DEFAULT 'cn' || substr(md5(random()::text), 1, 7),
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  author       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_notes (
  id           TEXT        PRIMARY KEY DEFAULT 'vn' || substr(md5(random()::text), 1, 7),
  vehicle_id   TEXT        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  author       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.3 lawyers + ilişki tabloları ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lawyers (
  id           TEXT        PRIMARY KEY DEFAULT 'law' || substr(md5(random()::text), 1, 7),
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE NOT NULL,
  phone        TEXT,
  bar_number   TEXT,
  password     TEXT,                    -- TODO: Supabase Auth'a taşınacak
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lawyer_assignments (
  id           TEXT        PRIMARY KEY DEFAULT 'la' || substr(md5(random()::text), 1, 7),
  lawyer_id    TEXT        NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lawyer_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.lawyer_tasks (
  id           TEXT        PRIMARY KEY DEFAULT 'lt' || substr(md5(random()::text), 1, 7),
  lawyer_id    TEXT        NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  done         BOOLEAN     NOT NULL DEFAULT FALSE,
  due_date     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lawyer_cases (
  id           TEXT        PRIMARY KEY DEFAULT 'case' || substr(md5(random()::text), 1, 7),
  lawyer_id    TEXT        NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  customer_id  TEXT        REFERENCES public.customers(id) ON DELETE SET NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  status       TEXT        DEFAULT 'aktif'
                           CHECK (status IN ('aktif', 'beklemede', 'kazanildi', 'kaybedildi', 'kapali')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.court_dates (
  id           TEXT        PRIMARY KEY DEFAULT 'crt' || substr(md5(random()::text), 1, 7),
  lawyer_id    TEXT        NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  case_id      TEXT        REFERENCES public.lawyer_cases(id) ON DELETE SET NULL,
  title        TEXT        NOT NULL,
  date         TEXT        NOT NULL,
  time         TEXT,
  court        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.4 insurers + claims + offers + assignments ────────────────────
CREATE TABLE IF NOT EXISTS public.insurers (
  id           TEXT        PRIMARY KEY DEFAULT 'ins' || substr(md5(random()::text), 1, 7),
  company      TEXT        NOT NULL,
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE NOT NULL,
  phone        TEXT,
  password     TEXT,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_assignments (
  id           TEXT        PRIMARY KEY DEFAULT 'ia' || substr(md5(random()::text), 1, 7),
  insurer_id   TEXT        NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (insurer_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id                  TEXT        PRIMARY KEY DEFAULT 'ic' || substr(md5(random()::text), 1, 7),
  customer_id         TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id          TEXT        REFERENCES public.vehicles(id) ON DELETE SET NULL,
  insurer_id          TEXT        REFERENCES public.insurers(id) ON DELETE SET NULL,
  appraisal_id        TEXT        REFERENCES public.appraisals(id) ON DELETE SET NULL,
  status              TEXT        DEFAULT 'inceleniyor'
                                  CHECK (status IN ('inceleniyor', 'teklif_verildi', 'onaylandi', 'reddedildi', 'kapali')),
  claim_date          TEXT,
  damage_description  TEXT,
  claim_amount        NUMERIC(12,2) DEFAULT 0,
  offer_amount        NUMERIC(12,2),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_offers (
  id           TEXT        PRIMARY KEY DEFAULT 'io' || substr(md5(random()::text), 1, 7),
  claim_id     TEXT        NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  insurer_id   TEXT        NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL,
  description  TEXT,
  notes        TEXT,
  status       TEXT        DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.5 damage_photos + damage_timeline ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.damage_photos (
  id            TEXT        PRIMARY KEY DEFAULT 'dp' || substr(md5(random()::text), 1, 7),
  vehicle_id    TEXT        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type          TEXT        CHECK (type IN ('before', 'after', 'detail')),
  label         TEXT,
  part          TEXT,
  url           TEXT,
  storage_path  TEXT,
  storage_bucket TEXT,
  public_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.damage_timeline (
  id            TEXT        PRIMARY KEY DEFAULT 'dt' || substr(md5(random()::text), 1, 7),
  vehicle_id    TEXT        REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id   TEXT        REFERENCES public.customers(id) ON DELETE SET NULL,
  event         TEXT        NOT NULL,
  date          TEXT        NOT NULL,
  description   TEXT,
  actor         TEXT        CHECK (actor IN ('customer', 'admin', 'system', 'insurance', 'lawyer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.6 messages / notifications / activity_logs / surveys ──────────
CREATE TABLE IF NOT EXISTS public.messages (
  id                  TEXT        PRIMARY KEY DEFAULT 'msg' || substr(md5(random()::text), 1, 7),
  contact_id          TEXT        NOT NULL,
  contact_type        TEXT        NOT NULL CHECK (contact_type IN ('customer', 'lawyer', 'insurance')),
  sender              TEXT        NOT NULL,
  sender_name         TEXT,
  text                TEXT        NOT NULL,
  read_by_admin       BOOLEAN     NOT NULL DEFAULT FALSE,
  read_by_customer    BOOLEAN     NOT NULL DEFAULT FALSE,
  read_by_lawyer      BOOLEAN     NOT NULL DEFAULT FALSE,
  read_by_insurance   BOOLEAN     NOT NULL DEFAULT FALSE,
  claim_id            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          TEXT        PRIMARY KEY DEFAULT 'n' || substr(md5(random()::text), 1, 7),
  user_id     TEXT        NOT NULL,
  text        TEXT        NOT NULL,
  type        TEXT        DEFAULT 'info',
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          TEXT        PRIMARY KEY DEFAULT 'log' || substr(md5(random()::text), 1, 7),
  type        TEXT,
  user_id     TEXT,
  text        TEXT        NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id            TEXT        PRIMARY KEY DEFAULT 'srv' || substr(md5(random()::text), 1, 7),
  appraisal_id  TEXT        REFERENCES public.appraisals(id) ON DELETE SET NULL,
  customer_id   TEXT        REFERENCES public.customers(id) ON DELETE SET NULL,
  rating        INTEGER     CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.7 Şablonlar / akış / WhatsApp ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.objection_templates (
  id          TEXT        PRIMARY KEY DEFAULT 'ot' || substr(md5(random()::text), 1, 7),
  title       TEXT        NOT NULL,
  category    TEXT        CHECK (category IN ('red_itiraz', 'dusuk_teklif', 'tazminat', 'mahkeme')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.file_flows (
  id          TEXT        PRIMARY KEY DEFAULT 'ff' || substr(md5(random()::text), 1, 7),
  trigger     TEXT        NOT NULL,
  actions     TEXT[]      NOT NULL DEFAULT '{}',
  label       TEXT,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id          TEXT        PRIMARY KEY DEFAULT 'wt' || substr(md5(random()::text), 1, 7),
  name        TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  trigger     TEXT,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3.8 gallery / reminders / live_feed / accounting ────────────────
CREATE TABLE IF NOT EXISTS public.gallery (
  id              TEXT        PRIMARY KEY DEFAULT 'gal' || substr(md5(random()::text), 1, 7),
  vehicle_id      TEXT        REFERENCES public.vehicles(id) ON DELETE SET NULL,
  url             TEXT,
  storage_path    TEXT,
  storage_bucket  TEXT,
  public_url      TEXT,
  caption         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id          TEXT        PRIMARY KEY DEFAULT 'rem' || substr(md5(random()::text), 1, 7),
  text        TEXT        NOT NULL,
  due_date    TEXT,
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  status      TEXT        DEFAULT 'active',
  priority    TEXT        DEFAULT 'normal',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_feed (
  id          TEXT        PRIMARY KEY DEFAULT 'lf' || substr(md5(random()::text), 1, 7),
  type        TEXT,
  text        TEXT        NOT NULL,
  time        TEXT,
  date        TEXT,
  status      TEXT        DEFAULT 'bekliyor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id            TEXT        PRIMARY KEY DEFAULT 'acc' || substr(md5(random()::text), 1, 7),
  type          TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount        NUMERIC(12,2) NOT NULL,
  description   TEXT,
  category      TEXT,
  date          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3.9 AUTOIXPERT MIRROR TABLOLARI (read-only ayna — ADR-0001)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.autoixpert_reports (
  id                                     TEXT        PRIMARY KEY,
  external_id                            TEXT,
  type                                   TEXT        NOT NULL CHECK (type IN (
                                                       'liability', 'short_assessment', 'partial_kasko', 'full_kasko',
                                                       'valuation', 'oldtimer_valuation_small', 'lease_return',
                                                       'used_vehicle_check', 'invoice_audit'
                                                     )),
  state                                  TEXT        NOT NULL CHECK (state IN ('done', 'recorded', 'locked', 'deleted')),
  token                                  TEXT,
  completion_date                        DATE,
  order_date                             DATE,
  order_time                             TIMESTAMPTZ,
  created_at                             TIMESTAMPTZ NOT NULL,
  responsible_assessor_id                TEXT,
  location_id                            TEXT,
  use_factoring                          BOOLEAN,
  use_dekra_fees                         BOOLEAN,
  vin_was_checked                        BOOLEAN,
  source_of_technical_data               TEXT,
  test_drive_carried_out                 BOOLEAN,
  claimant                               JSONB,
  owner_of_claimants_car                 JSONB,
  intermediary                           JSONB,
  lawyer                                 JSONB,
  author_of_damage                       JSONB,
  owner_of_author_of_damages_car         JSONB,
  insurance                              JSONB,
  garage                                 JSONB,
  car                                    JSONB,
  accident                               JSONB,
  damage                                 JSONB,
  lease_return                           JSONB,
  paint_thickness_measurements           JSONB,
  paint_thickness_measurement_comment    TEXT,
  paint_thickness_selected_scale_id      TEXT,
  labels                                 JSONB,
  custom_fields                          JSONB,
  external_updated_at                    TIMESTAMPTZ,
  synced_at                              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload                            JSONB
);

COMMENT ON TABLE public.autoixpert_reports IS 'AutoiXpert Gutachten read-only mirror (ADR-0001).';

CREATE TABLE IF NOT EXISTS public.autoixpert_contacts (
  id                                  TEXT        PRIMARY KEY,
  external_id                         TEXT,
  organization_type                   TEXT        NOT NULL,
  salutation                          TEXT,
  first_name                          TEXT,
  last_name                           TEXT,
  organization_name                   TEXT,
  email                               TEXT,
  phone                               TEXT,
  phone2                              TEXT,
  street_and_housenumber_or_lockbox   TEXT,
  zip                                 TEXT,
  city                                TEXT,
  notes                               TEXT,
  may_deduct_taxes                    BOOLEAN,
  vat_id                              TEXT,
  debtor_number                       TEXT,
  garage_fee_sets                     JSONB,
  created_at                          TIMESTAMPTZ NOT NULL,
  external_updated_at                 TIMESTAMPTZ,
  last_seen_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at                           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload                         JSONB
);

CREATE TABLE IF NOT EXISTS public.autoixpert_invoices (
  id                                 TEXT        PRIMARY KEY,
  number                             TEXT,
  created_at                         TIMESTAMPTZ NOT NULL,
  date                               DATE,
  date_of_supply                     DATE,
  vat_rate                           NUMERIC(6,4),
  total_net                          NUMERIC(12,2),
  total_gross                        NUMERIC(12,2),
  due_date                           DATE,
  days_until_due                     INTEGER,
  has_outstanding_payments           BOOLEAN,
  current_unpaid_amount              NUMERIC(12,2),
  is_fully_canceled                  BOOLEAN     NOT NULL DEFAULT FALSE,
  ids_of_cancellation_invoices       TEXT[],
  cancels_invoice_id                 TEXT,
  is_electronic_invoice_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  location_id                        TEXT,
  recipient                          JSONB,
  line_items                         JSONB,
  payments                           JSONB,
  short_payments                     JSONB,
  partial_cancellations              JSONB,
  documents                          JSONB,
  external_updated_at                TIMESTAMPTZ,
  synced_at                          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload                        JSONB
);

-- Junction: faturalar ↔ raporlar (N:N)
CREATE TABLE IF NOT EXISTS public.autoixpert_invoice_reports (
  invoice_id  TEXT NOT NULL REFERENCES public.autoixpert_invoices(id) ON DELETE CASCADE,
  report_id   TEXT NOT NULL,
  PRIMARY KEY (invoice_id, report_id)
);

-- Sync log
CREATE TABLE IF NOT EXISTS public.autoixpert_sync_log (
  id                  BIGSERIAL   PRIMARY KEY,
  resource            TEXT        NOT NULL CHECK (resource IN ('reports', 'contacts', 'invoices')),
  run_id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  status              TEXT        NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),
  cursor_before       TEXT,
  cursor_after        TEXT,
  page_count          INTEGER,
  cumulative_count    INTEGER,
  filters             JSONB,
  error_code          TEXT,
  error_message       TEXT,
  error_details       JSONB,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at         TIMESTAMPTZ
);

-- =====================================================================
-- 3.10 MAPPING — Gecit customers ↔ autoixpert_contacts
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.customer_autoixpert_links (
  customer_id            TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  autoixpert_contact_id  TEXT        NOT NULL REFERENCES public.autoixpert_contacts(id) ON DELETE CASCADE,
  match_method           TEXT        NOT NULL CHECK (match_method IN ('email', 'phone', 'name_company', 'manual')),
  confidence             NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  is_confirmed           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by             TEXT,
  PRIMARY KEY (customer_id, autoixpert_contact_id)
);

-- ─── Doğrulama: tüm ilişki tabloları ─────────────────────────────────
SELECT COUNT(*) AS yeni_tablo_sayisi
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'customer_documents', 'customer_notes', 'vehicle_notes',
    'lawyers', 'lawyer_assignments', 'lawyer_tasks', 'lawyer_cases', 'court_dates',
    'insurers', 'insurance_assignments', 'insurance_claims', 'insurance_offers',
    'damage_photos', 'damage_timeline',
    'messages', 'notifications', 'activity_logs', 'satisfaction_surveys',
    'objection_templates', 'file_flows', 'whatsapp_templates',
    'gallery', 'reminders', 'live_feed', 'accounting_entries',
    'autoixpert_reports', 'autoixpert_contacts', 'autoixpert_invoices',
    'autoixpert_invoice_reports', 'autoixpert_sync_log',
    'customer_autoixpert_links'
  );
-- Beklenen: 31
