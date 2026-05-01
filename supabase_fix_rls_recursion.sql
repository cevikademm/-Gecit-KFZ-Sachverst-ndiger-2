-- ═══════════════════════════════════════════════════════════════════════
-- KRİTİK FIX: RLS recursion (stack depth limit exceeded)
-- ═══════════════════════════════════════════════════════════════════════
-- Sorun:
--   is_admin() fonksiyonu user_profiles'tan okuyor (RLS politikası
--   evaluate edilirken tekrar is_admin çağrılıyor → sonsuz döngü).
--
-- Çözüm:
--   is_admin()'i SECURITY DEFINER yap — fonksiyon sahibinin yetkisiyle
--   çalışır, RLS'i bypass eder. Böylece user_profiles policy'si
--   is_admin() çağırdığında recursion olmaz.
--
-- Çalıştırma:
--   Supabase SQL Editor > yapıştır > Run
-- ═══════════════════════════════════════════════════════════════════════

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

-- Function'ın owner privilege ile çalıştığını doğrula
COMMENT ON FUNCTION is_admin() IS
  'RLS helper. SECURITY DEFINER: fonksiyon sahibinin yetkisi ile çalışır, user_profiles tablosundaki RLS bypass edilir. Aksi takdirde policy evaluation recursion olur.';

-- Doğrulama: function metadata
SELECT proname, prosecdef AS security_definer, provolatile
FROM pg_proc
WHERE proname = 'is_admin';
-- Beklenen: security_definer = true, provolatile = 's' (stable)
