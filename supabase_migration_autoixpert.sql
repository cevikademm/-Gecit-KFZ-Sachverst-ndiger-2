-- ═══════════════════════════════════════════════════════════════════════
-- AutoiXpert ↔ Gecit KFZ Mirror — Supabase Migration
-- Ref: docs/ADR/0001-autoixpert-mirror.md
-- ═══════════════════════════════════════════════════════════════════════
-- Bu migration mevcut tablolara DOKUNMAZ. Yalnızca yeni `autoixpert_*`
-- prefix'li tablolar ekler.
--
-- Çalıştırma:
--   Supabase Dashboard > SQL Editor > yapıştır > Run
--   Veya: psql -f supabase_migration_autoixpert.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Required extensions (zaten mevcut migration'da var, IF NOT EXISTS güvenli)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════
-- 1. autoixpert_reports — Gutachten (Ekspertiz Raporları)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS autoixpert_reports (
  -- AutoiXpert internal ID (örn. "WqJF5FtPaXL8") — natural PK, idempotent UPSERT için
  id TEXT PRIMARY KEY,
  external_id TEXT, -- harici sistem ID (varsa)

  -- Temel alanlar (rapor seviyesi)
  type TEXT NOT NULL CHECK (type IN (
    'liability', 'short_assessment', 'partial_kasko', 'full_kasko',
    'valuation', 'oldtimer_valuation_small', 'lease_return',
    'used_vehicle_check', 'invoice_audit'
  )),
  -- NOT: AutoiXpert list endpoint 'done' ve 'recorded' döndürüyor; detay endpoint
  --       'locked'/'deleted' kullanabilir (doküman'a göre). Hepsini kabul ediyoruz.
  state TEXT NOT NULL CHECK (state IN ('done', 'recorded', 'locked', 'deleted')),
  token TEXT, -- dosya numarası (Aktenzeichen)

  -- Tarihler
  completion_date DATE,
  order_date DATE,
  order_time TIMESTAMPTZ, -- ISO datetime (Europe/Berlin)
  created_at TIMESTAMPTZ NOT NULL,

  -- Atama / konum / ayarlar
  responsible_assessor_id TEXT,
  location_id TEXT,
  use_factoring BOOLEAN, -- nullable: doğru/yanlış/tanımlanmamış
  use_dekra_fees BOOLEAN,
  vin_was_checked BOOLEAN,
  source_of_technical_data TEXT,
  test_drive_carried_out BOOLEAN,

  -- İlgili taraflar (JSONB — doc'a göre rapor içinde "bağımsız kopya" tutuluyor)
  claimant JSONB,
  owner_of_claimants_car JSONB,
  intermediary JSONB,
  lawyer JSONB,
  author_of_damage JSONB,
  owner_of_author_of_damages_car JSONB,
  insurance JSONB,
  garage JSONB,

  -- Araç + kaza + diğer nested objeler
  car JSONB,
  accident JSONB,
  damage JSONB, -- readonly (kalkulasyon)
  lease_return JSONB,

  -- Boya kalınlığı ölçümleri
  paint_thickness_measurements JSONB,
  paint_thickness_measurement_comment TEXT,
  paint_thickness_selected_scale_id TEXT,

  -- Etiketler ve özel alanlar
  labels JSONB, -- [{id,name,color}]
  custom_fields JSONB,

  -- Senkron metadata
  external_updated_at TIMESTAMPTZ, -- AutoiXpert'in updated_at'i
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB -- ham yanıt (debug/replay için)
);

CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_external_id
  ON autoixpert_reports(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_state
  ON autoixpert_reports(state);
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_type
  ON autoixpert_reports(type);
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_token
  ON autoixpert_reports(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_created_at
  ON autoixpert_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_external_updated_at
  ON autoixpert_reports(external_updated_at DESC); -- incremental sync için
CREATE INDEX IF NOT EXISTS idx_autoixpert_reports_responsible
  ON autoixpert_reports(responsible_assessor_id) WHERE responsible_assessor_id IS NOT NULL;

COMMENT ON TABLE autoixpert_reports IS
  'AutoiXpert Gutachten verisinin yerel aynası. Kayıt sistemi (system of record) AutoiXpert. Bu tablo read-only mirror (faz 1).';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. autoixpert_contacts — Kontakte
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS autoixpert_contacts (
  id TEXT PRIMARY KEY, -- AutoiXpert internal ID
  external_id TEXT,

  organization_type TEXT NOT NULL, -- "garage" biliniyor; CHECK koymadık (enum eksik)
  salutation TEXT,
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  email TEXT, -- birden fazla için noktalı virgülle ayrılır
  phone TEXT,
  phone2 TEXT,
  street_and_housenumber_or_lockbox TEXT,
  zip TEXT,
  city TEXT,
  notes TEXT,
  may_deduct_taxes BOOLEAN, -- nullable
  vat_id TEXT,
  debtor_number TEXT,

  -- Garage-specific (sadece organization_type='garage' için)
  -- Doc kuralı: PATCH ile element-bazında değişmez, tüm array değiştirilir
  garage_fee_sets JSONB,

  created_at TIMESTAMPTZ NOT NULL,

  -- Senkron metadata
  external_updated_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- orphan detection için
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_autoixpert_contacts_external_id
  ON autoixpert_contacts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_contacts_org_type
  ON autoixpert_contacts(organization_type);
CREATE INDEX IF NOT EXISTS idx_autoixpert_contacts_email
  ON autoixpert_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_contacts_org_name
  ON autoixpert_contacts(organization_name) WHERE organization_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_contacts_created_at
  ON autoixpert_contacts(created_at DESC);

COMMENT ON TABLE autoixpert_contacts IS
  'AutoiXpert Kontakte verisinin yerel aynası. AutoiXpert hard-delete uyguladığı için orphan detection last_seen_at ile yapılır.';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. autoixpert_invoices — Rechnungen (READ-ONLY)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS autoixpert_invoices (
  id TEXT PRIMARY KEY, -- AutoiXpert internal ID
  -- Not: Rechnungen'da external_id alanı YOK (Reports/Contacts'tan farkı)

  number TEXT, -- fatura numarası
  created_at TIMESTAMPTZ NOT NULL,
  date DATE, -- Rechnungsdatum
  date_of_supply DATE, -- Leistungsdatum

  -- Tutarlar
  vat_rate NUMERIC(6,4), -- ondalık (0.19 = %19)
  total_net NUMERIC(12,2),
  total_gross NUMERIC(12,2),

  -- Vade ve ödeme durumu
  due_date DATE,
  days_until_due INTEGER,
  has_outstanding_payments BOOLEAN,
  current_unpaid_amount NUMERIC(12,2),

  -- İptal / düzeltme
  is_fully_canceled BOOLEAN NOT NULL DEFAULT FALSE,
  ids_of_cancellation_invoices TEXT[],
  cancels_invoice_id TEXT, -- iptal faturası ise: orijinal
  is_electronic_invoice_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Konum
  location_id TEXT,

  -- JSONB: detay alt yapıların hepsi
  recipient JSONB,
  line_items JSONB,
  payments JSONB,
  short_payments JSONB,
  partial_cancellations JSONB,
  documents JSONB, -- [{id, download_url, recipient_role, type, title}]

  -- Senkron metadata
  external_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_number
  ON autoixpert_invoices(number) WHERE number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_date
  ON autoixpert_invoices(date DESC) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_created_at
  ON autoixpert_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_outstanding
  ON autoixpert_invoices(has_outstanding_payments) WHERE has_outstanding_payments = TRUE;
CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_canceled
  ON autoixpert_invoices(is_fully_canceled);
CREATE INDEX IF NOT EXISTS idx_autoixpert_invoices_cancels
  ON autoixpert_invoices(cancels_invoice_id) WHERE cancels_invoice_id IS NOT NULL;

COMMENT ON TABLE autoixpert_invoices IS
  'AutoiXpert Rechnungen aynası. AutoiXpert tarafında read-only API (POST/PUT/DELETE yok), sadece okuma.';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. autoixpert_invoice_reports — Junction (Faturalar ↔ Raporlar, N:N)
-- ═══════════════════════════════════════════════════════════════════════
-- Her fatura 1+ Gutachten'e bağlı olabilir (report_ids array AutoiXpert'te)
-- Hem array hem junction tutmak yerine: junction master, report_ids array yedek (raw_payload'da var zaten)
CREATE TABLE IF NOT EXISTS autoixpert_invoice_reports (
  invoice_id TEXT NOT NULL REFERENCES autoixpert_invoices(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL, -- Reports tablosundaki id'ye eşittir, ama FK koymuyoruz
                            -- (Gutachten silinirse bile junction kalır - data integrity için)
  PRIMARY KEY (invoice_id, report_id)
);

CREATE INDEX IF NOT EXISTS idx_autoixpert_invoice_reports_report
  ON autoixpert_invoice_reports(report_id);

COMMENT ON TABLE autoixpert_invoice_reports IS
  'Fatura ↔ Rapor N:N ilişkisi. report_id Gutachten internal ID veya external ID olabilir (AutoiXpert filtre belgesinde geçiyor).';

-- ═══════════════════════════════════════════════════════════════════════
-- 5. autoixpert_sync_log — Her import çalıştırmasının kaydı
-- ═══════════════════════════════════════════════════════════════════════
-- Resumable import için: her sayfa sonrası cursor + count buraya yazılır.
-- Kesinti olursa import son cursor'dan devam eder.
CREATE TABLE IF NOT EXISTS autoixpert_sync_log (
  id BIGSERIAL PRIMARY KEY,
  resource TEXT NOT NULL CHECK (resource IN ('reports', 'contacts', 'invoices')),
  run_id UUID NOT NULL DEFAULT uuid_generate_v4(), -- aynı çalıştırmadaki kayıtları grupla
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),

  -- İlerleme
  cursor_before TEXT, -- bu sayfaya girerken cursor (null = ilk sayfa)
  cursor_after TEXT, -- bu sayfadan sonra dönen next_page (null = son sayfa)
  page_count INTEGER, -- bu sayfada kaç kayıt geldi
  cumulative_count INTEGER, -- run başından beri toplam kayıt

  -- Filtreler (incremental sync için)
  filters JSONB, -- {"updated_at_gte": "2026-05-01T00:00:00Z"} vb.

  -- Hata bilgisi (status='failed' ise)
  error_code TEXT,
  error_message TEXT,
  error_details JSONB,

  -- Zaman
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_autoixpert_sync_log_run
  ON autoixpert_sync_log(run_id, started_at);
CREATE INDEX IF NOT EXISTS idx_autoixpert_sync_log_resource_status
  ON autoixpert_sync_log(resource, status, started_at DESC);

-- En son başarılı sync zamanını hızlı bulmak için (incremental sync filtre değeri)
CREATE OR REPLACE VIEW autoixpert_sync_status AS
  SELECT
    resource,
    MAX(started_at) FILTER (WHERE status = 'success') AS last_success_at,
    MAX(finished_at) FILTER (WHERE status = 'success' AND cursor_after IS NULL) AS last_complete_run_at,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failures
  FROM autoixpert_sync_log
  GROUP BY resource;

COMMENT ON TABLE autoixpert_sync_log IS
  'Her sayfa import işleminin kaydı. Kesintide cursor_after üzerinden resume edilir. cursor_after IS NULL = run tamamlandı.';
COMMENT ON VIEW autoixpert_sync_status IS
  'Resource bazlı son başarılı sync özeti. Faz 2 incremental sync için filtre değeri olarak kullanılır.';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. RLS — Admin-only (Faz 1)
-- ═══════════════════════════════════════════════════════════════════════
-- Service role key bypass eder; bu policy'ler frontend/anon erişim için.
-- Faz 1'de sadece admin yetkili. Mapping katmanı geldiğinde customer/lawyer/insurance
-- policy'leri ayrı ADR ile eklenecek.

ALTER TABLE autoixpert_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoixpert_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoixpert_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoixpert_invoice_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoixpert_sync_log ENABLE ROW LEVEL SECURITY;

-- Admin policy'leri (mevcut user_profiles tablosuna referansla)
CREATE POLICY autoixpert_reports_admin_all ON autoixpert_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY autoixpert_contacts_admin_all ON autoixpert_contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY autoixpert_invoices_admin_all ON autoixpert_invoices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY autoixpert_invoice_reports_admin_all ON autoixpert_invoice_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY autoixpert_sync_log_admin_all ON autoixpert_sync_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 7. Helper fonksiyonu: incremental sync için son sync zamanı
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION autoixpert_last_sync_at(p_resource TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT last_complete_run_at FROM autoixpert_sync_status WHERE resource = p_resource;
$$;

COMMENT ON FUNCTION autoixpert_last_sync_at(TEXT) IS
  'Incremental sync için: bu kaynağın son başarıyla TAMAMLANAN sync zamanı. Faz 2 cron filter değeri (updated_at_gte).';

-- ═══════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════
-- Doğrulama:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema='public' AND table_name LIKE 'autoixpert%';
-- Beklenen 5 satır: 4 tablo + 1 view.
