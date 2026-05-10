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
