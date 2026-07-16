
CREATE OR REPLACE FUNCTION public.can_book()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.mentor_details
        WHERE user_id = auth.uid() AND approval_status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.discount_codes
        WHERE redeemed_by = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_book() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_book() TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can create bookings" ON public.bookings;

CREATE POLICY "Authenticated can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (booker_id = auth.uid() AND public.can_book());
