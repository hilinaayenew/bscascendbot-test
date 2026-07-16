
-- Restrict UPDATE on bookings: add WITH CHECK and a trigger preventing changes to sensitive fields.

DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;

CREATE POLICY "Participants can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING ((mentor_id = auth.uid()) OR (booker_id = auth.uid()))
WITH CHECK ((mentor_id = auth.uid()) OR (booker_id = auth.uid()));

-- Trigger enforces immutability of sensitive fields and status transition rules.
CREATE OR REPLACE FUNCTION public.enforce_booking_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and service role bypass.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Immutable identity / scheduling / token fields for participants.
  IF NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.booker_id IS DISTINCT FROM OLD.booker_id
     OR NEW.booking_date IS DISTINCT FROM OLD.booking_date
     OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time
     OR NEW.cancel_token IS DISTINCT FROM OLD.cancel_token
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected booking fields';
  END IF;

  -- Status: only allow forward transition confirmed -> cancelled.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_booking_update_rules ON public.bookings;
CREATE TRIGGER enforce_booking_update_rules
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_update_rules();
