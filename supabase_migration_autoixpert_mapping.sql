-- ═══════════════════════════════════════════════════════════════════════
-- AutoiXpert Mapping — customer_autoixpert_links
-- ═══════════════════════════════════════════════════════════════════════
-- Mevcut Gecit customers tablosu ile autoixpert_contacts arasinda eslesme
-- tablosu. Auto-match script (scripts/autoixpert/match-contacts.js)
-- otomatik dolduracak; admin manuel olarak duzenleyebilir.
--
-- Kullanim:
--   Bu SQL'i Supabase Dashboard > SQL Editor'e yapistir > Run
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_autoixpert_links (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  autoixpert_contact_id TEXT NOT NULL REFERENCES autoixpert_contacts(id) ON DELETE CASCADE,
  match_method TEXT NOT NULL CHECK (match_method IN ('email', 'phone', 'name_company', 'manual')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE, -- admin onayladi mi
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT, -- 'auto-match' veya admin email
  PRIMARY KEY (customer_id, autoixpert_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_cax_links_contact ON customer_autoixpert_links(autoixpert_contact_id);
CREATE INDEX IF NOT EXISTS idx_cax_links_method ON customer_autoixpert_links(match_method, confidence DESC);

ALTER TABLE customer_autoixpert_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cax_links_admin_all ON customer_autoixpert_links;
CREATE POLICY cax_links_admin_all ON customer_autoixpert_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

COMMENT ON TABLE customer_autoixpert_links IS
  'Gecit customers ↔ autoixpert_contacts eslesme tablosu. Otomatik match veya manuel.';

-- ═══════════════════════════════════════════════════════════════════════
-- JSONB performans indeksleri (mevcut autoixpert_reports tablosu icin)
-- Musteri detayinda email ile rapor arama icin gerekli.
-- ═══════════════════════════════════════════════════════════════════════

-- Claimant email uzerinde arama (en yaygin party)
CREATE INDEX IF NOT EXISTS idx_axreports_claimant_email
  ON autoixpert_reports ((claimant->>'email'))
  WHERE claimant->>'email' IS NOT NULL;

-- Author of damage email
CREATE INDEX IF NOT EXISTS idx_axreports_aod_email
  ON autoixpert_reports ((author_of_damage->>'email'))
  WHERE author_of_damage->>'email' IS NOT NULL;

-- Owner of claimants car email
CREATE INDEX IF NOT EXISTS idx_axreports_oocc_email
  ON autoixpert_reports ((owner_of_claimants_car->>'email'))
  WHERE owner_of_claimants_car->>'email' IS NOT NULL;

-- Invoice recipient email
CREATE INDEX IF NOT EXISTS idx_axinvoices_recipient_email
  ON autoixpert_invoices ((recipient->>'email'))
  WHERE recipient->>'email' IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- Helper fonksiyon: bir musteri icin autoixpert raporlarini bul
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION autoixpert_reports_for_customer(p_customer_id TEXT)
RETURNS SETOF autoixpert_reports
LANGUAGE sql
STABLE
AS $$
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
  -- Veya direkt customer email match (mapping table boş bile olsa çalışır)
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
LANGUAGE sql
STABLE
AS $$
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

COMMENT ON FUNCTION autoixpert_reports_for_customer(TEXT) IS
  'Bir Gecit musterisi icin AutoiXpert Gutachten listesi. Once mapping tablosundan, sonra direkt email karsilastirmasi.';
COMMENT ON FUNCTION autoixpert_invoices_for_customer(TEXT) IS
  'Bir Gecit musterisi icin AutoiXpert faturalari.';

-- ═══════════════════════════════════════════════════════════════════════
-- Match istatistik view (admin paneli icin)
-- ═══════════════════════════════════════════════════════════════════════
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

COMMENT ON VIEW customer_autoixpert_match_stats IS
  'Her Gecit musterisi icin AutoiXpert link istatistikleri.';
