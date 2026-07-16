-- Revoke column-level SELECT on sensitive contact fields from broad roles.
-- email/phone must only be accessed via SECURITY DEFINER RPCs
-- (get_my_contact_info for self, admin_get_profile_contacts for admins).
REVOKE SELECT (email, phone) ON public.profiles FROM authenticated;
REVOKE SELECT (email, phone) ON public.profiles FROM anon;

-- Re-grant SELECT on all other (non-sensitive) columns to authenticated so
-- existing profile reads continue to work under RLS.
GRANT SELECT (
  id, user_id, full_name, country, username, portfolio_url,
  pathway_level, interests, expertise, linkedin_url, bio, avatar_url,
  created_at, updated_at
) ON public.profiles TO authenticated;

-- service_role keeps full access (for edge functions / admin RPCs).
GRANT ALL ON public.profiles TO service_role;