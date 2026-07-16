-- Remove broad table-level read access that makes every profile column readable.
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;

-- Keep directory/profile reads limited to non-sensitive public profile fields only.
GRANT SELECT (
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  linkedin_url,
  expertise,
  interests,
  pathway_level,
  created_at,
  updated_at,
  portfolio_url,
  username,
  country
) ON public.profiles TO authenticated;

-- Keep backend/admin service access intact for secure server-side workflows.
GRANT ALL ON TABLE public.profiles TO service_role;

-- Ensure contact details continue to be available only through security-definer functions.
GRANT EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) TO authenticated;

COMMENT ON COLUMN public.profiles.email IS 'Sensitive contact field: do not grant broad SELECT. Use get_my_contact_info for self or admin_get_profile_contacts for admins.';
COMMENT ON COLUMN public.profiles.phone IS 'Sensitive contact field: do not grant broad SELECT. Use get_my_contact_info for self or admin_get_profile_contacts for admins.';