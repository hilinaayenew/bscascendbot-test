
DROP POLICY IF EXISTS "Directory profiles readable by authenticated" ON public.profiles;

CREATE POLICY "Approved mentor profiles readable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_details md
    WHERE md.user_id = profiles.user_id
      AND md.approval_status = 'approved'::approval_status
  )
);

CREATE POLICY "Mentors can view paired mentee profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(profiles.user_id, 'mentee'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.pairings p
    WHERE p.mentor_id = auth.uid()
      AND p.mentee_id = profiles.user_id
  )
);
