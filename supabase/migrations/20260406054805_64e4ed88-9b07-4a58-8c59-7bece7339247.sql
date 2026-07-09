
-- Add timezone column to mentor_availability
ALTER TABLE public.mentor_availability ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Create mentor_booking_settings table
CREATE TABLE IF NOT EXISTS public.mentor_booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL UNIQUE,
  session_duration integer NOT NULL DEFAULT 30,
  buffer_minutes integer NOT NULL DEFAULT 0,
  max_bookings_per_day integer NOT NULL DEFAULT 4,
  minimum_notice text NOT NULL DEFAULT '1 day',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage own booking settings" ON public.mentor_booking_settings
  FOR ALL TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Anyone authenticated can view booking settings" ON public.mentor_booking_settings
  FOR SELECT TO authenticated
  USING (true);

-- Create booking_slots table
CREATE TABLE IF NOT EXISTS public.booking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_booking_slot_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('available', 'booked', 'blocked') THEN
    RAISE EXCEPTION 'Invalid booking slot status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_booking_slot_status
  BEFORE INSERT OR UPDATE ON public.booking_slots
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_slot_status();

ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view slots" ON public.booking_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mentors can manage own slots" ON public.booking_slots
  FOR ALL TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Service role full access to slots" ON public.booking_slots
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add new columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.booking_slots(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS title text DEFAULT 'Mentorship session';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancel_token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Create unique index on cancel_token
CREATE UNIQUE INDEX IF NOT EXISTS bookings_cancel_token_idx ON public.bookings(cancel_token) WHERE cancel_token IS NOT NULL;

-- Add username column to profiles for public booking links
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username) WHERE username IS NOT NULL;
