
-- 1. Remove bookings from realtime publication (frontend will refetch on dialog open)
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;

-- 2. Restrict sensitive columns on mentor_details
REVOKE SELECT (meeting_link, hourly_rate) ON public.mentor_details FROM anon, authenticated;

-- 3. Owner-scoped RPC to fetch own meeting link
CREATE OR REPLACE FUNCTION public.get_my_mentor_meeting_link()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT meeting_link FROM public.mentor_details WHERE user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_mentor_meeting_link() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_mentor_meeting_link() TO authenticated;
