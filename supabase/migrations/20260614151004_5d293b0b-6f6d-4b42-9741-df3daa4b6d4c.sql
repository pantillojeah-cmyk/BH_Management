
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'customer');
CREATE TYPE public.owner_approval AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_approval AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.room_status AS ENUM ('vacant', 'occupied');
CREATE TYPE public.inquiry_status AS ENUM ('new', 'responded', 'closed');
CREATE TYPE public.house_type AS ENUM ('mixed', 'male_only', 'female_only', 'family');

-- ============ UPDATED_AT TRIGGER FUNCTION ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Profile policies
CREATE POLICY "profiles_view_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "roles_view_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_insert_admin_or_self_customer" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (user_id = auth.uid() AND role IN ('customer','owner'))
  );
CREATE POLICY "roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ OWNER_STATUS ============
CREATE TABLE public.owner_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.owner_approval NOT NULL DEFAULT 'pending',
  reason TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_status TO authenticated;
GRANT ALL ON public.owner_status TO service_role;
ALTER TABLE public.owner_status ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_owner_status_updated BEFORE UPDATE ON public.owner_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "owner_status_view_self_or_admin" ON public.owner_status FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner_status_insert_self" ON public.owner_status FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_status_update_admin" ON public.owner_status FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner_status_delete_admin" ON public.owner_status FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ BOARDING_HOUSES ============
CREATE TABLE public.boarding_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  description TEXT,
  contact_number TEXT NOT NULL,
  distance_meters INTEGER NOT NULL DEFAULT 0,
  house_type public.house_type NOT NULL DEFAULT 'mixed',
  cover_photo TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  approval public.listing_approval NOT NULL DEFAULT 'pending',
  approval_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.boarding_houses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boarding_houses TO authenticated;
GRANT ALL ON public.boarding_houses TO service_role;
ALTER TABLE public.boarding_houses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_bh_updated BEFORE UPDATE ON public.boarding_houses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX bh_owner_idx ON public.boarding_houses(owner_id);
CREATE INDEX bh_approval_idx ON public.boarding_houses(approval);

CREATE POLICY "bh_view_approved_public" ON public.boarding_houses FOR SELECT TO anon
  USING (approval = 'approved');
CREATE POLICY "bh_view_authed" ON public.boarding_houses FOR SELECT TO authenticated
  USING (approval = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bh_insert_owner" ON public.boarding_houses FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "bh_update_owner_or_admin" ON public.boarding_houses FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bh_delete_owner_or_admin" ON public.boarding_houses FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ ROOMS ============
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  monthly_rent NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1,
  status public.room_status NOT NULL DEFAULT 'vacant',
  photos TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX rooms_bh_idx ON public.rooms(boarding_house_id);
CREATE INDEX rooms_status_idx ON public.rooms(status);

CREATE POLICY "rooms_view_public_if_approved" ON public.rooms FOR SELECT TO anon
  USING (EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.approval = 'approved'));
CREATE POLICY "rooms_view_authed" ON public.rooms FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND (bh.approval = 'approved' OR bh.owner_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "rooms_insert_owner" ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid()));
CREATE POLICY "rooms_update_owner_or_admin" ON public.rooms FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "rooms_delete_owner_or_admin" ON public.rooms FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============ INQUIRIES ============
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_inq_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX inq_customer_idx ON public.inquiries(customer_id);
CREATE INDEX inq_bh_idx ON public.inquiries(boarding_house_id);

CREATE POLICY "inq_view" ON public.inquiries FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "inq_insert_customer" ON public.inquiries FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "inq_update_owner_or_admin" ON public.inquiries FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.boarding_houses bh WHERE bh.id = boarding_house_id AND bh.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "inq_delete_admin_or_self" ON public.inquiries FOR DELETE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, boarding_house_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav_view_self_or_admin" ON public.favorites FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "fav_insert_self" ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "fav_delete_self" ON public.favorites FOR DELETE TO authenticated
  USING (customer_id = auth.uid());

-- ============ ACTIVITY_LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX log_created_idx ON public.activity_logs(created_at DESC);
CREATE POLICY "log_view_admin" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "log_insert_authed" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ============ SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role: customer. If signup metadata requests 'owner', also add owner + pending owner_status.
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'requested_role','') = 'owner' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.owner_status (user_id, status) VALUES (NEW.id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.boarding_houses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
