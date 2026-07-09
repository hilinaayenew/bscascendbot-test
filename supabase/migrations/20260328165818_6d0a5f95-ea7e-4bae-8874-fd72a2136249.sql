
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Session logs (references pairings)
  DELETE FROM public.session_logs WHERE logged_by = target_user_id
    OR pairing_id IN (SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id);

  -- 2. Goals (references pairings)
  DELETE FROM public.goals WHERE pairing_id IN (
    SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id
  );

  -- 3. Messages
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;

  -- 4. Pairings
  DELETE FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id;

  -- 5. Course progress
  DELETE FROM public.course_progress WHERE user_id = target_user_id;

  -- 6. Mentor details
  DELETE FROM public.mentor_details WHERE user_id = target_user_id;

  -- 7. User roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- 8. Discount codes — clear redemption
  UPDATE public.discount_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE redeemed_by = target_user_id;

  -- 9. Email unsubscribe tokens (by email, before profile deletion)
  DELETE FROM public.email_unsubscribe_tokens WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );

  -- 10. Suppressed emails (by email, before profile deletion)
  DELETE FROM public.suppressed_emails WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );

  -- 11. Profile — after email-based lookups
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  -- 12. Auth user — LAST
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
