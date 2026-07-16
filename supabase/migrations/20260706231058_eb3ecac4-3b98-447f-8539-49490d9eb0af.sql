
-- Add employer to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employer';

-- ============================================================
-- employer_details
-- ============================================================
CREATE TABLE public.employer_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  seat_limit INT NOT NULL DEFAULT 10,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_details TO authenticated;
GRANT ALL ON public.employer_details TO service_role;

ALTER TABLE public.employer_details ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_employer_details_updated_at
  BEFORE UPDATE ON public.employer_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- employer_team_members  (defined before helper functions and other RLS that reference it)
-- ============================================================
CREATE TABLE public.employer_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_details(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_id UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employer_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_team_members TO authenticated;
GRANT ALL ON public.employer_team_members TO service_role;

ALTER TABLE public.employer_team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: employer_for_user
--   Returns the employer_details.id for a user acting as owner OR team member.
-- ============================================================
CREATE OR REPLACE FUNCTION public.employer_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employer_details WHERE user_id = _user_id
  UNION ALL
  SELECT employer_id FROM public.employer_team_members WHERE user_id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_employer_member(_employer_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employer_details WHERE id = _employer_id AND user_id = _user_id
    UNION ALL
    SELECT 1 FROM public.employer_team_members WHERE employer_id = _employer_id AND user_id = _user_id
  );
$$;

-- employer_details policies (now that helpers exist)
CREATE POLICY "Owner or team can view employer details"
  ON public.employer_details FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_employer_member(id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Employer creates own details"
  ON public.employer_details FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employer updates own details"
  ON public.employer_details FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employer deletes own details"
  ON public.employer_details FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- employer_team_members policies
CREATE POLICY "Employer or member views team"
  ON public.employer_team_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Employer inserts team members"
  ON public.employer_team_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR user_id = auth.uid()  -- allow accept-invite RPC context where user adds self
  );

CREATE POLICY "Employer removes team members"
  ON public.employer_team_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- employer_courses
-- ============================================================
CREATE TABLE public.employer_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_details(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_courses TO authenticated;
GRANT ALL ON public.employer_courses TO service_role;

ALTER TABLE public.employer_courses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_employer_courses_updated_at
  BEFORE UPDATE ON public.employer_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "View employer courses"
  ON public.employer_courses FOR SELECT TO authenticated
  USING (
    -- owner
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    -- public + published to any signed-in learner
    OR (visibility = 'public' AND published = true)
    -- private + published to team members
    OR (visibility = 'private' AND published = true AND public.is_employer_member(employer_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Employer manages own courses"
  ON public.employer_courses FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
  );

CREATE POLICY "Employer updates own courses"
  ON public.employer_courses FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Employer deletes own courses"
  ON public.employer_courses FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- employer_course_enrollments
-- ============================================================
CREATE TABLE public.employer_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.employer_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (course_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_course_enrollments TO authenticated;
GRANT ALL ON public.employer_course_enrollments TO service_role;

ALTER TABLE public.employer_course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View enrollments as self or course owner"
  ON public.employer_course_enrollments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.employer_courses c
      JOIN public.employer_details e ON e.id = c.employer_id
      WHERE c.id = course_id AND e.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "User enrolls self in visible course"
  ON public.employer_course_enrollments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.employer_courses c
      WHERE c.id = course_id
        AND c.published = true
        AND (
          c.visibility = 'public'
          OR public.is_employer_member(c.employer_id, auth.uid())
          OR EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = c.employer_id AND e.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "User updates own enrollment"
  ON public.employer_course_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "User unenrolls self or owner removes"
  ON public.employer_course_enrollments FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.employer_courses c
      JOIN public.employer_details e ON e.id = c.employer_id
      WHERE c.id = course_id AND e.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- employer_team_invites
-- ============================================================
CREATE TABLE public.employer_team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_details(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE (employer_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_team_invites TO authenticated;
GRANT ALL ON public.employer_team_invites TO service_role;

ALTER TABLE public.employer_team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer manages own invites"
  ON public.employer_team_invites FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR accepted_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Employer creates invites"
  ON public.employer_team_invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
  );

CREATE POLICY "Employer updates own invites"
  ON public.employer_team_invites FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (true);

CREATE POLICY "Employer deletes own invites"
  ON public.employer_team_invites FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employer_details e WHERE e.id = employer_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- Accept invite RPC (public token lookup)
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_employer_invite(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_invite RECORD;
  v_seat_count INT;
  v_seat_limit INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('status','error','reason','not_authenticated');
  END IF;

  SELECT i.* INTO v_invite
    FROM public.employer_team_invites i
    WHERE i.token = p_token
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','revoked');
  END IF;

  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_accepted');
  END IF;

  SELECT COUNT(*), MAX(e.seat_limit)
    INTO v_seat_count, v_seat_limit
    FROM public.employer_team_members m
    JOIN public.employer_details e ON e.id = m.employer_id
    WHERE m.employer_id = v_invite.employer_id;

  IF v_seat_limit IS NULL THEN
    SELECT seat_limit INTO v_seat_limit FROM public.employer_details WHERE id = v_invite.employer_id;
  END IF;

  IF v_seat_count >= v_seat_limit THEN
    RETURN jsonb_build_object('status','no_seats');
  END IF;

  INSERT INTO public.employer_team_members (employer_id, user_id, invite_id)
    VALUES (v_invite.employer_id, v_user, v_invite.id)
    ON CONFLICT (employer_id, user_id) DO NOTHING;

  UPDATE public.employer_team_invites
    SET accepted_at = now(), accepted_user_id = v_user
    WHERE id = v_invite.id;

  RETURN jsonb_build_object('status','accepted','employer_id', v_invite.employer_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_employer_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_employer_invite(UUID) TO authenticated;

-- ============================================================
-- Extend handle_new_user for employer signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_seed text;
  v_username text;
BEGIN
  IF NEW.email IS NOT NULL AND public.is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Email address is not permitted to register' USING ERRCODE = '22023';
  END IF;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_seed := NULLIF(v_full_name, '');
  IF v_seed IS NULL THEN
    v_seed := split_part(COALESCE(NEW.email, ''), '@', 1);
  END IF;
  v_username := public.generate_unique_username(v_seed);

  INSERT INTO public.profiles (user_id, full_name, email, country, username)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    NEW.raw_user_meta_data->>'country',
    v_username
  );

  IF NEW.raw_user_meta_data->>'role' = 'mentor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentor');
    INSERT INTO public.mentor_details (user_id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'mentee' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentee');
  ELSIF NEW.raw_user_meta_data->>'role' = 'employer' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employer');
    INSERT INTO public.employer_details (user_id, company_name)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', v_full_name));
  END IF;

  RETURN NEW;
END;
$function$;
