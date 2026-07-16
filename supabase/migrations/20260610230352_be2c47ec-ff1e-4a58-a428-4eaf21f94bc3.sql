REVOKE SELECT ON public.bookings FROM anon, authenticated;

GRANT SELECT (
  id, mentor_id, booker_id, booking_date, start_time, end_time,
  timezone, title, notes, status, reminder_sent, created_at, updated_at,
  slot_id
) ON public.bookings TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_booking_cancel_token(p_booking_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cancel_token::text
  FROM public.bookings
  WHERE id = p_booking_id
    AND booker_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_booking_cancel_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_booking_cancel_token(uuid) TO authenticated;