
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'customer');
CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.inquiry_status AS ENUM ('new', 'responded', 'closed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY 
    CASE role WHEN 'admin' THEN 1 WHEN 'owner' THEN 2 ELSE 3 END LIMIT 1;
$$;

-- Admin policy for user_roles (admins see all)
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ BOARDING HOUSES ============
CREATE TABLE public.boarding_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  contact_number TEXT NOT NULL,
  description TEXT,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  num_rooms INT NOT NULL DEFAULT 0,
  available_vacancies INT NOT NULL DEFAULT 0,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  cover_photo_url TEXT,
  status public.listing_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boarding_houses TO authenticated;
GRANT SELECT ON public.boarding_houses TO anon;
GRANT ALL ON public.boarding_houses TO service_role;
ALTER TABLE public.boarding_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views approved listings" ON public.boarding_houses FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create listings" ON public.boarding_houses FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners update own listings" ON public.boarding_houses FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete own listings" ON public.boarding_houses FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- ============ PHOTOS ============
CREATE TABLE public.boarding_house_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boarding_house_photos TO authenticated;
GRANT SELECT ON public.boarding_house_photos TO anon;
GRANT ALL ON public.boarding_house_photos TO service_role;
ALTER TABLE public.boarding_house_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos viewable by all" ON public.boarding_house_photos FOR SELECT USING (true);
CREATE POLICY "Owners manage their photos" ON public.boarding_house_photos FOR ALL USING (
  EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND (bh.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND (bh.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- ============ INQUIRIES ============
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers see own inquiries" ON public.inquiries FOR SELECT USING (
  auth.uid() = customer_id 
  OR EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Customers create inquiries" ON public.inquiries FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Owners update inquiries on their listings" ON public.inquiries FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, boarding_house_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============ ACTIVITY LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see all logs" ON public.activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============ HANDLE NEW USER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  -- assign requested role, default 'customer'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER boarding_houses_updated_at BEFORE UPDATE ON public.boarding_houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Bootstrap admin RPC ============
-- Allows the first registered user to claim admin if no admin exists yet.
CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;
  IF has_admin THEN RETURN FALSE; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
