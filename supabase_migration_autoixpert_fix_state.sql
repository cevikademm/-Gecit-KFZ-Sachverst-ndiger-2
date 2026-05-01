-- ═══════════════════════════════════════════════════════════════════════
-- FIX: autoixpert_reports.state CHECK constraint
-- ═══════════════════════════════════════════════════════════════════════
-- AutoiXpert dokümantasyonu state için 'recorded'/'locked'/'deleted' diyordu.
-- Gerçek list endpoint yanıtında ise 'done' ve 'recorded' değerleri var:
--   done     : 190 (tamamlanmış raporlar)
--   recorded : 91  (kayıt aşamasındaki raporlar)
--
-- Doküman yanlış değer adlandırmasıyla yanıltıcıydı. CHECK constraint'i
-- gerçek değerlere göre yeniden tanımlıyoruz. 'deleted' korunuyor — soft
-- delete yapılan raporlar list endpoint'te görünmüyor olabilir ama detay
-- endpoint döndüğünde gerekecek.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE autoixpert_reports
  DROP CONSTRAINT IF EXISTS autoixpert_reports_state_check;

ALTER TABLE autoixpert_reports
  ADD CONSTRAINT autoixpert_reports_state_check
  CHECK (state IN ('done', 'recorded', 'locked', 'deleted'));

-- Doğrulama (boş tabloda 0 satır döner; import sonrası tekrar koşun)
-- SELECT state, COUNT(*) FROM autoixpert_reports GROUP BY state;
