-- GECIT KFZ — TAM SUPABASE KURULUMU (SIFIRDAN)
-- Idempotent — tekrar calistirilabilir.

-- ==========================================================
-- KISIM: 01_extensions_and_enums.sql
-- ==========================================================
-- =====================================================================
-- 01 — EXTENSIONS & ENUMS
-- =====================================================================
-- Amaç: PostgreSQL extension'larını ve uygulama genelinde kullanılan
--       sabit/check değerlerini tanımlar.
-- Sıra: 1/8 — bu dosya HER ŞEYDEN ÖNCE çalıştırılmalı.
-- Idempotent: Evet (CREATE EXTENSION IF NOT EXISTS)
-- Çalıştırma: Supabase Dashboard → SQL Editor → New Query → yapıştır → Run
-- =====================================================================

-- ─── Extensions ──────────────────────────────────────────────────────
-- uuid-ossp : uuid_generate_v4() — autoixpert_sync_log için
-- pgcrypto  : gen_random_uuid() + md5() rastgele PK
-- pg_trgm   : (opsiyonel) müşteri arama için trigram benzerlik
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Notlar: ENUM seçimi ─────────────────────────────────────────────
-- Bu projede ENUM TİPİ KULLANILMIYOR. Status alanları TEXT + CHECK
-- constraint olarak tanımlandı. Sebepleri:
--   1. CHECK constraint'leri ALTER TABLE ile kolay genişletilebilir.
--   2. ENUM tipi PostgREST üzerinden filtre/sort için ek tip dönüşümü
--      gerektiriyor; TEXT direkt çalışıyor.
--   3. Frontend (React) zaten string karşılaştırması yapıyor.
--
-- Kullanılan değer setleri (referans):
--   user_profiles.role        : super_admin, admin, customer, lawyer, insurance
--   customers.type            : bireysel, kurumsal
--   appraisals.status         : bekliyor, teslim_alindi, inceleniyor,
--                               rapor_yaziliyor, tamamlandi, mekanik,
--                               kaporta, rapor
--   invoices.status           : bekliyor, ödendi, iptal
--   appointments.status       : aktif, iptal, tamamlandi
--   lawyer_cases.status       : aktif, beklemede, kazanildi, kaybedildi, kapali
--   insurance_claims.status   : inceleniyor, teklif_verildi, onaylandi,
--                               reddedildi, kapali
--   messages.contact_type     : customer, lawyer, insurance
--   damage_photos.type        : before, after, detail
--   damage_timeline.actor     : customer, admin, system, insurance, lawyer
--   accounting_entries.type   : income, expense
--   autoixpert_reports.type   : liability, short_assessment, partial_kasko,
--                               full_kasko, valuation,
--                               oldtimer_valuation_small, lease_return,
--                               used_vehicle_check, invoice_audit
--   autoixpert_reports.state  : done, recorded, locked, deleted
--   autoixpert_sync_log.resource: reports, contacts, invoices
--   autoixpert_sync_log.status: running, success, failed, partial

-- ─── Doğrulama ───────────────────────────────────────────────────────
-- Bu sorgu en az 3 satır dönmeli (uuid-ossp, pgcrypto, pg_trgm):
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm')
ORDER BY extname;

-- ==========================================================
-- KISIM: 02_core_tables.sql
-- ==========================================================
-- =====================================================================
-- 02 — CORE TABLES (çekirdek tablolar)
-- =====================================================================
-- Amaç: Uygulamanın ana tabloları (kullanıcılar, müşteriler, araçlar,
--       ekspertizler, faturalar, randevular).
-- Sıra: 2/8
-- Idempotent: Evet (CREATE TABLE IF NOT EXISTS)
-- UYARI:    Bu dosya mevcut verilere DOKUNMAZ. Sıfırdan kurulumda
--           kullanıcı verisi YOKTUR (auth.users zaten Supabase yönetiminde).
-- Bağımlılık: 01_extensions_and_enums.sql ÖNCEDEN çalıştırılmış olmalı.
-- =====================================================================

-- ─── 2.1 user_profiles — Supabase auth.users uzantısı ────────────────
-- Notlar:
--   • id auth.users(id) ile bağlı (CASCADE delete).
--   • role, ana yetki kontrolü için kullanılıyor (RLS policy'lerinde).
--   • linked_id, customer/lawyer/insurance kayıtlarına opsiyonel bağ.
--   • created_at/updated_at için trigger 05_triggers'ta tanımlanır.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT        NOT NULL DEFAULT 'customer'
                           CHECK (role IN ('super_admin', 'admin', 'customer', 'lawyer', 'insurance')),
  phone        TEXT,
  company      TEXT,
  avatar_url   TEXT,
  linked_id    TEXT,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.user_profiles IS 'auth.users uzantısı — rol ve profil verisi.';
COMMENT ON COLUMN public.user_profiles.linked_id IS 'customer/lawyer/insurance.id''ye opsiyonel bağ (TEXT tip, çünkü bu tablolar kendi prefix''li ID kullanır).';

-- ─── 2.2 customers — Müşteriler (bireysel + kurumsal) ────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id          TEXT        PRIMARY KEY DEFAULT 'c' || substr(md5(random()::text), 1, 7),
  full_name   TEXT,
  company     TEXT,
  email       TEXT        UNIQUE NOT NULL,
  phone       TEXT,
  type        TEXT        DEFAULT 'bireysel' CHECK (type IN ('bireysel', 'kurumsal')),
  tax_id      TEXT,
  tax_no      TEXT,
  tax_office  TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.customers IS 'Bireysel ve kurumsal müşteriler.';

-- ─── 2.3 vehicles — Araçlar ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id          TEXT        PRIMARY KEY DEFAULT 'v' || substr(md5(random()::text), 1, 7),
  owner_id    TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plate       TEXT        NOT NULL,
  brand       TEXT,
  model       TEXT,
  year        INTEGER,
  chassis     TEXT,
  km          INTEGER,
  color       TEXT,
  fuel        TEXT,
  engine_cc   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vehicles IS 'Müşterilere bağlı araçlar.';

-- ─── 2.4 appraisals — Ekspertizler (Gutachten) ───────────────────────
CREATE TABLE IF NOT EXISTS public.appraisals (
  id          TEXT        PRIMARY KEY DEFAULT 'ap' || substr(md5(random()::text), 1, 7),
  vehicle_id  TEXT        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  status      TEXT        DEFAULT 'bekliyor'
                          CHECK (status IN ('bekliyor', 'teslim_alindi', 'inceleniyor',
                                            'rapor_yaziliyor', 'tamamlandi',
                                            'mekanik', 'kaporta', 'rapor')),
  date        TEXT,
  expert      TEXT,
  notes       TEXT,
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.appraisals IS 'Ekspertiz raporları (yerel / AutoiXpert öncesi).';

-- ─── 2.5 paint_maps — Boya haritaları (1:1 araç) ─────────────────────
CREATE TABLE IF NOT EXISTS public.paint_maps (
  vehicle_id  TEXT        PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2.6 invoices — Yerel faturalar ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id           TEXT        PRIMARY KEY DEFAULT 'inv' || substr(md5(random()::text), 1, 7),
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  no           TEXT        UNIQUE NOT NULL,
  date         TEXT,
  amount       NUMERIC(12,2) DEFAULT 0,
  status       TEXT        DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'ödendi', 'iptal')),
  items        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2.7 appointments — Randevular ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id           TEXT        PRIMARY KEY DEFAULT 'apt' || substr(md5(random()::text), 1, 7),
  customer_id  TEXT        REFERENCES public.customers(id) ON DELETE SET NULL,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  plate        TEXT,
  service      TEXT,
  date         TEXT        NOT NULL,
  time         TEXT,
  status       TEXT        DEFAULT 'aktif' CHECK (status IN ('aktif', 'bekliyor', 'onaylandi', 'iptal', 'tamamlandi')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Doğrulama ───────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'customers', 'vehicles', 'appraisals',
                     'paint_maps', 'invoices', 'appointments')
ORDER BY table_name;
-- Beklenen: 7 satır

-- ==========================================================
-- KISIM: 03_relations_tables.sql
-- ==========================================================
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

-- ==========================================================
-- KISIM: 04_indexes.sql
-- ==========================================================
-- =====================================================================
-- 04 — INDEXES (performans indeksleri)
-- =====================================================================
-- Amaç: En sık çalıştırılan sorgular için index'ler.
-- Sıra: 4/8
-- Idempotent: Evet (CREATE INDEX IF NOT EXISTS)
-- Bağımlılık: 02_core_tables, 03_relations_tables
-- Geri alma: DROP INDEX IF EXISTS public.<index_adi>;
-- =====================================================================

-- ─── 4.1 Çekirdek FK index'leri ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_owner            ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_vehicle        ON public.appraisals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer         ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer     ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON public.customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_vehicle  ON public.customer_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer   ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_notes_vehicle     ON public.vehicle_notes(vehicle_id);

-- ─── 4.2 İletişim ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_contact          ON public.messages(contact_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_messages_created          ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created     ON public.notifications(created_at DESC);

-- ─── 4.3 Sigorta ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer       ON public.insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurer        ON public.insurance_claims(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status         ON public.insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_offers_claim          ON public.insurance_offers(claim_id);
CREATE INDEX IF NOT EXISTS idx_insurance_assignments_insurer   ON public.insurance_assignments(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_assignments_customer  ON public.insurance_assignments(customer_id);

-- ─── 4.4 Hasar / timeline / log ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_damage_photos_vehicle     ON public.damage_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_timeline_customer  ON public.damage_timeline(customer_id);
CREATE INDEX IF NOT EXISTS idx_damage_timeline_vehicle   ON public.damage_timeline(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created     ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user        ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;

-- ─── 4.5 Avukat ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_lawyer  ON public.lawyer_assignments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_customer ON public.lawyer_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_cases_lawyer        ON public.lawyer_cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_cases_customer      ON public.lawyer_cases(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lawyer_tasks_lawyer        ON public.lawyer_tasks(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_court_dates_lawyer         ON public.court_dates(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_court_dates_date           ON public.court_dates(date);

-- ─── 4.6 user_profiles ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_role         ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_linked_id    ON public.user_profiles(linked_id) WHERE linked_id IS NOT NULL;

-- ─── 4.7 customers — arama (trigram) ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_full_name_trgm   ON public.customers USING gin (full_name gin_trgm_ops) WHERE full_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_company_trgm     ON public.customers USING gin (company gin_trgm_ops) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email            ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone            ON public.customers(phone) WHERE phone IS NOT NULL;

-- ─── 4.8 vehicles — plaka arama ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_plate             ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis           ON public.vehicles(chassis) WHERE chassis IS NOT NULL;

-- ─── 4.9 AutoiXpert reports ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_axreports_external_id           ON public.autoixpert_reports(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_state                 ON public.autoixpert_reports(state);
CREATE INDEX IF NOT EXISTS idx_axreports_type                  ON public.autoixpert_reports(type);
CREATE INDEX IF NOT EXISTS idx_axreports_token                 ON public.autoixpert_reports(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_created_at            ON public.autoixpert_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_axreports_external_updated_at   ON public.autoixpert_reports(external_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_axreports_responsible           ON public.autoixpert_reports(responsible_assessor_id) WHERE responsible_assessor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_claimant_email        ON public.autoixpert_reports ((claimant->>'email')) WHERE claimant->>'email' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_aod_email             ON public.autoixpert_reports ((author_of_damage->>'email')) WHERE author_of_damage->>'email' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_oocc_email            ON public.autoixpert_reports ((owner_of_claimants_car->>'email')) WHERE owner_of_claimants_car->>'email' IS NOT NULL;

-- ─── 4.10 AutoiXpert contacts ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_axcontacts_external_id    ON public.autoixpert_contacts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_org_type       ON public.autoixpert_contacts(organization_type);
CREATE INDEX IF NOT EXISTS idx_axcontacts_email          ON public.autoixpert_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_org_name       ON public.autoixpert_contacts(organization_name) WHERE organization_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_created_at     ON public.autoixpert_contacts(created_at DESC);

-- ─── 4.11 AutoiXpert invoices ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_axinvoices_number             ON public.autoixpert_invoices(number) WHERE number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_date               ON public.autoixpert_invoices(date DESC) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_created_at         ON public.autoixpert_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_axinvoices_outstanding        ON public.autoixpert_invoices(has_outstanding_payments) WHERE has_outstanding_payments = TRUE;
CREATE INDEX IF NOT EXISTS idx_axinvoices_canceled           ON public.autoixpert_invoices(is_fully_canceled);
CREATE INDEX IF NOT EXISTS idx_axinvoices_cancels            ON public.autoixpert_invoices(cancels_invoice_id) WHERE cancels_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_recipient_email    ON public.autoixpert_invoices ((recipient->>'email')) WHERE recipient->>'email' IS NOT NULL;

-- ─── 4.12 AutoiXpert junction + sync log + mapping ───────────────────
CREATE INDEX IF NOT EXISTS idx_axinvrep_report               ON public.autoixpert_invoice_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_axsync_run                    ON public.autoixpert_sync_log(run_id, started_at);
CREATE INDEX IF NOT EXISTS idx_axsync_resource_status        ON public.autoixpert_sync_log(resource, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_cax_links_contact             ON public.customer_autoixpert_links(autoixpert_contact_id);
CREATE INDEX IF NOT EXISTS idx_cax_links_method              ON public.customer_autoixpert_links(match_method, confidence DESC);

-- ─── Doğrulama ───────────────────────────────────────────────────────
SELECT COUNT(*) AS toplam_index
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
-- Beklenen: 50+

-- ==========================================================
-- KISIM: 05_triggers_and_functions.sql
-- ==========================================================
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

-- ==========================================================
-- KISIM: 06_rls_policies.sql
-- ==========================================================
-- =====================================================================
-- 06 — ROW LEVEL SECURITY (RLS) + POLICIES
-- =====================================================================
-- Amaç: Her tabloda RLS aktif + admin/customer/lawyer/insurance policy'leri.
-- Sıra: 6/8
-- Idempotent: Evet (DROP POLICY IF EXISTS … CREATE POLICY …)
-- Bağımlılık: 02, 03, 05 (is_admin fonksiyonu zorunlu)
-- =====================================================================
--
-- POLICY MİMARİSİ:
--   1. Service role tüm RLS'i bypass eder (Edge Function / sunucu).
--   2. Admin (super_admin/admin) → her tabloda FULL CRUD (is_admin()).
--   3. Customer (role='customer') → kendi customer_id'sine ait okuma.
--   4. Lawyer (role='lawyer') → atanmış müşterilerin verisine okuma.
--   5. Insurance (role='insurance') → kendi claim/offer'ları üzerinde CRUD.
--   6. Anonymous → SADECE landing/appointments INSERT (form için) — opsiyonel.
--
-- =====================================================================

-- ─── 6.1 Tüm tablolarda RLS aktif et + admin policy ──────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'user_profiles', 'customers', 'vehicles', 'appraisals', 'paint_maps',
    'invoices', 'appointments', 'customer_documents', 'customer_notes',
    'vehicle_notes', 'lawyers', 'lawyer_assignments', 'lawyer_tasks',
    'lawyer_cases', 'court_dates', 'insurers', 'insurance_assignments',
    'insurance_claims', 'insurance_offers', 'damage_photos', 'damage_timeline',
    'messages', 'notifications', 'activity_logs', 'satisfaction_surveys',
    'objection_templates', 'file_flows', 'whatsapp_templates', 'gallery',
    'reminders', 'live_feed', 'accounting_entries',
    'autoixpert_reports', 'autoixpert_contacts', 'autoixpert_invoices',
    'autoixpert_invoice_reports', 'autoixpert_sync_log',
    'customer_autoixpert_links'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── 6.2 user_profiles: kendi satırını okuyabilir + güncelleyebilir ──
DROP POLICY IF EXISTS profile_self_read ON public.user_profiles;
CREATE POLICY profile_self_read ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profile_self_update ON public.user_profiles;
CREATE POLICY profile_self_update ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Kullanıcı kendi rolünü değiştiremez (role kolonu için trigger eklenebilir)
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
  );

-- ─── 6.3 customers — Müşteri kendi kaydını görür ─────────────────────
DROP POLICY IF EXISTS customer_self ON public.customers;
CREATE POLICY customer_self ON public.customers FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()));

-- ─── 6.4 vehicles — Müşteri kendi araçlarını görür ───────────────────
DROP POLICY IF EXISTS customer_vehicles_self ON public.vehicles;
CREATE POLICY customer_vehicles_self ON public.vehicles FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM public.customers
      WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- ─── 6.5 appraisals — Müşteri kendi araç ekspertizlerini görür ───────
DROP POLICY IF EXISTS customer_appraisals_self ON public.appraisals;
CREATE POLICY customer_appraisals_self ON public.appraisals FOR SELECT
  TO authenticated
  USING (
    vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      JOIN public.customers c ON c.id = v.owner_id
      WHERE c.email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- ─── 6.6 customer_documents — Müşteri kendi belgelerini görür ────────
DROP POLICY IF EXISTS customer_documents_self ON public.customer_documents;
CREATE POLICY customer_documents_self ON public.customer_documents FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- ─── 6.7 invoices — Müşteri kendi faturalarını görür ─────────────────
DROP POLICY IF EXISTS customer_invoices_self ON public.invoices;
CREATE POLICY customer_invoices_self ON public.invoices FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- ─── 6.8 messages — Müşteri kendi mesajlarını görür/yazar ────────────
DROP POLICY IF EXISTS customer_messages_self ON public.messages;
CREATE POLICY customer_messages_self ON public.messages FOR ALL
  TO authenticated
  USING (
    contact_type = 'customer'
    AND contact_id IN (
      SELECT id FROM public.customers
      WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    contact_type = 'customer'
    AND contact_id IN (
      SELECT id FROM public.customers
      WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- ─── 6.9 notifications — Kullanıcı kendi bildirimlerini görür ────────
-- user_id alanı user_profiles.id (UUID) string olarak tutuluyor
DROP POLICY IF EXISTS notifications_self ON public.notifications;
CREATE POLICY notifications_self ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ─── 6.10 LAWYER policy'leri ─────────────────────────────────────────
-- Avukat atanmış müşterilerin verisine erişir.
DROP POLICY IF EXISTS lawyer_customers_assigned ON public.customers;
CREATE POLICY lawyer_customers_assigned ON public.customers FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT customer_id FROM public.lawyer_assignments
      WHERE lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer')
    )
  );

DROP POLICY IF EXISTS lawyer_cases_own ON public.lawyer_cases;
CREATE POLICY lawyer_cases_own ON public.lawyer_cases FOR ALL
  TO authenticated
  USING (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'))
  WITH CHECK (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

DROP POLICY IF EXISTS lawyer_tasks_own ON public.lawyer_tasks;
CREATE POLICY lawyer_tasks_own ON public.lawyer_tasks FOR ALL
  TO authenticated
  USING (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'))
  WITH CHECK (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

DROP POLICY IF EXISTS lawyer_court_dates_own ON public.court_dates;
CREATE POLICY lawyer_court_dates_own ON public.court_dates FOR ALL
  TO authenticated
  USING (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'))
  WITH CHECK (lawyer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

-- ─── 6.11 INSURANCE policy'leri ──────────────────────────────────────
DROP POLICY IF EXISTS insurance_claims_own ON public.insurance_claims;
CREATE POLICY insurance_claims_own ON public.insurance_claims FOR ALL
  TO authenticated
  USING (insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance'))
  WITH CHECK (insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance'));

DROP POLICY IF EXISTS insurance_offers_own ON public.insurance_offers;
CREATE POLICY insurance_offers_own ON public.insurance_offers FOR ALL
  TO authenticated
  USING (insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance'))
  WITH CHECK (insurer_id = (SELECT linked_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'insurance'));

-- ─── 6.12 Public form INSERT — appointments (anonim form) ────────────
-- Landing sayfasındaki randevu formu auth gerektirmez.
-- Bu policy auth olmayanların SADECE INSERT yapmasına izin verir.
DROP POLICY IF EXISTS appointments_anon_insert ON public.appointments;
CREATE POLICY appointments_anon_insert ON public.appointments FOR INSERT
  TO anon
  WITH CHECK (
    -- Sadece sınırlı alanlar yazılabilir (statü "aktif" olmalı, customer_id null/auto)
    status = 'aktif'
    AND email IS NOT NULL
    AND date IS NOT NULL
  );

-- ─── 6.13 Doğrulama: tüm tablolar RLS açık mı? ───────────────────────
SELECT c.relname AS tablo, c.relrowsecurity AS rls_acik,
       (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policy_sayisi
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'user_profiles', 'customers', 'vehicles', 'appraisals', 'invoices',
    'messages', 'notifications', 'insurance_claims', 'autoixpert_reports'
  )
ORDER BY c.relname;
-- Beklenen: rls_acik = true, policy_sayisi >= 1 her satırda.

-- ==========================================================
-- KISIM: 07_storage_buckets.sql
-- ==========================================================
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

-- ==========================================================
-- KISIM: 08_seed_data.sql
-- ==========================================================
-- =====================================================================
-- 08 — SEED DATA (başlangıç verileri — OPSİYONEL)
-- =====================================================================
-- Amaç: Boş veritabanını çalışır duruma getirmek için minimal seed.
-- Sıra: 8/8
-- Idempotent: Evet (ON CONFLICT DO NOTHING)
-- UYARI:    Bu dosya OPSİYONEL'dir. Mevcut prod verisi varsa
--           çalıştırmayın — anti-idempotent satırlar OLMAMASINA rağmen
--           sembolik veri ekler.
-- =====================================================================
--
-- BU DOSYA NE YAPAR?
--   1. Default itiraz şablonları (3 adet) ekler.
--   2. Default WhatsApp şablonları (2 adet) ekler.
--   3. Default file_flow trigger'ları (1 adet) ekler.
--
-- BU DOSYA NE YAPMAZ?
--   • auth.users / user_profiles satırı oluşturmaz — bu Supabase Dashboard
--     üzerinden manuel yapılır (veya client-side signUp).
--   • Müşteri/araç/ekspertiz seed'i eklemez (gerçek veri orada olacak).
--   • Şifre/credential atamaz.
--
-- ADMIN HESABI NASIL OLUŞTURULUR?
--   1. Supabase Dashboard → Authentication → Users → Add user
--   2. E-posta + şifre gir → Create user
--   3. handle_new_user trigger'ı user_profiles satırını otomatik oluşturur (role='customer').
--   4. SQL Editor'de role'ü yükselt:
--        UPDATE public.user_profiles
--        SET role = 'super_admin'
--        WHERE email = 'admin@gecit-kfz.de';
-- =====================================================================

-- ─── 8.1 Objection templates (itiraz şablonları) ─────────────────────
INSERT INTO public.objection_templates (id, title, category, content) VALUES
  ('ot_default_1', 'Standart Red İtirazı',
   'red_itiraz',
   'Sehr geehrte Damen und Herren,

mit Schreiben vom [DATUM] haben Sie unseren Schadensanspruch zu Aktenzeichen [AKTENZEICHEN] zurückgewiesen. Hiergegen legen wir hiermit Widerspruch ein.

Begründung:
[BEGRUENDUNG]

Wir bitten um erneute Prüfung des Falls und Bestätigung der Schadensregulierung innerhalb von 14 Tagen.

Mit freundlichen Grüßen
Gecit KFZ Sachverständiger'),
  ('ot_default_2', 'Düşük Teklif İtirazı',
   'dusuk_teklif',
   'Sehr geehrte Damen und Herren,

das mit Schreiben vom [DATUM] zugestellte Angebot in Höhe von [BETRAG] EUR weicht erheblich von unserem Sachverständigengutachten ab.

Im Gutachten ermittelter Schaden: [SCHADEN] EUR
Differenz: [DIFFERENZ] EUR

Wir fordern eine Anpassung auf den im Gutachten festgestellten Betrag.

Mit freundlichen Grüßen'),
  ('ot_default_3', 'Mahkeme İtiraz Dilekçesi',
   'mahkeme',
   '[MAHKEME] Mahkemesi Sayın Hakimliğine,

Davacı: [MUSTERI_AD]
Davalı: [SIGORTA_SIRKETI]
Konu:   Sigorta tazminatı talebi

Açıklamalar:
[ACIKLAMA]

Sonuç ve İstem: Davalı sigorta şirketi tarafından eksik ödenen [TUTAR] EUR tutarındaki tazminatın yasal faiziyle birlikte ödenmesine karar verilmesini saygılarımla arz ve talep ederim.')
ON CONFLICT (id) DO NOTHING;

-- ─── 8.2 WhatsApp şablonları ─────────────────────────────────────────
INSERT INTO public.whatsapp_templates (id, name, message, trigger, active) VALUES
  ('wt_default_1', 'Randevu Hatırlatma',
   'Merhaba [AD], yarın saat [SAAT] için Gecit KFZ Sachverständiger ekspertizinde randevunuz var. Plaka: [PLAKA]. Görüşmek üzere!',
   'appointment_reminder', TRUE),
  ('wt_default_2', 'Ekspertiz Tamamlandı',
   'Merhaba [AD], aracınızın ekspertiz raporu hazır. Müşteri panelinden indirebilirsiniz: [LINK]',
   'appraisal_complete', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── 8.3 File flow (otomasyon) ───────────────────────────────────────
INSERT INTO public.file_flows (id, trigger, actions, label, active) VALUES
  ('ff_default_1',
   'appraisal_complete',
   ARRAY['notify_customer', 'send_whatsapp', 'log_activity'],
   'Ekspertiz Tamamlandı Akışı',
   TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── Doğrulama ───────────────────────────────────────────────────────
SELECT 'objection_templates' AS tablo, COUNT(*) AS kayit_sayisi FROM public.objection_templates
UNION ALL
SELECT 'whatsapp_templates', COUNT(*) FROM public.whatsapp_templates
UNION ALL
SELECT 'file_flows', COUNT(*) FROM public.file_flows;
-- Beklenen: 3 + 2 + 1 = 6 satır

-- =====================================================================
-- KURULUM SONRASI YAPILMASI GEREKENLER
-- =====================================================================
-- 1. Supabase Dashboard → Authentication → Providers → Email aktif et.
-- 2. İlk admin kullanıcıyı oluştur (yukarıdaki not).
-- 3. Frontend .env dosyasını güncelle:
--      VITE_SUPABASE_URL=https://pbugramfltkoyqcldghk.supabase.co
--      VITE_SUPABASE_ANON_KEY=<anon_key>
-- 4. Storage bucket'larında dosya boyutu / MIME tip ayarlarını kontrol et.
-- 5. Realtime ayarlarında "Replication" tabını ziyaret edip
--    publication'ın aktif olduğunu doğrula.
-- =====================================================================

-- ==========================================================
-- KISIM: 10_ruhsat_full_storage.sql
-- ==========================================================
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

