
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-00000000a001';
  admin_email text := 'admin@zdspgc.local';
  admin_pw text := 'Admin@12345';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id OR email = admin_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      admin_email, crypt(admin_pw, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Administrator"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
      'email', admin_id::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (admin_id, 'System Administrator', admin_email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
