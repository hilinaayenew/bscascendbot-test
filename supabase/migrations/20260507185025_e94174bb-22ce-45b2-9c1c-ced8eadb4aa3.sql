
-- Public directory view: approved mentors + mentees, no PII (email/phone excluded)
CREATE OR REPLACE VIEW public.profiles_directory
WITH (security_invoker=off) AS
SELECT
  p.user_id,
  p.full_name,
  p.bio,
  p.expertise,
  p.interests,
  p.pathway_level,
  p.avatar_url,
  p.country,
  p.username,
  CASE WHEN md.user_id IS NOT NULL THEN 'mentor' ELSE 'mentee' END AS role
FROM public.profiles p
LEFT JOIN public.mentor_details md
  ON md.user_id = p.user_id AND md.approval_status = 'approved'
WHERE
  md.user_id IS NOT NULL
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'mentee'
  );

REVOKE ALL ON public.profiles_directory FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_directory TO authenticated;
