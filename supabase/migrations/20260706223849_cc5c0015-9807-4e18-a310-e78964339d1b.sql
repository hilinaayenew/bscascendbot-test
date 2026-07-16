
CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);

GRANT SELECT, INSERT, DELETE ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments"
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users enroll themselves"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users unenroll themselves"
  ON public.course_enrollments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Backfill: auto-enroll every existing auth user in every currently published course
-- matching their role/audience. Join through auth.users to skip stale user_roles rows.
INSERT INTO public.course_enrollments (user_id, course_id)
SELECT ur.user_id, c.id
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN public.courses c ON c.published = true
WHERE (
  c.audience = 'both'
  OR (c.audience = 'mentor' AND ur.role = 'mentor')
  OR (c.audience = 'mentee' AND ur.role = 'mentee')
)
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO public.course_enrollments (user_id, course_id)
SELECT DISTINCT cic.user_id, cic.course_id
FROM public.course_item_completions cic
JOIN auth.users u ON u.id = cic.user_id
ON CONFLICT (user_id, course_id) DO NOTHING;
