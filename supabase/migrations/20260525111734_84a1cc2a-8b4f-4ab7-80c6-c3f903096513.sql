
-- 1) Tighten user_roles SELECT: own row or admin only
DROP POLICY IF EXISTS "Authenticated users can view role directory" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) SECURITY DEFINER RPC for directory needs (e.g. Explore page)
CREATE OR REPLACE FUNCTION public.get_user_ids_with_role(_role app_role)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = _role;
$$;

REVOKE ALL ON FUNCTION public.get_user_ids_with_role(app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_ids_with_role(app_role) TO authenticated;

-- 3) Tighten pairings INSERT — prevent mentee self-approval
DROP POLICY IF EXISTS "Authenticated can request pairing" ON public.pairings;

CREATE POLICY "Mentees can request pairing"
ON public.pairings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = mentee_id
  AND status = 'pending'::pairing_status
  AND admin_approved = false
  AND (matched_by IS NULL OR matched_by IN ('manual', 'ai'))
);

-- 4) Remove bookings from realtime publication (broadcasts cancel_token)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings';
  END IF;
END$$;
