
-- Create a function to get mentor last login times, restricted to admins
CREATE OR REPLACE FUNCTION public.get_mentors_last_sign_in()
RETURNS TABLE (user_id uuid, last_sign_in_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  RETURN QUERY
  SELECT u.id, u.last_sign_in_at
  FROM auth.users u
  JOIN public.user_roles r ON u.id = r.user_id
  WHERE r.role = 'mentor';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mentors_last_sign_in() TO authenticated;
