-- 1) Remove direct column access to email and phone on profiles for client roles
REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated;

-- 2) Lock down trigger-only / internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_mentor_signup_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_mentor_approval_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_system_message(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_unique_username(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_blocked(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.was_email_invited(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_invited_mentor_emails() FROM PUBLIC, anon;
-- REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mentors_last_sign_in() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_discount_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_contact_info() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;