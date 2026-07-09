-- Fix user_roles SELECT policy to restrict read access
DROP POLICY IF EXISTS "Authenticated users can view role directory" ON public.user_roles;

CREATE POLICY "Users can view own roles or admins can view all"
ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Fix pairings INSERT policy to enforce default field values on creation
DROP POLICY IF EXISTS "Authenticated can request pairing" ON public.pairings;

CREATE POLICY "Authenticated can request pairing"
ON public.pairings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = mentee_id AND
  status = 'pending' AND
  admin_approved = false AND
  matched_by IN ('manual', 'ai')
);

-- Fix realtime.messages access to prevent unauthorized topic subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Secure Realtime Channels" ON realtime.messages;

CREATE POLICY "Secure Realtime Channels"
ON realtime.messages
FOR ALL TO authenticated
USING (
  topic LIKE auth.uid() || '-%'
)
WITH CHECK (
  topic LIKE auth.uid() || '-%'
);
