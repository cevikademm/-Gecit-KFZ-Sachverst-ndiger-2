-- ─────────────────────────────────────────────────────────────────────────
-- 12_musteri_bulma.sql
-- Müşteri Bulma — Apify Google Maps scraper ile bulunan işletme/müşteri adayları.
-- Dedup anahtarı: place_id (Google Place ID). RLS: yalnızca admin / super_admin.
-- Bağımlılıklar: 05_triggers_and_functions.sql → public.set_updated_at(), public.is_admin()
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.musteri_adaylari (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id         TEXT UNIQUE,                       -- Google Place ID — deduplication
  isim             TEXT NOT NULL,
  kategori         TEXT,
  adres            TEXT,
  sehir            TEXT,
  ulke             TEXT,
  telefon          TEXT,
  email            TEXT,
  website          TEXT,
  puan             NUMERIC(2,1),                      -- Google puanı (0.0–5.0)
  yorum_sayisi     INT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  google_maps_url  TEXT,
  durum            TEXT DEFAULT 'acik'                -- işletme durumu
                   CHECK (durum IN ('acik','kapali','gecici_kapali')),
  lead_durumu      TEXT DEFAULT 'yeni'                -- satış hunisi durumu
                   CHECK (lead_durumu IN ('yeni','iletisimde','musteri','elendi')),
  mail_durumu      TEXT DEFAULT 'gonderilmedi'
                   CHECK (mail_durumu IN ('gonderilmedi','gonderildi','hata')),
  mail_gonderim_at TIMESTAMPTZ,
  yanit_kategorisi TEXT,                              -- ilgili/ilgisiz/fiyat_soruyor/randevu_istiyor/red/diger
  notlar           TEXT,
  arama_kategori   TEXT,                              -- bu adayın geldiği arama kategorisi
  arama_konum      TEXT,                              -- bu adayın geldiği arama konumu (şehir, ülke)
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.musteri_adaylari IS 'Apify Google Maps ile bulunan müşteri/işletme adayları (lead). Müşteri Bulma sekmesi.';

-- ── İndeksler ──
CREATE INDEX IF NOT EXISTS musteri_adaylari_lead_idx  ON public.musteri_adaylari (lead_durumu);
CREATE INDEX IF NOT EXISTS musteri_adaylari_sehir_idx ON public.musteri_adaylari (sehir);
CREATE INDEX IF NOT EXISTS musteri_adaylari_email_idx ON public.musteri_adaylari (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS musteri_adaylari_created_idx ON public.musteri_adaylari (created_at DESC);

-- ── updated_at trigger (genel fonksiyon) ──
DROP TRIGGER IF EXISTS trg_musteri_adaylari_updated_at ON public.musteri_adaylari;
CREATE TRIGGER trg_musteri_adaylari_updated_at
  BEFORE UPDATE ON public.musteri_adaylari
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: yalnızca admin / super_admin tam erişim ──
ALTER TABLE public.musteri_adaylari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS musteri_adaylari_admin_all ON public.musteri_adaylari;
CREATE POLICY musteri_adaylari_admin_all ON public.musteri_adaylari
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Realtime (opsiyonel — diğer tablolarla tutarlı olması için)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.musteri_adaylari;
