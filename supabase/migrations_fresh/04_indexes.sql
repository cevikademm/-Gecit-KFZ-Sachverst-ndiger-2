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
