
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS directory_opt_in boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Directory profiles readable by authenticated" ON public.profiles;

CREATE POLICY "Directory profiles readable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Approved mentors are publicly listable to authenticated users
  EXISTS (
    SELECT 1 FROM public.mentor_details md
    WHERE md.user_id = profiles.user_id AND md.approval_status = 'approved'
  )
  -- Mentees only appear in the directory when they have explicitly opted in
  OR (
    has_role(profiles.user_id, 'mentee'::app_role)
    AND profiles.directory_opt_in = true
  )
);
