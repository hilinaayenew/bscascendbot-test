REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(_user_ids uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_profile_contacts(_user_ids uuid[]) FROM anon, authenticated;