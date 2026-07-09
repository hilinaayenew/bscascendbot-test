CREATE OR REPLACE FUNCTION public.was_email_invited(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.email_send_log
    WHERE template_name = 'mentor-pool-invite'
      AND lower(recipient_email) = lower(check_email)
      AND status <> 'failed'
  )
$$;

REVOKE ALL ON FUNCTION public.was_email_invited(text) FROM public;
GRANT EXECUTE ON FUNCTION public.was_email_invited(text) TO authenticated;