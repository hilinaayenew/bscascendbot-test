
-- 1. delete_user_account: owner or admin only
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> target_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.session_logs WHERE logged_by = target_user_id
    OR pairing_id IN (SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id);
  DELETE FROM public.goals WHERE pairing_id IN (
    SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id
  );
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id;
  DELETE FROM public.course_progress WHERE user_id = target_user_id;
  DELETE FROM public.mentor_details WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  UPDATE public.discount_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE redeemed_by = target_user_id;
  DELETE FROM public.email_unsubscribe_tokens WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );
  DELETE FROM public.suppressed_emails WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$;

-- 2. send_system_message: admin only
CREATE OR REPLACE FUNCTION public.send_system_message(p_receiver_id uuid, p_content text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  system_sender_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  caller uuid := auth.uid();
BEGIN
  -- Allow when invoked from another SECURITY DEFINER trigger (no auth uid),
  -- otherwise require admin role.
  IF caller IS NOT NULL AND NOT public.has_role(caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = system_sender_id) THEN
    INSERT INTO public.messages (sender_id, receiver_id, content, read)
    VALUES (system_sender_id, p_receiver_id, p_content, false);
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.send_system_message(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_system_message(uuid, text) TO authenticated;

-- 3. was_email_invited: admin only
CREATE OR REPLACE FUNCTION public.was_email_invited(check_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.email_send_log
    WHERE template_name = 'mentor-pool-invite'
      AND lower(recipient_email) = lower(check_email)
      AND status <> 'failed'
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.was_email_invited(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.was_email_invited(text) TO authenticated;

-- 4. mentor_details.admin_notes: hide from non-admins via column privilege
REVOKE SELECT (admin_notes) ON public.mentor_details FROM authenticated, anon;

-- 5. discount_codes: only see your own redemptions; admin still sees all
DROP POLICY IF EXISTS "Authenticated can check codes" ON public.discount_codes;
CREATE POLICY "Users see own redemptions"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (redeemed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 6. session_logs: insert only if member of the pairing
DROP POLICY IF EXISTS "Pairing members can create session logs" ON public.session_logs;
CREATE POLICY "Pairing members can create session logs"
ON public.session_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = logged_by
  AND EXISTS (
    SELECT 1 FROM public.pairings p
    WHERE p.id = session_logs.pairing_id
      AND (p.mentor_id = auth.uid() OR p.mentee_id = auth.uid())
  )
);

-- 7. Set search_path on functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path TO 'public';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path TO 'public';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path TO 'public';
