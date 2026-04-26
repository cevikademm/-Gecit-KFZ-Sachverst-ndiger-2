-- ═══════════════════════════════════════════════════════════════
-- GECIT-KFZ — Supabase Migration (PostgreSQL)
-- Tüm tabloları oluşturur, RLS politikalarını ayarlar
-- Supabase Dashboard > SQL Editor'e yapıştırarak çalıştırın
-- ═══════════════════════════════════════════════════════════════

-- ─── Enable required extensions ──────────────────────────���──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── User Profiles (extends Supabase Auth) ──────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'customer', 'lawyer', 'insurance')),
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  linked_id TEXT, -- links to customers.id, lawyers.id, or insurers.id
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Customers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT 'c' || substr(md5(random()::text), 1, 7),
  full_name TEXT,
  company TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  type TEXT DEFAULT 'bireysel' CHECK (type IN ('bireysel', 'kurumsal')),
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vehicles ───────────────────────────────────────────────
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Appraisals (Ekspertizler) ──────────────────────────────
CREATE TABLE IF NOT EXISTS appraisals (
  id TEXT PRIMARY KEY DEFAULT 'ap' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'teslim_alindi', 'inceleniyor', 'rapor_yaziliyor', 'tamamlandi')),
  date TEXT,
  expert TEXT,
  notes TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Paint Maps (Boya Haritaları) ───────────────────────────
CREATE TABLE IF NOT EXISTS paint_maps (
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoices (Faturalar) ───────────────────────────────────
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

-- ─── Appointments (Randevular) ──────────────────────────────
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

-- ─── Customer Documents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_documents (
  id TEXT PRIMARY KEY DEFAULT 'cd' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'diger',
  category TEXT,
  size INTEGER,
  storage_path TEXT, -- Supabase Storage path
  data TEXT, -- base64 fallback (for migration)
  mime TEXT,
  uploaded_at TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Customer Notes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY DEFAULT 'cn' || substr(md5(random()::text), 1, 7),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vehicle Notes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_notes (
  id TEXT PRIMARY KEY DEFAULT 'vn' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lawyers (Avukatlar) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyers (
  id TEXT PRIMARY KEY DEFAULT 'law' || substr(md5(random()::text), 1, 7),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  bar_number TEXT, -- Baro no
  password TEXT, -- TODO: migrate to Supabase Auth
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lawyer Assignments ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyer_assignments (
  id TEXT PRIMARY KEY DEFAULT 'la' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lawyer_id, customer_id)
);

-- ─── Lawyer Tasks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyer_tasks (
  id TEXT PRIMARY KEY DEFAULT 'lt' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT false,
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lawyer Cases (Dava Dosyaları) ──────────────────────────
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

-- ─── Court Dates (Mahkeme Tarihleri) ────────────────────────
CREATE TABLE IF NOT EXISTS court_dates (
  id TEXT PRIMARY KEY DEFAULT 'cd' || substr(md5(random()::text), 1, 7),
  lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  case_id TEXT REFERENCES lawyer_cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  court TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages (Tüm portal mesajları) ───────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT 'msg' || substr(md5(random()::text), 1, 7),
  contact_id TEXT NOT NULL, -- customer_id, lawyer_id, or insurer_id
  contact_type TEXT NOT NULL CHECK (contact_type IN ('customer', 'lawyer', 'insurance')),
  sender TEXT NOT NULL, -- 'admin', 'customer', 'lawyer', 'insurance'
  sender_name TEXT,
  text TEXT NOT NULL,
  read_by_admin BOOLEAN DEFAULT false,
  read_by_customer BOOLEAN DEFAULT false,
  read_by_lawyer BOOLEAN DEFAULT false,
  read_by_insurance BOOLEAN DEFAULT false,
  claim_id TEXT, -- for insurance-related messages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT 'n' || substr(md5(random()::text), 1, 7),
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Activity Logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY DEFAULT 'log' || substr(md5(random()::text), 1, 7),
  type TEXT,
  user_id TEXT,
  text TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Satisfaction Surveys ───────────────────────────────────
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id TEXT PRIMARY KEY DEFAULT 'srv' || substr(md5(random()::text), 1, 7),
  appraisal_id TEXT REFERENCES appraisals(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Insurers (Sigorta Şirketleri) ─────────────────────────
CREATE TABLE IF NOT EXISTS insurers (
  id TEXT PRIMARY KEY DEFAULT 'ins' || substr(md5(random()::text), 1, 7),
  company TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT, -- TODO: migrate to Supabase Auth
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Insurance Claims (Sigorta Talepleri) ───────────────────
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

-- ─── Insurance Offers (Kostenvoranschlag) ───────────────────
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

-- ─── Damage Photos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS damage_photos (
  id TEXT PRIMARY KEY DEFAULT 'dp' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('before', 'after', 'detail')),
  label TEXT,
  part TEXT,
  url TEXT, -- Supabase Storage URL
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Damage Timeline ────────────────────────────────────────
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

-- ─── Objection Templates (İtiraz Şablonları) ────────────────
CREATE TABLE IF NOT EXISTS objection_templates (
  id TEXT PRIMARY KEY DEFAULT 'ot' || substr(md5(random()::text), 1, 7),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('red_itiraz', 'dusuk_teklif', 'tazminat', 'mahkeme')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── File Flows (Dosya Akış Motoru) ──────────────────��──────
CREATE TABLE IF NOT EXISTS file_flows (
  id TEXT PRIMARY KEY DEFAULT 'ff' || substr(md5(random()::text), 1, 7),
  trigger TEXT NOT NULL,
  actions TEXT[] NOT NULL DEFAULT '{}',
  label TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WhatsApp Templates ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY DEFAULT 'wt' || substr(md5(random()::text), 1, 7),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Gallery ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY DEFAULT 'gal' || substr(md5(random()::text), 1, 7),
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  url TEXT,
  storage_path TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reminders ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY DEFAULT 'rem' || substr(md5(random()::text), 1, 7),
  text TEXT NOT NULL,
  due_date TEXT,
  done BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Live Feed ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_feed (
  id TEXT PRIMARY KEY DEFAULT 'lf' || substr(md5(random()::text), 1, 7),
  type TEXT,
  text TEXT NOT NULL,
  time TEXT,
  date TEXT,
  status TEXT DEFAULT 'bekliyor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Accounting ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_entries (
  id TEXT PRIMARY KEY DEFAULT 'acc' || substr(md5(random()::text), 1, 7),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Indexes ════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_vehicle ON appraisals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurer ON insurance_claims(insurer_id);
CREATE INDEX IF NOT EXISTS idx_damage_photos_vehicle ON damage_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_timeline_customer ON damage_timeline(customer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_assignments_lawyer ON lawyer_assignments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ═══ Row Level Security (RLS) ═══════════════════════════════
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY admin_all ON customers FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));
CREATE POLICY admin_all ON vehicles FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));
CREATE POLICY admin_all ON appraisals FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Customers can see their own data
CREATE POLICY customer_own ON customers FOR SELECT
  USING (email = (SELECT email FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY customer_vehicles ON vehicles FOR SELECT
  USING (owner_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY customer_messages ON messages FOR ALL
  USING (contact_id IN (SELECT id FROM customers WHERE email = (SELECT email FROM user_profiles WHERE id = auth.uid())) AND contact_type = 'customer');

-- Lawyers can see assigned customer data
CREATE POLICY lawyer_customers ON customers FOR SELECT
  USING (id IN (
    SELECT customer_id FROM lawyer_assignments WHERE lawyer_id = (
      SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'lawyer'
    )
  ));

-- Insurance can see their claims
CREATE POLICY insurance_claims_own ON insurance_claims FOR ALL
  USING (insurer_id = (SELECT linked_id FROM user_profiles WHERE id = auth.uid() AND role = 'insurance'));

-- ═══ Realtime ═══════════════════════════════════════════════
-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE insurance_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE insurance_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE appraisals;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- ═══ Storage Buckets ════════════════════════════════════════
-- Run these in Supabase Dashboard > Storage
-- CREATE BUCKET: documents (public: false)
-- CREATE BUCKET: photos (public: true)
-- CREATE BUCKET: gallery (public: true)

-- ═══ Edge Functions (optional) ══════════════════════════════
-- Deploy these as Supabase Edge Functions for automation:
--
-- 1. on-appraisal-complete: Triggers file_flows when ekspertiz status = 'tamamlandi'
-- 2. send-whatsapp: Sends WhatsApp messages via Business API
-- 3. generate-pdf: Server-side PDF generation for Gutachten reports
-- 4. notify-all: Multi-channel notification (push + email + WhatsApp)

-- ═══ Seed Data (optional — comment out if migrating existing data) ═══
-- INSERT INTO customers (id, full_name, email, phone, type) VALUES
--   ('c1', 'Mehmet Yılmaz', 'mehmet@mail.com', '+49 176 123 4567', 'bireysel'),
--   ('c2', 'Ayşe Kara', 'ayse@mail.com', '+49 170 987 6543', 'bireysel');
