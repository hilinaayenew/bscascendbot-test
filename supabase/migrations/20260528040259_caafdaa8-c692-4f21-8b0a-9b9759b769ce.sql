REVOKE SELECT (admin_notes) ON public.mentor_details FROM authenticated;
REVOKE SELECT (admin_notes) ON public.mentor_details FROM anon;
REVOKE UPDATE (admin_notes) ON public.mentor_details FROM authenticated;
REVOKE UPDATE (admin_notes) ON public.mentor_details FROM anon;