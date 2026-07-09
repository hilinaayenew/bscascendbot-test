
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'mentor', 'mentee');

-- Mentor approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Pairing status
CREATE TYPE public.pairing_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  pathway_level TEXT DEFAULT 'curious',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Mentor details (proposed by mentor, approved by admin)
CREATE TABLE public.mentor_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2),
  availability JSONB DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved mentors visible to all authenticated" ON public.mentor_details FOR SELECT TO authenticated USING (approval_status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mentors can update own details" ON public.mentor_details FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Mentors can insert own details" ON public.mentor_details FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any mentor details" ON public.mentor_details FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mentor_details_updated_at BEFORE UPDATE ON public.mentor_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pairings
CREATE TABLE public.pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status pairing_status NOT NULL DEFAULT 'pending',
  matched_by TEXT DEFAULT 'manual',
  ai_match_score DECIMAL(5,2),
  ai_match_reason TEXT,
  admin_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pairings" ON public.pairings FOR SELECT TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage pairings" ON public.pairings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can request pairing" ON public.pairings FOR INSERT TO authenticated WITH CHECK (auth.uid() = mentee_id);

CREATE TRIGGER update_pairings_updated_at BEFORE UPDATE ON public.pairings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pairing_id UUID REFERENCES public.pairings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Session logs
CREATE TABLE public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL REFERENCES public.pairings(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pairing members can view session logs" ON public.session_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pairings p WHERE p.id = pairing_id AND (p.mentor_id = auth.uid() OR p.mentee_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Pairing members can create session logs" ON public.session_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = logged_by);

-- Goals & milestones
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL REFERENCES public.pairings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pairing members can view goals" ON public.goals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pairings p WHERE p.id = pairing_id AND (p.mentor_id = auth.uid() OR p.mentee_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Pairing members can manage goals" ON public.goals FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pairings p WHERE p.id = pairing_id AND (p.mentor_id = auth.uid() OR p.mentee_id = auth.uid()))
);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  -- Assign role from metadata
  IF NEW.raw_user_meta_data->>'role' = 'mentor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentor');
    INSERT INTO public.mentor_details (user_id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'mentee' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentee');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
