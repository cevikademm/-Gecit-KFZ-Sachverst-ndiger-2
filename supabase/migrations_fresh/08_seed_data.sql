-- =====================================================================
-- 08 — SEED DATA (başlangıç verileri — OPSİYONEL)
-- =====================================================================
-- Amaç: Boş veritabanını çalışır duruma getirmek için minimal seed.
-- Sıra: 8/8
-- Idempotent: Evet (ON CONFLICT DO NOTHING)
-- UYARI:    Bu dosya OPSİYONEL'dir. Mevcut prod verisi varsa
--           çalıştırmayın — anti-idempotent satırlar OLMAMASINA rağmen
--           sembolik veri ekler.
-- =====================================================================
--
-- BU DOSYA NE YAPAR?
--   1. Default itiraz şablonları (3 adet) ekler.
--   2. Default WhatsApp şablonları (2 adet) ekler.
--   3. Default file_flow trigger'ları (1 adet) ekler.
--
-- BU DOSYA NE YAPMAZ?
--   • auth.users / user_profiles satırı oluşturmaz — bu Supabase Dashboard
--     üzerinden manuel yapılır (veya client-side signUp).
--   • Müşteri/araç/ekspertiz seed'i eklemez (gerçek veri orada olacak).
--   • Şifre/credential atamaz.
--
-- ADMIN HESABI NASIL OLUŞTURULUR?
--   1. Supabase Dashboard → Authentication → Users → Add user
--   2. E-posta + şifre gir → Create user
--   3. handle_new_user trigger'ı user_profiles satırını otomatik oluşturur (role='customer').
--   4. SQL Editor'de role'ü yükselt:
--        UPDATE public.user_profiles
--        SET role = 'super_admin'
--        WHERE email = 'admin@gecit-kfz.de';
-- =====================================================================

-- ─── 8.1 Objection templates (itiraz şablonları) ─────────────────────
INSERT INTO public.objection_templates (id, title, category, content) VALUES
  ('ot_default_1', 'Standart Red İtirazı',
   'red_itiraz',
   'Sehr geehrte Damen und Herren,

mit Schreiben vom [DATUM] haben Sie unseren Schadensanspruch zu Aktenzeichen [AKTENZEICHEN] zurückgewiesen. Hiergegen legen wir hiermit Widerspruch ein.

Begründung:
[BEGRUENDUNG]

Wir bitten um erneute Prüfung des Falls und Bestätigung der Schadensregulierung innerhalb von 14 Tagen.

Mit freundlichen Grüßen
Gecit KFZ Sachverständiger'),
  ('ot_default_2', 'Düşük Teklif İtirazı',
   'dusuk_teklif',
   'Sehr geehrte Damen und Herren,

das mit Schreiben vom [DATUM] zugestellte Angebot in Höhe von [BETRAG] EUR weicht erheblich von unserem Sachverständigengutachten ab.

Im Gutachten ermittelter Schaden: [SCHADEN] EUR
Differenz: [DIFFERENZ] EUR

Wir fordern eine Anpassung auf den im Gutachten festgestellten Betrag.

Mit freundlichen Grüßen'),
  ('ot_default_3', 'Mahkeme İtiraz Dilekçesi',
   'mahkeme',
   '[MAHKEME] Mahkemesi Sayın Hakimliğine,

Davacı: [MUSTERI_AD]
Davalı: [SIGORTA_SIRKETI]
Konu:   Sigorta tazminatı talebi

Açıklamalar:
[ACIKLAMA]

Sonuç ve İstem: Davalı sigorta şirketi tarafından eksik ödenen [TUTAR] EUR tutarındaki tazminatın yasal faiziyle birlikte ödenmesine karar verilmesini saygılarımla arz ve talep ederim.')
ON CONFLICT (id) DO NOTHING;

-- ─── 8.2 WhatsApp şablonları ─────────────────────────────────────────
INSERT INTO public.whatsapp_templates (id, name, message, trigger, active) VALUES
  ('wt_default_1', 'Randevu Hatırlatma',
   'Merhaba [AD], yarın saat [SAAT] için Gecit KFZ Sachverständiger ekspertizinde randevunuz var. Plaka: [PLAKA]. Görüşmek üzere!',
   'appointment_reminder', TRUE),
  ('wt_default_2', 'Ekspertiz Tamamlandı',
   'Merhaba [AD], aracınızın ekspertiz raporu hazır. Müşteri panelinden indirebilirsiniz: [LINK]',
   'appraisal_complete', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── 8.3 File flow (otomasyon) ───────────────────────────────────────
INSERT INTO public.file_flows (id, trigger, actions, label, active) VALUES
  ('ff_default_1',
   'appraisal_complete',
   ARRAY['notify_customer', 'send_whatsapp', 'log_activity'],
   'Ekspertiz Tamamlandı Akışı',
   TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── Doğrulama ───────────────────────────────────────────────────────
SELECT 'objection_templates' AS tablo, COUNT(*) AS kayit_sayisi FROM public.objection_templates
UNION ALL
SELECT 'whatsapp_templates', COUNT(*) FROM public.whatsapp_templates
UNION ALL
SELECT 'file_flows', COUNT(*) FROM public.file_flows;
-- Beklenen: 3 + 2 + 1 = 6 satır

-- =====================================================================
-- KURULUM SONRASI YAPILMASI GEREKENLER
-- =====================================================================
-- 1. Supabase Dashboard → Authentication → Providers → Email aktif et.
-- 2. İlk admin kullanıcıyı oluştur (yukarıdaki not).
-- 3. Frontend .env dosyasını güncelle:
--      VITE_SUPABASE_URL=https://pbugramfltkoyqcldghk.supabase.co
--      VITE_SUPABASE_ANON_KEY=<anon_key>
-- 4. Storage bucket'larında dosya boyutu / MIME tip ayarlarını kontrol et.
-- 5. Realtime ayarlarında "Replication" tabını ziyaret edip
--    publication'ın aktif olduğunu doğrula.
-- =====================================================================
