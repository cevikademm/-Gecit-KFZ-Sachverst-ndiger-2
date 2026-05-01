-- ═══════════════════════════════════════════════════════════════════════
-- Gecit Kfz Sachverständiger — KAPSAMLI ŞEMA (TEK KAYNAK)
-- ═══════════════════════════════════════════════════════════════════════
-- Bu dosya tüm uygulama tablolarını + AutoiXpert mirror tablolarını +
-- mapping katmanını + RLS politikalarını + realtime yayınını + helper
-- fonksiyonları + indeksleri içerir.
--
-- Dosyanın tamamı IDEMPOTENT'tir: tekrar tekrar çalıştırılabilir, mevcut
-- veriyi etkilemez. Yeni tabloları ekler, eksik politikaları yaratır,
-- mevcut olanları olduğu gibi bırakır.
--
-- Çalıştırma:
--   Supabase Dashboard > SQL Editor > Run
--   Veya: psql -f supabase_schema.sql
--
-- Bölümler:
--   1. Extensions
--   2. Çekirdek tablolar (customers, vehicles, appraisals, ...)
--   3. Sigorta + ataşmanlar
--   4. AutoiXpert mirror tabloları
--   5. Mapping katmanı
--   6. İndeksler
--   7. Helper fonksiyonlar + view'ler
--   8. Row Level Security (RLS)
--   9. Realtime publication
--  10. Storage bucket talimatları
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════
-- 2. ÇEKİRDEK TABLOLAR
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Kullanıcı profilleri (Supabase Auth ile bağlantılı) ──────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'customer', 'lawyer', 'insurance')),
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  linked_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Müşteriler (Bireysel + Kurumsal) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT 'c' || substr(md5(random()::text), 1, 7),
  full_name TEXT,
  company TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  type TEXT DEFAULT 'bireysel' CHECK (type IN ('bireysel', 'kurumsal')),
  tax_id TEXT,
  tax_no TEXT,
  tax_office TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Araçlar ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY DEFAULT 'v' || substr(md5(random()::text), 1, 7),
  owner_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  chassis TEXT,
  km INTEGER,
  color TEXT,
  fuel TEXT,
  engine_cc INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Ekspertizler (Gutachten) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appraisals (
  id TEXT PRIMARY KEY DEFAULT 'ap' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'teslim_alindi', 'inceleniyor', 'rapor_yaziliyor', 'tamamlandi', 'mekanik', 'kaporta', 'rapor')),
  date TEXT,
  expert TEXT,
  notes TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Boya haritaları ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paint_maps (
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Faturalar ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT 'inv' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  no TEXT UNIQUE NOT NULL,
  date TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'ödendi', 'iptal')),
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Randevular ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT 'apt' || substr(md5(random()::text), 1, 7),
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  plate TEXT,
  service TEXT,
  date TEXT NOT NULL,
  time TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'iptal', 'tamamlandi')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Müşteri belgeleri ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_documents (
  id TEXT PRIMARY KEY DEFAULT 'cd' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'diger',
  category TEXT,
  size INTEGER,
  storage_path TEXT,
  data TEXT,
  mime TEXT,
  uploaded_at TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Müşteri / Araç notları ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY DEFAULT 'cn' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_notes (
  id TEXT PRIMARY KEY DEFAULT 'vn' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════
-- 3. AVUKAT + SİGORTA + İLİŞKİLER
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Avukatlar ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyers (
  id TEXT PRIMARY KEY DEFAULT 'law' || substr(md5(random()::text), 1, 7),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  bar_number TEXT,
  password TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_assignments (
  id TEXT PRIMARY KEY DEFAULT 'la' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lawyer_id, customer_id)
);

CREATE TABLE IF NOT EXISTS lawyer_tasks (
  id TEXT PRIMARY KEY DEFAULT 'lt' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_cases (
  id TEXT PRIMARY KEY DEFAULT 'case' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'beklemede', 'kazanildi', 'kaybedildi', 'kapali')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS court_dates (
  id TEXT PRIMARY KEY DEFAULT 'crt' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  case_id TEXT REFERENCES lawyer_cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  court TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sigorta şirketleri + atamalar + talepler + teklifler ─────────────
CREATE TABLE IF NOT EXISTS insurers (
  id TEXT PRIMARY KEY DEFAULT 'ins' || substr(md5(random()::text), 1, 7),
  company TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eksikti, eklendi:
CREATE TABLE IF NOT EXISTS insurance_assignments (
  id TEXT PRIMARY KEY DEFAULT 'ia' || substr(md5(random()::text), 1, 7),
  insurer_id TEXT NOT NULL REFERENCES insurers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (insurer_id, customer_id)
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id TEXT PRIMARY KEY DEFAULT 'ic' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  insurer_id TEXT REFERENCES insurers(id) ON DELETE SET NULL,
  appraisal_id TEXT REFERENCES appraisals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'inceleniyor' CHECK (status IN ('inceleniyor', 'teklif_verildi', 'onaylandi', 'reddedildi', 'kapali')),
  claim_date TEXT,
  damage_description TEXT,
  claim_amount NUMERIC(12,2) DEFAULT 0,
  offer_amount NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_offers (
  id TEXT PRIMARY KEY DEFAULT 'io' || substr(md5(random()::text), 1, 7),
  claim_id TEXT NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  insurer_id TEXT NOT NULL REFERENCES insurers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Hasar fotoğrafları + zaman tüneli ────────────────────────────────
CREATE TABLE IF NOT EXISTS damage_photos (
  id TEXT PRIMARY KEY DEFAULT 'dp' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('before', 'after', 'detail')),
  label TEXT,
  part TEXT,
  url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS damage_timeline (
  id TEXT PRIMARY KEY DEFAULT 'dt' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  actor TEXT CHECK (actor IN ('customer', 'admin', 'system', 'insurance', 'lawyer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── İletişim + bildirimler + log + anketler ──────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT 'msg' || substr(md5(random()::text), 1, 7),
  contact_id TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('customer', 'lawyer', 'insurance')),
  sender TEXT NOT NULL,
  sender_name TEXT,
  text TEXT NOT NULL,
  read_by_admin BOOLEAN DEFAULT FALSE,
  read_by_customer BOOLEAN DEFAULT FALSE,
  read_by_lawyer BOOLEAN DEFAULT FALSE,
  read_by_insurance BOOLEAN DEFAULT FALSE,
  claim_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT 'n' || substr(md5(random()::text), 1, 7),
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY DEFAULT 'log' || substr(md5(random()::text), 1, 7),
  type TEXT,
  user_id TEXT,
  text TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id TEXT PRIMARY KEY DEFAULT 'srv' || substr(md5(random()::text), 1, 7),
  appraisal_id TEXT REFERENCES appraisals(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Şablonlar / Dosya akışı / WhatsApp ───────────────────────────────
CREATE TABLE IF NOT EXISTS objection_templates (
  id TEXT PRIMARY KEY DEFAULT 'ot' || substr(md5(random()::text), 1, 7),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('red_itiraz', 'dusuk_teklif', 'tazminat', 'mahkeme')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_flows (
  id TEXT PRIMARY KEY DEFAULT 'ff' || substr(md5(random()::text), 1, 7),
  trigger TEXT NOT NULL,
  actions TEXT[] NOT NULL DEFAULT '{}',
  label TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY DEFAULT 'wt' || substr(md5(random()::text), 1, 7),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Galeri / Hatırlatmalar / Live Feed / Muhasebe ────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY DEFAULT 'gal' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  url TEXT,
  storage_path TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY DEFAULT 'rem' || substr(md5(random()::text), 1, 7),
  text TEXT NOT NULL,
  due_date TEXT,
  done BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_feed (
  id TEXT PRIMARY KEY DEFAULT 'lf' || substr(md5(random()::text), 1, 7),
  type TEXT,
  text TEXT NOT NULL,
  time TEXT,
  date TEXT,
  status TEXT DEFAULT 'bekliyor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting_entries (
  id TEXT PRIMARY KEY DEFAULT 'acc' || substr(md5(random()::text), 1, 7),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════
-- 4. AUTOIXPERT MIRROR TABLOLARI (read-only ayna)
-- Ref: docs/ADR/0001-autoixpert-mirror.md
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Gutachten (Raporlar) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_reports (
  id TEXT PRIMARY KEY,
  external_id TEXT,

  type TEXT NOT NULL CHECK (type IN (
    'liability', 'short_assessment', 'partial_kasko', 'full_kasko',
    'valuation', 'oldtimer_valuation_small', 'lease_return',
    'used_vehicle_check', 'invoice_audit'
  )),
  state TEXT NOT NULL CHECK (state IN ('done', 'recorded', 'locked', 'deleted')),
  token TEXT,

  completion_date DATE,
  order_date DATE,
  order_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,

  responsible_assessor_id TEXT,
  location_id TEXT,
  use_factoring BOOLEAN,
  use_dekra_fees BOOLEAN,
  vin_was_checked BOOLEAN,
  source_of_technical_data TEXT,
  test_drive_carried_out BOOLEAN,

  claimant JSONB,
  owner_of_claimants_car JSONB,
  intermediary JSONB,
  lawyer JSONB,
  author_of_damage JSONB,
  owner_of_author_of_damages_car JSONB,
  insurance JSONB,
  garage JSONB,

  car JSONB,
  accident JSONB,
  damage JSONB,
  lease_return JSONB,

  paint_thickness_measurements JSONB,
  paint_thickness_measurement_comment TEXT,
  paint_thickness_selected_scale_id TEXT,

  labels JSONB,
  custom_fields JSONB,

  external_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

-- ─── Kontakte ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_contacts (
  id TEXT PRIMARY KEY,
  external_id TEXT,

  organization_type TEXT NOT NULL,
  salutation TEXT,
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  email TEXT,
  phone TEXT,
  phone2 TEXT,
  street_and_housenumber_or_lockbox TEXT,
  zip TEXT,
  city TEXT,
  notes TEXT,
  may_deduct_taxes BOOLEAN,
  vat_id TEXT,
  debtor_number TEXT,

  garage_fee_sets JSONB,

  created_at TIMESTAMPTZ NOT NULL,

  external_updated_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

-- ─── Rechnungen (Read-only) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_invoices (
  id TEXT PRIMARY KEY,

  number TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  date DATE,
  date_of_supply DATE,

  vat_rate NUMERIC(6,4),
  total_net NUMERIC(12,2),
  total_gross NUMERIC(12,2),

  due_date DATE,
  days_until_due INTEGER,
  has_outstanding_payments BOOLEAN,
  current_unpaid_amount NUMERIC(12,2),

  is_fully_canceled BOOLEAN NOT NULL DEFAULT FALSE,
  ids_of_cancellation_invoices TEXT[],
  cancels_invoice_id TEXT,
  is_electronic_invoice_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  location_id TEXT,

  recipient JSONB,
  line_items JSONB,
  payments JSONB,
  short_payments JSONB,
  partial_cancellations JSONB,
  documents JSONB,

  external_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

-- ─── Junction: Faturalar ↔ Raporlar (N:N) ─────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_invoice_reports (
  invoice_id TEXT NOT NULL REFERENCES autoixpert_invoices(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL,
  PRIMARY KEY (invoice_id, report_id)
);

-- ─── Sync log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autoixpert_sync_log (
  id BIGSERIAL PRIMARY KEY,
  resource TEXT NOT NULL CHECK (resource IN ('reports', 'contacts', 'invoices')),
  run_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),
  cursor_before TEXT,
  cursor_after TEXT,
  page_count INTEGER,
  cumulative_count INTEGER,
  filters JSONB,
  error_code TEXT,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════
-- 5. MAPPING KATMANI (Gecit ↔ AutoiXpert)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_autoixpert_links (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  autoixpert_contact_id TEXT NOT NULL REFERENCES autoixpert_contacts(id) ON DELETE CASCADE,
  match_method TEXT NOT NULL CHECK (match_method IN ('email', 'phone', 'name_company', 'manual')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  PRIMARY KEY (customer_id, autoixpert_contact_id)
);


-- ═══════════════════════════════════════════════════════════════════════
-- 6. İNDEKSLER
-- ═══════════════════════════════════════════════════════════════════════

-- Çekirdek
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_vehicle ON appraisals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurer ON insurance_claims(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_assignments_insurer ON insurance_assignments(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_assignments_customer ON insurance_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_damage_photos_vehicle ON damage_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_timeline_customer ON damage_timeline(customer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_lawyer ON lawyer_assignments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- AutoiXpert reports
CREATE INDEX IF NOT EXISTS idx_axreports_external_id ON autoixpert_reports(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_state ON autoixpert_reports(state);
CREATE INDEX IF NOT EXISTS idx_axreports_type ON autoixpert_reports(type);
CREATE INDEX IF NOT EXISTS idx_axreports_token ON autoixpert_reports(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_created_at ON autoixpert_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_axreports_external_updated_at ON autoixpert_reports(external_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_axreports_responsible ON autoixpert_reports(responsible_assessor_id) WHERE responsible_assessor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_claimant_email ON autoixpert_reports ((claimant->>'email')) WHERE claimant->>'email' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_aod_email ON autoixpert_reports ((author_of_damage->>'email')) WHERE author_of_damage->>'email' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axreports_oocc_email ON autoixpert_reports ((owner_of_claimants_car->>'email')) WHERE owner_of_claimants_car->>'email' IS NOT NULL;

-- AutoiXpert contacts
CREATE INDEX IF NOT EXISTS idx_axcontacts_external_id ON autoixpert_contacts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_org_type ON autoixpert_contacts(organization_type);
CREATE INDEX IF NOT EXISTS idx_axcontacts_email ON autoixpert_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_org_name ON autoixpert_contacts(organization_name) WHERE organization_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axcontacts_created_at ON autoixpert_contacts(created_at DESC);

-- AutoiXpert invoices
CREATE INDEX IF NOT EXISTS idx_axinvoices_number ON autoixpert_invoices(number) WHERE number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_date ON autoixpert_invoices(date DESC) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_created_at ON autoixpert_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_axinvoices_outstanding ON autoixpert_invoices(has_outstanding_payments) WHERE has_outstanding_payments = TRUE;
CREATE INDEX IF NOT EXISTS idx_axinvoices_canceled ON autoixpert_invoices(is_fully_canceled);
CREATE INDEX IF NOT EXISTS idx_axinvoices_cancels ON autoixpert_invoices(cancels_invoice_id) WHERE cancels_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_axinvoices_recipient_email ON autoixpert_invoices ((recipient->>'email')) WHERE recipient->>'email' IS NOT NULL;

-- AutoiXpert junction + sync
CREATE INDEX IF NOT EXISTS idx_axinvrep_report ON autoixpert_invoice_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_axsync_run ON autoixpert_sync_log(run_id, started_at);
CREATE INDEX IF NOT EXISTS idx_axsync_resource_status ON autoixpert_sync_log(resource, status, started_at DESC);

-- Mapping
CREATE INDEX IF NOT EXISTS idx_cax_links_contact ON customer_autoixpert_links(autoixpert_contact_id);
CREATE INDEX IF NOT EXISTS idx_cax_links_method ON customer_autoixpert_links(match_method, confidence DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- 7. HELPER FONKSİYONLAR + VIEW'LER
-- ═══════════════════════════════════════════════════════════════════════

-- Sync status view
CREATE OR REPLACE VIEW autoixpert_sync_status AS
  SELECT
    resource,
    MAX(started_at) FILTER (WHERE status = 'success') AS last_success_at,
    MAX(finished_at) FILTER (WHERE status = 'success' AND cursor_after IS NULL) AS last_complete_run_at,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failures
  FROM autoixpert_sync_log
  GROUP BY resource;

-- Son başarılı sync zamanı
CREATE OR REPLACE FUNCTION autoixpert_last_sync_at(p_resource TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE AS $$
  SELECT last_complete_run_at FROM autoixpert_sync_status WHERE resource = p_resource;
$$;

-- Bir Gecit müşterisi için AutoiXpert raporları
CREATE OR REPLACE FUNCTION autoixpert_reports_for_customer(p_customer_id TEXT)
RETURNS SETOF autoixpert_reports
LANGUAGE sql STABLE AS $$
  SELECT r.* FROM autoixpert_reports r
  WHERE EXISTS (
    SELECT 1 FROM customer_autoixpert_links l
    JOIN autoixpert_contacts c ON c.id = l.autoixpert_contact_id
    WHERE l.customer_id = p_customer_id
      AND (
        r.claimant->>'email' = c.email
        OR r.author_of_damage->>'email' = c.email
        OR r.owner_of_claimants_car->>'email' = c.email
      )
  )
  OR EXISTS (
    SELECT 1 FROM customers cu
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

CREATE OR REPLACE FUNCTION autoixpert_invoices_for_customer(p_customer_id TEXT)
RETURNS SETOF autoixpert_invoices
LANGUAGE sql STABLE AS $$
  SELECT i.* FROM autoixpert_invoices i
  WHERE EXISTS (
    SELECT 1 FROM customers cu
    WHERE cu.id = p_customer_id
      AND cu.email IS NOT NULL
      AND LOWER(i.recipient->>'email') = LOWER(cu.email)
  )
  OR EXISTS (
    SELECT 1 FROM customer_autoixpert_links l
    JOIN autoixpert_contacts c ON c.id = l.autoixpert_contact_id
    WHERE l.customer_id = p_customer_id
      AND i.recipient->>'email' = c.email
  )
  ORDER BY i.date DESC, i.created_at DESC;
$$;

-- Mapping istatistik view
CREATE OR REPLACE VIEW customer_autoixpert_match_stats AS
SELECT
  c.id AS customer_id,
  c.email,
  c.full_name,
  c.company,
  COUNT(DISTINCT l.autoixpert_contact_id) FILTER (WHERE l.is_confirmed) AS confirmed_links,
  COUNT(DISTINCT l.autoixpert_contact_id) FILTER (WHERE NOT l.is_confirmed) AS pending_links,
  MAX(l.created_at) AS last_linked_at
FROM customers c
LEFT JOIN customer_autoixpert_links l ON l.customer_id = c.id
GROUP BY c.id, c.email, c.full_name, c.company;


-- ═══════════════════════════════════════════════════════════════════════
-- 8. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════
-- Tüm tablolarda RLS aktif. Admin (super_admin/admin) tüm CRUD,
-- Customer/Lawyer/Insurance kendi verisini görür.

-- Helper: admin mi?
-- ÖNEMLİ: SECURITY DEFINER zorunlu — aksi takdirde user_profiles'ın
-- RLS policy'si is_admin() çağırınca sonsuz recursion olur.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND active = TRUE
  );
$$;

-- Tüm tablolarda RLS'i aç ve admin policy ekle
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
    -- Tablo varsa RLS aktive et + admin policy ekle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON %I', tbl, tbl);
      EXECUTE format('CREATE POLICY %I_admin_all ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ─── Müşteri (customer) self-access ───────────────────────────────────
DROP POLICY IF EXISTS customer_self ON customers;
CREATE POLICY customer_self ON customers FOR SELECT
  USING (email = (SELECT email FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS customer_vehicles_self ON vehicles;
CREATE POLICY customer_vehicles_self ON vehicles FOR SELECT
  USING (owner_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS customer_appraisals_self ON appraisals;
CREATE POLICY customer_appraisals_self ON appraisals FOR SELECT
  USING (vehicle_id IN (
    SELECT v.id FROM vehicles v JOIN customers c ON c.id = v.owner_id
    WHERE c.email = (SELECT email FROM user_profiles WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS customer_documents_self ON customer_documents;
CREATE POLICY customer_documents_self ON customer_documents FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS customer_invoices_self ON invoices;
CREATE POLICY customer_invoices_self ON invoices FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS customer_messages_self ON messages;
CREATE POLICY customer_messages_self ON messages FOR ALL
  USING (
    contact_type = 'customer'
    AND contact_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid()))
  )
  WITH CHECK (
    contact_type = 'customer'
    AND contact_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid()))
  );

-- ─── Avukat (lawyer) atanmış müşteri verilerine erişim ───────────────
DROP POLICY IF EXISTS lawyer_customers_assigned ON customers;
CREATE POLICY lawyer_customers_assigned ON customers FOR SELECT
  USING (id IN (
    SELECT customer_id FROM lawyer_assignments
    WHERE lawyer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer')
  ));

DROP POLICY IF EXISTS lawyer_cases_own ON lawyer_cases;
CREATE POLICY lawyer_cases_own ON lawyer_cases FOR ALL
  USING (lawyer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer'))
  WITH CHECK (lawyer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

DROP POLICY IF EXISTS lawyer_tasks_own ON lawyer_tasks;
CREATE POLICY lawyer_tasks_own ON lawyer_tasks FOR ALL
  USING (lawyer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer'))
  WITH CHECK (lawyer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer'));

-- ─── Sigorta (insurance) ──────────────────────────────────────────────
DROP POLICY IF EXISTS insurance_claims_own ON insurance_claims;
CREATE POLICY insurance_claims_own ON insurance_claims FOR ALL
  USING (insurer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'insurance'))
  WITH CHECK (insurer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'insurance'));

DROP POLICY IF EXISTS insurance_offers_own ON insurance_offers;
CREATE POLICY insurance_offers_own ON insurance_offers FOR ALL
  USING (insurer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'insurance'))
  WITH CHECK (insurer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'insurance'));

-- ─── user_profiles: kendi satırını okuyabilir ─────────────────────────
DROP POLICY IF EXISTS profile_self_read ON user_profiles;
CREATE POLICY profile_self_read ON user_profiles FOR SELECT
  USING (id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- 9. REALTIME PUBLICATION (Tüm tablolar için)
-- ═══════════════════════════════════════════════════════════════════════
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
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 10. STORAGE BUCKET TALİMATLARI
-- ═══════════════════════════════════════════════════════════════════════
-- Supabase Dashboard > Storage'dan oluşturun (SQL ile yaratılamaz):
--   • documents (private)   — müşteri belgeleri, KFZ-Schein, faturalar
--   • photos    (public)    — hasar/araç fotoğrafları
--   • gallery   (public)    — galeri görselleri


-- ═══════════════════════════════════════════════════════════════════════
-- DOĞRULAMA SORGULARI
-- ═══════════════════════════════════════════════════════════════════════
-- Çalıştırma sonrası her şeyin yerli yerinde olduğunu doğrulayın:

-- 1) Toplam tablo sayısı (37+ olmalı):
--    SELECT COUNT(*) FROM information_schema.tables
--    WHERE table_schema='public';

-- 2) RLS aktif tablolar:
--    SELECT tablename FROM pg_tables
--    WHERE schemaname='public' AND rowsecurity=TRUE
--    ORDER BY tablename;

-- 3) Realtime publication tabloları:
--    SELECT tablename FROM pg_publication_tables
--    WHERE pubname='supabase_realtime'
--    ORDER BY tablename;

-- 4) AutoiXpert sync durumu:
--    SELECT * FROM autoixpert_sync_status;

-- ═══════════════════════════════════════════════════════════════════════
-- SON
-- ═══════════════════════════════════════════════════════════════════════
