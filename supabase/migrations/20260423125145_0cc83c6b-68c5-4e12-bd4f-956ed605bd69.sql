-- Helper: generate a unique slug for usernames
CREATE OR REPLACE FUNCTION public.generate_unique_username(seed text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 0;
BEGIN
  -- Lowercase, replace non-alphanumerics with hyphens, trim
  base := lower(coalesce(seed, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');

  IF base IS NULL OR length(base) = 0 THEN
    base := 'user';
  END IF;

  -- Cap base length
  IF length(base) > 40 THEN
    base := substring(base from 1 for 40);
    base := regexp_replace(base, '-+$', '', 'g');
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$$;

-- Update handle_new_user to also assign a username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_seed text;
  v_username text;
BEGIN
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
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: assign usernames to every profile missing one
DO $$
DECLARE
  r record;
  seed text;
BEGIN
  FOR r IN
    SELECT user_id, full_name, email
    FROM public.profiles
    WHERE username IS NULL OR length(trim(username)) = 0
    ORDER BY created_at
  LOOP
    seed := NULLIF(r.full_name, '');
    IF seed IS NULL THEN
      seed := split_part(COALESCE(r.email, ''), '@', 1);
    END IF;
    UPDATE public.profiles
    SET username = public.generate_unique_username(seed)
    WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username)
  WHERE username IS NOT NULL;