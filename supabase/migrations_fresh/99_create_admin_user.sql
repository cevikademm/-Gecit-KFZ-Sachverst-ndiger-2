-- Admin kullanıcı oluştur — gecit.kfz.sachverstaendiger@gmail.com
-- Hem auth.users hem auth.identities satırı, ardından user_profiles role=super_admin.
-- Idempotent: aynı e-posta zaten varsa update eder.

DO $$
DECLARE
  v_user_id uuid;
  v_email   text := 'gecit.kfz.sachverstaendiger@gmail.com';
  v_password text := 'Veligecit1980#';
BEGIN
  -- Mevcut user var mı kontrol et
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Yeni user oluştur
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rohat Gecit"}'::jsonb,
      false,
      '', '', '', ''
    );

    -- auth.identities (login için zorunlu)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      v_user_id::text,
      NOW(), NOW(), NOW()
    );

    RAISE NOTICE 'Yeni kullanıcı oluşturuldu: % (%)', v_email, v_user_id;
  ELSE
    -- Mevcut kullanıcı: şifreyi güncelle
    UPDATE auth.users
       SET encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           updated_at         = NOW(),
           raw_app_meta_data  = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb
     WHERE id = v_user_id;
    RAISE NOTICE 'Kullanıcı zaten vardı, şifre güncellendi: % (%)', v_email, v_user_id;
  END IF;

  -- user_profiles satırı yoksa ekle, varsa role=super_admin yap.
  -- (handle_new_user trigger'ı varsa otomatik eklenmiş olabilir.)
  INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (v_user_id, v_email, 'Rohat Gecit', 'super_admin', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET role       = 'super_admin',
        email      = EXCLUDED.email,
        full_name  = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
        updated_at = NOW();

  RAISE NOTICE 'user_profiles → role=super_admin atandı.';
END $$;

-- Doğrulama
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS confirmed,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE u.email = 'gecit.kfz.sachverstaendiger@gmail.com';
