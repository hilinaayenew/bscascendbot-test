REVOKE SELECT ON public.mentor_details FROM anon, authenticated;
GRANT SELECT (id, user_id, hourly_rate, availability, specializations, years_experience, approval_status, created_at, updated_at, meeting_link) ON public.mentor_details TO authenticated;
GRANT ALL ON public.mentor_details TO service_role;