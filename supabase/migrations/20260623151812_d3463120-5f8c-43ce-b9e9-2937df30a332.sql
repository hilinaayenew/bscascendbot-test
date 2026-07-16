-- Allow any authenticated user to message the BSC Admin (system account),
-- and allow admins to read those threads.

CREATE POLICY "Users can message BSC Admin"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND receiver_id = '00000000-0000-0000-0000-000000000001'::uuid
);

CREATE POLICY "Admins can view BSC Admin threads"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND (
    sender_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR receiver_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

CREATE POLICY "Admins can mark BSC Admin messages read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND receiver_id = '00000000-0000-0000-0000-000000000001'::uuid
);
