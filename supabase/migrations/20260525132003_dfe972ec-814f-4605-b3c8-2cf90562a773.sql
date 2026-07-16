DROP POLICY IF EXISTS "Directory profiles readable by authenticated" ON public.profiles;

CREATE POLICY "Directory profiles readable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_details md
    WHERE md.user_id = profiles.user_id
      AND md.approval_status = 'approved'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id
      AND ur.role = 'mentee'::app_role
  )
);

-- Ensure authenticated users can execute has_role globally for other RLS policies that depend on it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;