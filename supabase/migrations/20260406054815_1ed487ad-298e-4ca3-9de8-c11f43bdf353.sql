
CREATE OR REPLACE FUNCTION public.validate_booking_slot_status()
RETURNS trigger LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('available', 'booked', 'blocked') THEN
    RAISE EXCEPTION 'Invalid booking slot status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
