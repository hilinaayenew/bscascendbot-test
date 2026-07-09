
-- Tighten the insert policy to only allow authenticated users inserting their own deletion or admins
DROP POLICY "Authenticated can insert deletion log" ON public.account_deletions_log;

CREATE POLICY "Users can log own deletion"
  ON public.account_deletions_log FOR INSERT
  TO authenticated
  WITH CHECK (initiated_by = 'self' OR public.has_role(auth.uid(), 'admin'));
