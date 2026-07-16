-- Create public.admin_get_profile_contacts function if it does not exist
CREATE OR REPLACE FUNCTION public.admin_get_profile_contacts(_user_ids uuid[] DEFAULT NULL)
RETURNS TABLE(email text, full_name text, phone text, user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security guard: must be admin to access contact info
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.email::text, 
    p.full_name::text, 
    p.phone::text, 
    p.user_id
  FROM public.profiles p
  WHERE _user_ids IS NULL 
     OR p.user_id = ANY(_user_ids);
END;
$$;

-- 1) Revoke direct EXECUTE on admin_get_profile_contacts so column-level REVOKE on profiles.email/phone can't be bypassed by any authenticated user. Function still has internal has_role() guard.
REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM authenticated;


-- 2) Enforce email-blocklist server-side at signup. Replaces reliance on client-side RPC check
-- which fails open because is_email_blocked EXECUTE was revoked.
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
  -- Server-side blocklist enforcement (cannot be bypassed by clients)
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
  END IF;

  RETURN NEW;
END;
$function$;