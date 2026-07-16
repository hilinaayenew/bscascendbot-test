CREATE TABLE public.workshop_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_ratings TO authenticated;
GRANT ALL ON public.workshop_ratings TO service_role;

ALTER TABLE public.workshop_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ratings or admins all"
ON public.workshop_ratings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own ratings"
ON public.workshop_ratings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_mentor_or_mentee(auth.uid()));

CREATE POLICY "Users update own ratings"
ON public.workshop_ratings FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own ratings or admins"
ON public.workshop_ratings FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_workshop_ratings_updated_at
BEFORE UPDATE ON public.workshop_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();