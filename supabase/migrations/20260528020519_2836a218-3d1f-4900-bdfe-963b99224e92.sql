
-- Helper: check if user is mentor or mentee
CREATE OR REPLACE FUNCTION public.is_mentor_or_mentee(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('mentor'::app_role, 'mentee'::app_role)
  )
$$;

-- 1. forum_channels
CREATE TABLE public.forum_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_general boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX forum_channels_one_general ON public.forum_channels (is_general) WHERE is_general = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_channels TO authenticated;
GRANT ALL ON public.forum_channels TO service_role;

ALTER TABLE public.forum_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view channels"
ON public.forum_channels FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage channels"
ON public.forum_channels FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_forum_channels_updated_at
BEFORE UPDATE ON public.forum_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. forum_channel_members
CREATE TABLE public.forum_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.forum_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  UNIQUE(channel_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_channel_members TO authenticated;
GRANT ALL ON public.forum_channel_members TO service_role;

ALTER TABLE public.forum_channel_members ENABLE ROW LEVEL SECURITY;

-- Helper: approved member check (used by post policies via SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_channel_approved_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forum_channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id AND status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM public.forum_channels WHERE id = _channel_id AND is_general = true
  )
$$;

CREATE POLICY "Users view own membership"
ON public.forum_channel_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users request own membership"
ON public.forum_channel_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND public.is_mentor_or_mentee(auth.uid())
);

CREATE POLICY "Admins manage memberships"
ON public.forum_channel_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. forum_posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.forum_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_posts_channel_idx ON public.forum_posts (channel_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view posts"
ON public.forum_posts FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (public.is_mentor_or_mentee(auth.uid()) AND public.is_channel_approved_member(channel_id, auth.uid()))
);

CREATE POLICY "Members create own posts"
ON public.forum_posts FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_mentor_or_mentee(auth.uid())
  AND public.is_channel_approved_member(channel_id, auth.uid())
);

CREATE POLICY "Authors delete own posts"
ON public.forum_posts FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Seed General channel
INSERT INTO public.forum_channels (name, slug, description, is_general)
VALUES ('General', 'general', 'Open community for everyone on Ascendency — say hi, share wins, ask questions.', true)
ON CONFLICT (slug) DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
