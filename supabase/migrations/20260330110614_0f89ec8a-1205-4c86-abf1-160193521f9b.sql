-- Mentor weekly availability slots
CREATE TABLE public.mentor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage own availability" ON public.mentor_availability
  FOR ALL TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Anyone authenticated can view availability" ON public.mentor_availability
  FOR SELECT TO authenticated
  USING (true);

-- Mentor blocked dates
CREATE TABLE public.mentor_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, blocked_date)
);

ALTER TABLE public.mentor_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage own blocked dates" ON public.mentor_blocked_dates
  FOR ALL TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Anyone authenticated can view blocked dates" ON public.mentor_blocked_dates
  FOR SELECT TO authenticated
  USING (true);

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  booker_id uuid NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR booker_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (booker_id = auth.uid());

CREATE POLICY "Participants can update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR booker_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;