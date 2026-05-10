-- =====================================================================
-- 02 — CORE TABLES (çekirdek tablolar)
-- =====================================================================
-- Amaç: Uygulamanın ana tabloları (kullanıcılar, müşteriler, araçlar,
--       ekspertizler, faturalar, randevular).
-- Sıra: 2/8
-- Idempotent: Evet (CREATE TABLE IF NOT EXISTS)
-- UYARI:    Bu dosya mevcut verilere DOKUNMAZ. Sıfırdan kurulumda
--           kullanıcı verisi YOKTUR (auth.users zaten Supabase yönetiminde).
-- Bağımlılık: 01_extensions_and_enums.sql ÖNCEDEN çalıştırılmış olmalı.
-- =====================================================================

-- ─── 2.1 user_profiles — Supabase auth.users uzantısı ────────────────
-- Notlar:
--   • id auth.users(id) ile bağlı (CASCADE delete).
--   • role, ana yetki kontrolü için kullanılıyor (RLS policy'lerinde).
--   • linked_id, customer/lawyer/insurance kayıtlarına opsiyonel bağ.
--   • created_at/updated_at için trigger 05_triggers'ta tanımlanır.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT        NOT NULL DEFAULT 'customer'
                           CHECK (role IN ('super_admin', 'admin', 'customer', 'lawyer', 'insurance')),
  phone        TEXT,
  company      TEXT,
  avatar_url   TEXT,
  linked_id    TEXT,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.user_profiles IS 'auth.users uzantısı — rol ve profil verisi.';
COMMENT ON COLUMN public.user_profiles.linked_id IS 'customer/lawyer/insurance.id''ye opsiyonel bağ (TEXT tip, çünkü bu tablolar kendi prefix''li ID kullanır).';

-- ─── 2.2 customers — Müşteriler (bireysel + kurumsal) ────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id          TEXT        PRIMARY KEY DEFAULT 'c' || substr(md5(random()::text), 1, 7),
  full_name   TEXT,
  company     TEXT,
  email       TEXT        UNIQUE NOT NULL,
  phone       TEXT,
  type        TEXT        DEFAULT 'bireysel' CHECK (type IN ('bireysel', 'kurumsal')),
  tax_id      TEXT,
  tax_no      TEXT,
  tax_office  TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.customers IS 'Bireysel ve kurumsal müşteriler.';

-- ─── 2.3 vehicles — Araçlar ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id          TEXT        PRIMARY KEY DEFAULT 'v' || substr(md5(random()::text), 1, 7),
  owner_id    TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plate       TEXT        NOT NULL,
  brand       TEXT,
  model       TEXT,
  year        INTEGER,
  chassis     TEXT,
  km          INTEGER,
  color       TEXT,
  fuel        TEXT,
  engine_cc   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vehicles IS 'Müşterilere bağlı araçlar.';

-- ─── 2.4 appraisals — Ekspertizler (Gutachten) ───────────────────────
CREATE TABLE IF NOT EXISTS public.appraisals (
  id          TEXT        PRIMARY KEY DEFAULT 'ap' || substr(md5(random()::text), 1, 7),
  vehicle_id  TEXT        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  status      TEXT        DEFAULT 'bekliyor'
                          CHECK (status IN ('bekliyor', 'teslim_alindi', 'inceleniyor',
                                            'rapor_yaziliyor', 'tamamlandi',
                                            'mekanik', 'kaporta', 'rapor')),
  date        TEXT,
  expert      TEXT,
  notes       TEXT,
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.appraisals IS 'Ekspertiz raporları (yerel / AutoiXpert öncesi).';

-- ─── 2.5 paint_maps — Boya haritaları (1:1 araç) ─────────────────────
CREATE TABLE IF NOT EXISTS public.paint_maps (
  vehicle_id  TEXT        PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2.6 invoices — Yerel faturalar ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id           TEXT        PRIMARY KEY DEFAULT 'inv' || substr(md5(random()::text), 1, 7),
  customer_id  TEXT        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  no           TEXT        UNIQUE NOT NULL,
  date         TEXT,
  amount       NUMERIC(12,2) DEFAULT 0,
  status       TEXT        DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'ödendi', 'iptal')),
  items        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2.7 appointments — Randevular ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id           TEXT        PRIMARY KEY DEFAULT 'apt' || substr(md5(random()::text), 1, 7),
  customer_id  TEXT        REFERENCES public.customers(id) ON DELETE SET NULL,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  plate        TEXT,
  service      TEXT,
  date         TEXT        NOT NULL,
  time         TEXT,
  status       TEXT        DEFAULT 'aktif' CHECK (status IN ('aktif', 'bekliyor', 'onaylandi', 'iptal', 'tamamlandi')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Doğrulama ───────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'customers', 'vehicles', 'appraisals',
                     'paint_maps', 'invoices', 'appointments')
ORDER BY table_name;
-- Beklenen: 7 satır
