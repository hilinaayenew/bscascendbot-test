
-- COURSES
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL DEFAULT 'both' CHECK (audience IN ('mentor','mentee','both')),
  cohort_label TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published courses"
  ON public.courses FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHECKLIST ITEMS
CREATE TABLE public.course_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  target_role TEXT NOT NULL DEFAULT 'both' CHECK (target_role IN ('mentor','mentee','both')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_checklist_items_course ON public.course_checklist_items(course_id, sort_order);

ALTER TABLE public.course_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view items of published courses"
  ON public.course_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published = true OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Admins manage checklist items"
  ON public.course_checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER course_checklist_items_updated_at
  BEFORE UPDATE ON public.course_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COMPLETIONS
CREATE TABLE public.course_item_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.course_checklist_items(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX idx_completions_user ON public.course_item_completions(user_id);
CREATE INDEX idx_completions_course ON public.course_item_completions(course_id);

ALTER TABLE public.course_item_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own completions"
  ON public.course_item_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own completions"
  ON public.course_item_completions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own completions"
  ON public.course_item_completions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- WORKSHOPS
CREATE TABLE public.workshops_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'workshop' CHECK (type IN ('workshop','group_session','one_on_one')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  link TEXT,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all','mentor','mentee')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workshops_starts_at ON public.workshops_sessions(starts_at);

ALTER TABLE public.workshops_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view workshops"
  ON public.workshops_sessions FOR SELECT TO authenticated
  USING (
    visibility = 'all'
    OR (visibility = 'mentor' AND public.has_role(auth.uid(), 'mentor'))
    OR (visibility = 'mentee' AND public.has_role(auth.uid(), 'mentee'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage workshops"
  ON public.workshops_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER workshops_sessions_updated_at
  BEFORE UPDATE ON public.workshops_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED: Cohort V Onboarding
WITH new_course AS (
  INSERT INTO public.courses (title, description, audience, cohort_label, published)
  VALUES (
    'Welcome to the Because She Can Mentorship Program — Cohort V Onboarding',
    'Complete each step below to get fully set up in the program. Your mentor/mentee is depending on you to show up prepared.',
    'both',
    'Cohort V',
    true
  )
  RETURNING id
)
INSERT INTO public.course_checklist_items (course_id, title, description, target_role, sort_order)
SELECT id, t.title, t.description, t.target_role, t.sort_order
FROM new_course, (VALUES
  -- Mentor items
  ('Confirm your mentee pairing', 'Visit the Pairings page and confirm the mentee you''ve been paired with.', 'mentor', 1),
  ('Reach out to your mentee to introduce yourself', 'Send a friendly intro message via the Messages tab to kick things off.', 'mentor', 2),
  ('Sign the Mentor Agreement Form and submit it', 'Open the form, complete it, and submit. (Admin will paste the form link here.)', 'mentor', 3),
  ('Read the Mentor Handbook', 'Review the handbook so you know what''s expected. (Admin will paste the link here.)', 'mentor', 4),
  ('Join the Onboarding Call', 'Attend the cohort onboarding call. Details in the Sessions & Workshops section.', 'mentor', 5),
  ('Create an Action Plan with your mentee', 'Work with your mentee on a 12-week action plan covering their goals and milestones.', 'mentor', 6),
  -- Mentee items
  ('Confirm your mentor pairing', 'Visit the Pairings page and confirm the mentor you''ve been paired with.', 'mentee', 1),
  ('Reach out to your mentor to introduce yourself', 'Send a friendly intro message via the Messages tab.', 'mentee', 2),
  ('Sign the Mentee Agreement Form and submit it', 'Open the form, complete it, and submit. (Admin will paste the form link here.)', 'mentee', 3),
  ('Read the Mentee Handbook', 'Review the handbook before your first session. (Admin will paste the link here.)', 'mentee', 4),
  ('Join the Onboarding Call', 'Attend the cohort onboarding call. Details in the Sessions & Workshops section.', 'mentee', 5),
  ('Review the Action Plan created with your mentor', 'Read through the action plan, ask questions, and get aligned on goals.', 'mentee', 6)
) AS t(title, description, target_role, sort_order);
