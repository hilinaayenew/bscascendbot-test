
-- 1. Restrict phone & email columns on profiles from direct table reads
REVOKE SELECT (phone, email) ON public.profiles FROM anon, authenticated;

-- Owner self-fetch RPC for own contact info
CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE(email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email, phone FROM public.profiles WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_contact_info() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;

-- 2. account_deletions_log: tighten WITH CHECK
DROP POLICY IF EXISTS "Users can log own deletion" ON public.account_deletions_log;
CREATE POLICY "Users can log own deletion" ON public.account_deletions_log
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    initiated_by = 'self'
    AND initiated_by_admin_id IS NULL
    AND lower(deleted_email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  )
);

-- 3. messages: require pairing or booking relationship or admin (system sender bypasses via SECURITY DEFINER function)
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.pairings p
      WHERE (p.mentor_id = auth.uid() AND p.mentee_id = receiver_id)
         OR (p.mentee_id = auth.uid() AND p.mentor_id = receiver_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.mentor_id = auth.uid() AND b.booker_id = receiver_id)
         OR (b.booker_id = auth.uid() AND b.mentor_id = receiver_id)
    )
  )
);

-- 4. Recreate directory views as security_invoker so they respect the caller's RLS
ALTER VIEW IF EXISTS public.profiles_directory SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker = true);

-- 5. Revoke EXECUTE on internal SECURITY DEFINER functions from the API roles
REVOKE EXECUTE ON FUNCTION public.send_system_message(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_unique_username(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_blocked(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.was_email_invited(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_invited_mentor_emails() FROM PUBLIC, anon;
-- REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mentors_last_sign_in() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_discount_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- 6. Avatars bucket: remove broad listing policy. Public CDN reads of known URLs continue to work
-- because the bucket is marked is_public=true; only enumeration via PostgREST is blocked.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Owners and admins can list avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role))
);
