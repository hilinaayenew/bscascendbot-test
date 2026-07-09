CREATE OR REPLACE FUNCTION public.admin_get_invited_mentor_emails()
RETURNS TABLE(recipient_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT DISTINCT lower(l.recipient_email)::text
  FROM public.email_send_log l
  WHERE l.template_name = 'mentor-pool-invite'
    AND l.status <> 'failed';
END;
$$;