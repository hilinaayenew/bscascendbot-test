-- Revoke broad table-level SELECT/UPDATE then re-grant on every column EXCEPT admin_notes
REVOKE SELECT, UPDATE ON public.mentor_details FROM authenticated;
REVOKE SELECT, UPDATE ON public.mentor_details FROM anon;

GRANT SELECT (id, user_id, hourly_rate, availability, meeting_link, approval_status, years_experience, specializations, created_at, updated_at)
  ON public.mentor_details TO authenticated;

GRANT UPDATE (hourly_rate, availability, meeting_link, years_experience, specializations, updated_at)
  ON public.mentor_details TO authenticated;

-- service_role keeps full access (admins act via service role / SECURITY DEFINER paths)
GRANT ALL ON public.mentor_details TO service_role;