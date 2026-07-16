
ALTER TABLE public.pairings  ADD COLUMN IF NOT EXISTS meeting_room text UNIQUE;
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS meeting_room text UNIQUE;

ALTER TABLE public.session_logs
  ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS started_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at    timestamptz,
  ADD COLUMN IF NOT EXISTS booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

ALTER TABLE public.session_logs ALTER COLUMN pairing_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_logs_source_chk') THEN
    ALTER TABLE public.session_logs
      ADD CONSTRAINT session_logs_source_chk CHECK (source IN ('manual','in_app'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_logs_link_chk') THEN
    ALTER TABLE public.session_logs
      ADD CONSTRAINT session_logs_link_chk CHECK (pairing_id IS NOT NULL OR booking_id IS NOT NULL);
  END IF;
END $$;

DROP POLICY IF EXISTS "Pairing members can view session logs" ON public.session_logs;
CREATE POLICY "Participants and admins can view session logs"
  ON public.session_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (pairing_id IS NOT NULL AND EXISTS (
         SELECT 1 FROM public.pairings p
         WHERE p.id = session_logs.pairing_id
           AND (p.mentor_id = auth.uid() OR p.mentee_id = auth.uid())))
    OR (booking_id IS NOT NULL AND EXISTS (
         SELECT 1 FROM public.bookings b
         WHERE b.id = session_logs.booking_id
           AND (b.mentor_id = auth.uid() OR b.booker_id = auth.uid())))
  );

CREATE OR REPLACE FUNCTION public._new_meeting_room()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'ascend-' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

CREATE OR REPLACE FUNCTION public.get_pairing_meeting_room(p_pairing_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_room text; v_status text; v_mentor uuid; v_mentee uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT meeting_room, status::text, mentor_id, mentee_id
    INTO v_room, v_status, v_mentor, v_mentee
    FROM public.pairings WHERE id = p_pairing_id;
  IF v_mentor IS NULL THEN RAISE EXCEPTION 'Pairing not found'; END IF;
  IF v_user <> v_mentor AND v_user <> v_mentee THEN
    RAISE EXCEPTION 'Not authorized for this pairing';
  END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Pairing is not active'; END IF;
  IF v_room IS NULL THEN
    v_room := public._new_meeting_room();
    UPDATE public.pairings SET meeting_room = v_room WHERE id = p_pairing_id;
  END IF;
  RETURN v_room;
END; $$;

CREATE OR REPLACE FUNCTION public.get_booking_meeting_room(p_booking_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_room text; v_status text; v_mentor uuid; v_booker uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT meeting_room, status, mentor_id, booker_id
    INTO v_room, v_status, v_mentor, v_booker
    FROM public.bookings WHERE id = p_booking_id;
  IF v_mentor IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_user <> v_mentor AND v_user <> v_booker THEN
    RAISE EXCEPTION 'Not authorized for this booking';
  END IF;
  IF v_status <> 'confirmed' THEN RAISE EXCEPTION 'Booking is not confirmed'; END IF;
  IF v_room IS NULL THEN
    v_room := public._new_meeting_room();
    UPDATE public.bookings SET meeting_room = v_room WHERE id = p_booking_id;
  END IF;
  RETURN v_room;
END; $$;

CREATE OR REPLACE FUNCTION public.log_in_app_session(
  p_pairing_id uuid, p_booking_id uuid,
  p_started_at timestamptz, p_ended_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_authorized boolean := false;
  v_duration_min int;
  v_id uuid;
  v_existing uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_pairing_id IS NULL AND p_booking_id IS NULL THEN
    RAISE EXCEPTION 'Must provide pairing_id or booking_id'; END IF;
  IF p_started_at IS NULL OR p_ended_at IS NULL OR p_ended_at <= p_started_at THEN
    RAISE EXCEPTION 'Invalid session timestamps'; END IF;

  IF p_pairing_id IS NOT NULL THEN
    SELECT TRUE INTO v_authorized FROM public.pairings p
      WHERE p.id = p_pairing_id AND (p.mentor_id = v_user OR p.mentee_id = v_user);
  END IF;
  IF NOT COALESCE(v_authorized, false) AND p_booking_id IS NOT NULL THEN
    SELECT TRUE INTO v_authorized FROM public.bookings b
      WHERE b.id = p_booking_id AND (b.mentor_id = v_user OR b.booker_id = v_user);
  END IF;
  IF NOT COALESCE(v_authorized, false) THEN
    RAISE EXCEPTION 'Not authorized to log this session'; END IF;

  v_duration_min := GREATEST(1, (EXTRACT(EPOCH FROM (p_ended_at - p_started_at)) / 60)::int);

  SELECT id INTO v_existing FROM public.session_logs
    WHERE source = 'in_app' AND logged_by = v_user
      AND ((p_pairing_id IS NOT NULL AND pairing_id = p_pairing_id)
        OR (p_booking_id IS NOT NULL AND booking_id = p_booking_id))
      AND started_at IS NOT NULL
      AND abs(EXTRACT(EPOCH FROM (started_at - p_started_at))) < 300
    LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  INSERT INTO public.session_logs (
    pairing_id, booking_id, logged_by, session_date,
    duration_minutes, notes, source, started_at, ended_at
  ) VALUES (
    p_pairing_id, p_booking_id, v_user, (p_started_at AT TIME ZONE 'UTC')::date,
    v_duration_min, NULL, 'in_app', p_started_at, p_ended_at
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.get_pairing_meeting_room(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_booking_meeting_room(uuid) FROM public;
REVOKE ALL ON FUNCTION public.log_in_app_session(uuid, uuid, timestamptz, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.get_pairing_meeting_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_meeting_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_in_app_session(uuid, uuid, timestamptz, timestamptz) TO authenticated;
