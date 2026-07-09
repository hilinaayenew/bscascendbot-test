
-- Blocked emails table
CREATE TABLE public.blocked_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  blocked_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked emails"
  ON public.blocked_emails FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can read blocked emails"
  ON public.blocked_emails FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

-- Function to check if email is blocked (used during signup)
CREATE OR REPLACE FUNCTION public.is_email_blocked(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_emails WHERE lower(email) = lower(check_email)
  )
$$;

-- Function to delete a user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete session logs
  DELETE FROM public.session_logs WHERE logged_by = target_user_id
    OR pairing_id IN (SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id);
  
  -- Delete goals
  DELETE FROM public.goals WHERE pairing_id IN (
    SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id
  );
  
  -- Delete messages
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  
  -- Delete pairings
  DELETE FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id;
  
  -- Delete course progress
  DELETE FROM public.course_progress WHERE user_id = target_user_id;
  
  -- Delete mentor details
  DELETE FROM public.mentor_details WHERE user_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Delete discount code redemptions (clear redeemed_by)
  UPDATE public.discount_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE redeemed_by = target_user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Delete the auth user
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute to authenticated users for self-deletion
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_blocked(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_blocked(text) TO authenticated;
