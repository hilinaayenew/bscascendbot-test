-- Allow users to message system accounts (AI Coach and BSC Coordinator)
-- without requiring an existing pairing or booking relationship.
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    -- Allow messaging system accounts directly
    OR receiver_id IN (
      '00000000-0000-0000-0000-000000000001',  -- BSC Coordinator
      '00000000-0000-0000-0000-000000000002'   -- AI Career Coach
    )
    OR EXISTS (
      SELECT 1 FROM public.pairings p
      WHERE (p.mentor_id = auth.uid() AND p.mentee_id = receiver_id)
         OR (p.mentee_id = auth.uid() AND p.mentor_id = receiver_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.mentor_id = auth.uid() AND b.booker_id = receiver_id)
         OR (b.booker_id = auth.uid() AND b.mentor_id = receiver_id)
    )
  )
);
