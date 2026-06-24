-- ═══════════════════════════════════════════════════════════════
-- Müşteri Bulma — Arama (Call) durumu + İletişim Geçmişi
-- ───────────────────────────────────────────────────────────────
-- musteri_adaylari tablosuna:
--   - arama_durumu   : işletme arandı mı? (aranmadi/arandi/ulasilamadi)
--   - arandi_at      : en son arandığı an
--   - son_iletisim_at: en son mail/arama anı (sıralama için)
--   - iletisim_gecmisi (JSONB): müşteri kartında gösterilen geçmiş
--       [{ tip:'mail'|'arama', konu, ozet, durum, at }]
--
-- ÇALIŞTIRMA: Supabase Dashboard → SQL Editor → yapıştır → RUN
-- GÜVENLİ: idempotent (ADD COLUMN IF NOT EXISTS), nullable, tekrar çalıştırılabilir.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.musteri_adaylari
  ADD COLUMN IF NOT EXISTS arama_durumu TEXT DEFAULT 'aranmadi'
    CHECK (arama_durumu IN ('aranmadi', 'arandi', 'ulasilamadi'));

ALTER TABLE public.musteri_adaylari ADD COLUMN IF NOT EXISTS arandi_at       TIMESTAMPTZ;
ALTER TABLE public.musteri_adaylari ADD COLUMN IF NOT EXISTS son_iletisim_at TIMESTAMPTZ;
ALTER TABLE public.musteri_adaylari ADD COLUMN IF NOT EXISTS iletisim_gecmisi JSONB NOT NULL DEFAULT '[]'::jsonb;

-- PostgREST şema cache'ini tazele
NOTIFY pgrst, 'reload schema';

-- Doğrulama:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='musteri_adaylari'
--   AND column_name IN ('arama_durumu','arandi_at','son_iletisim_at','iletisim_gecmisi');
