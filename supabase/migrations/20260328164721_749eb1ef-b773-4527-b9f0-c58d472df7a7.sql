
-- Permanent audit log for account deletions
CREATE TABLE public.account_deletions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_email text NOT NULL,
  deleted_user_role text NOT NULL,
  initiated_by text NOT NULL DEFAULT 'self',
  initiated_by_admin_id uuid,
  reason text,
  email_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletions_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log
CREATE POLICY "Admins can read deletion log"
  ON public.account_deletions_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role and authenticated can insert (for self-deletion and admin-deletion)
CREATE POLICY "Authenticated can insert deletion log"
  ON public.account_deletions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
