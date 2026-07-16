
-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('mentor','mentee')),
  content text NOT NULL,
  display_on_homepage boolean NOT NULL DEFAULT false,
  consent_promotional boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view homepage testimonials"
  ON public.testimonials FOR SELECT
  USING (display_on_homepage = true);

CREATE POLICY "Users can view own testimonial"
  ON public.testimonials FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors and mentees can create own testimonial"
  ON public.testimonials FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_mentor_or_mentee(auth.uid()));

CREATE POLICY "Users can update own testimonial"
  ON public.testimonials FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users or admins can delete testimonials"
  ON public.testimonials FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FEEDBACK QUESTIONS
CREATE TABLE public.feedback_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role text NOT NULL CHECK (target_role IN ('mentor','mentee','both')),
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'text' CHECK (question_type IN ('text','rating')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_questions TO authenticated;
GRANT ALL ON public.feedback_questions TO service_role;

ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active questions"
  ON public.feedback_questions FOR SELECT TO authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage questions"
  ON public.feedback_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feedback_questions_updated_at
  BEFORE UPDATE ON public.feedback_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FEEDBACK RESPONSES
CREATE TABLE public.feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('mentor','mentee')),
  period_month date NOT NULL, -- first day of month, e.g. 2026-05-01
  answers jsonb NOT NULL DEFAULT '{}'::jsonb, -- { question_id: value }
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_responses TO authenticated;
GRANT ALL ON public.feedback_responses TO service_role;

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own feedback"
  ON public.feedback_responses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users submit own feedback"
  ON public.feedback_responses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_mentor_or_mentee(auth.uid()));

CREATE POLICY "Users update own feedback"
  ON public.feedback_responses FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage feedback responses"
  ON public.feedback_responses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feedback_responses_updated_at
  BEFORE UPDATE ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default questions
INSERT INTO public.feedback_questions (target_role, question, question_type, sort_order) VALUES
  ('both', 'How would you rate your overall experience this month?', 'rating', 1),
  ('mentor', 'How engaged were your mentees this month?', 'rating', 2),
  ('mentor', 'What challenges did you face mentoring this month?', 'text', 3),
  ('mentor', 'What is one thing we could do to better support you as a mentor?', 'text', 4),
  ('mentee', 'How valuable were your sessions this month?', 'rating', 2),
  ('mentee', 'What progress have you made toward your goals this month?', 'text', 3),
  ('mentee', 'What is one thing we could do to make Ascendency more valuable for you?', 'text', 4),
  ('both', 'Any other comments, ideas, or feedback for the Ascendency team?', 'text', 5);
