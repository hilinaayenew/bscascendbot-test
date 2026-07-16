-- Projects (Project Wall) table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  slide_urls TEXT[] NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  video_embed_url TEXT,
  external_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  featured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX projects_featured_idx ON public.projects(is_featured, featured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT: visible to authenticated users unless hidden; owner + admin always see
CREATE POLICY "Projects viewable by authenticated"
ON public.projects FOR SELECT TO authenticated
USING (
  is_hidden = false
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: mentees only, submitting for themselves
CREATE POLICY "Mentees can insert own projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'mentee'::app_role)
);

-- UPDATE own
CREATE POLICY "Owners can update own projects"
ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE own
CREATE POLICY "Owners can delete own projects"
ON public.projects FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admin manage all
CREATE POLICY "Admins can update any project"
ON public.projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any project"
ON public.projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger: prevent non-admins from setting is_featured / is_hidden / featured_at,
-- and maintain featured_at + updated_at.
CREATE OR REPLACE FUNCTION public.enforce_project_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  is_admin boolean := caller IS NOT NULL AND public.has_role(caller, 'admin'::app_role);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.is_featured := false;
      NEW.is_hidden := false;
      NEW.featured_at := NULL;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT is_admin THEN
      NEW.is_featured := OLD.is_featured;
      NEW.is_hidden := OLD.is_hidden;
      NEW.featured_at := OLD.featured_at;
    ELSE
      IF NEW.is_featured = true AND OLD.is_featured = false THEN
        NEW.featured_at := now();
      ELSIF NEW.is_featured = false THEN
        NEW.featured_at := NULL;
      END IF;
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_enforce_rules
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.enforce_project_update_rules();
