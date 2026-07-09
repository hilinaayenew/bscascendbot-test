DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view role directory"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);