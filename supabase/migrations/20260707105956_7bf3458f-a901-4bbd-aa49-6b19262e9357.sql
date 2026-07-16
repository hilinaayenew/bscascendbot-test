-- Allow employer <-> any-user messaging (marketplace outreach)
CREATE POLICY "Employers can message any user"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND has_role(auth.uid(), 'employer'::app_role)
);

CREATE POLICY "Users can reply to employers"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND has_role(receiver_id, 'employer'::app_role)
);