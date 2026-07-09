-- Add delete policies for availability management
CREATE POLICY "Mentors can delete own availability" ON public.mentor_availability
  FOR DELETE TO authenticated
  USING (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete own blocked dates" ON public.mentor_blocked_dates
  FOR DELETE TO authenticated
  USING (mentor_id = auth.uid());