
DROP POLICY IF EXISTS "Mentors can view paired mentee profiles" ON public.profiles;
DROP POLICY IF EXISTS "Approved mentor profiles readable by authenticated" ON public.profiles;

CREATE POLICY "Directory profiles readable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_details md
    WHERE md.user_id = profiles.user_id
      AND md.approval_status = 'approved'::approval_status
  )
  OR public.has_role(profiles.user_id, 'mentee'::app_role)
);
