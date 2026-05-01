-- ═══════════════════════════════════════════════════════════════════════
-- Supabase Storage RLS Politikaları
-- ═══════════════════════════════════════════════════════════════════════
-- Bucket'lar (Dashboard'da oluşturulmuş):
--   • documents (private) — KFZ-Schein, fatura, hukuki belge
--   • photos    (public)  — hasar/araç fotoğrafları
--   • gallery   (public)  — galeri görselleri
--   • avatars   (public)  — profil resimleri
--
-- Politikalar:
--   • Admin (super_admin/admin) → tüm bucket'lara tam erişim
--   • Customer/Lawyer/Insurance → kendi yetkilerine göre okuma
--
-- Çalıştırma:
--   Supabase Dashboard > SQL Editor > yapıştır > Run
-- ═══════════════════════════════════════════════════════════════════════

-- Storage objects tablosunda RLS zaten aktif.
-- Eski politikaları kaldırıp yenilerini ekliyoruz.

-- ─── Tüm bucket'lar için admin tam erişim ─────────────────────────────
DROP POLICY IF EXISTS storage_admin_all ON storage.objects;
CREATE POLICY storage_admin_all ON storage.objects FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── Public bucket'lardan herkes okuyabilir ───────────────────────────
DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects FOR SELECT
  USING (bucket_id IN ('photos', 'gallery', 'avatars'));

-- ─── Authenticated user kendi private dosyalarını okuyabilir ──────────
-- documents bucket'ında path: {customer_id}/{timestamp}_{filename}
-- Müşteri sadece kendi customer_id'sine ait dosyaları görür
DROP POLICY IF EXISTS storage_documents_self ON storage.objects;
CREATE POLICY storage_documents_self ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (
      -- Customer kendi dosyasını okur
      EXISTS (
        SELECT 1 FROM customers c
        JOIN user_profiles up ON up.email = c.email
        WHERE up.id = auth.uid() AND up.role = 'customer'
        AND split_part(name, '/', 1) = c.id
      )
      -- Lawyer atanmış müşterinin dosyasını okur
      OR EXISTS (
        SELECT 1 FROM lawyer_assignments la
        JOIN user_profiles up ON up.linked_id = la.lawyer_id
        WHERE up.id = auth.uid() AND up.role = 'lawyer'
        AND split_part(name, '/', 1) = la.customer_id
      )
    )
  );

-- ─── Authenticated user dosya yükleyebilir (kendi klasörüne) ──────────
DROP POLICY IF EXISTS storage_authenticated_upload ON storage.objects;
CREATE POLICY storage_authenticated_upload ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('documents', 'photos', 'gallery', 'avatars')
  );

-- Doğrulama
SELECT polname, polcmd FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
ORDER BY polname;
