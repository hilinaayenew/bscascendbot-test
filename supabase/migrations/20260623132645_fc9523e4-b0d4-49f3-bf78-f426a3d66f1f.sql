
-- 1. agreements table
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL UNIQUE REFERENCES public.pairings(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_day TEXT,
  meeting_time TEXT,
  meeting_frequency TEXT,
  meeting_platform TEXT,
  mentee_goals TEXT,
  additional_notes TEXT,
  mentee_signature TEXT,
  mentee_signed_at TIMESTAMPTZ,
  mentor_signature TEXT,
  mentor_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_details',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX agreements_mentor_idx ON public.agreements(mentor_id);
CREATE INDEX agreements_mentee_idx ON public.agreements(mentee_id);

-- 2. GRANTS
GRANT SELECT, INSERT, UPDATE ON public.agreements TO authenticated;
GRANT ALL ON public.agreements TO service_role;

-- 3. RLS
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties or admin can view agreement"
ON public.agreements FOR SELECT TO authenticated
USING (
  auth.uid() = mentee_id
  OR auth.uid() = mentor_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Parties can update agreement"
ON public.agreements FOR UPDATE TO authenticated
USING (auth.uid() = mentee_id OR auth.uid() = mentor_id)
WITH CHECK (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "Admin can manage agreements"
ON public.agreements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- INSERT only via trigger/service role; no insert policy for authenticated users.

-- 4. updated_at trigger
CREATE TRIGGER agreements_set_updated_at
BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Validation trigger: enforce who-can-sign, locking, immutability, and status transitions
CREATE OR REPLACE FUNCTION public.enforce_agreement_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  is_admin boolean := caller IS NOT NULL AND public.has_role(caller, 'admin'::app_role);
  shared_changed boolean;
BEGIN
  -- Service role / admins / system: bypass
  IF caller IS NULL OR is_admin THEN
    RETURN NEW;
  END IF;

  -- Caller must be one of the parties
  IF caller <> OLD.mentee_id AND caller <> OLD.mentor_id THEN
    RAISE EXCEPTION 'Not authorized to modify this agreement';
  END IF;

  -- Immutable identity fields
  IF NEW.pairing_id IS DISTINCT FROM OLD.pairing_id
     OR NEW.mentee_id IS DISTINCT FROM OLD.mentee_id
     OR NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Cannot modify protected agreement fields';
  END IF;

  -- Signature fields: each party may only set their OWN, only once, and must include a server timestamp.
  IF NEW.mentee_signature IS DISTINCT FROM OLD.mentee_signature
     OR NEW.mentee_signed_at IS DISTINCT FROM OLD.mentee_signed_at
  THEN
    IF caller <> OLD.mentee_id THEN
      RAISE EXCEPTION 'Only the mentee may sign the mentee signature';
    END IF;
    IF OLD.mentee_signature IS NOT NULL THEN
      RAISE EXCEPTION 'Mentee signature already recorded';
    END IF;
    IF NEW.mentee_signature IS NULL OR length(btrim(NEW.mentee_signature)) = 0 THEN
      RAISE EXCEPTION 'Signature cannot be empty';
    END IF;
    -- Force server timestamp
    NEW.mentee_signed_at := now();
  END IF;

  IF NEW.mentor_signature IS DISTINCT FROM OLD.mentor_signature
     OR NEW.mentor_signed_at IS DISTINCT FROM OLD.mentor_signed_at
  THEN
    IF caller <> OLD.mentor_id THEN
      RAISE EXCEPTION 'Only the mentor may sign the mentor signature';
    END IF;
    IF OLD.mentor_signature IS NOT NULL THEN
      RAISE EXCEPTION 'Mentor signature already recorded';
    END IF;
    IF NEW.mentor_signature IS NULL OR length(btrim(NEW.mentor_signature)) = 0 THEN
      RAISE EXCEPTION 'Signature cannot be empty';
    END IF;
    NEW.mentor_signed_at := now();
  END IF;

  -- Lock shared fields once either party has signed.
  shared_changed :=
       NEW.meeting_day IS DISTINCT FROM OLD.meeting_day
    OR NEW.meeting_time IS DISTINCT FROM OLD.meeting_time
    OR NEW.meeting_frequency IS DISTINCT FROM OLD.meeting_frequency
    OR NEW.meeting_platform IS DISTINCT FROM OLD.meeting_platform
    OR NEW.mentee_goals IS DISTINCT FROM OLD.mentee_goals
    OR NEW.additional_notes IS DISTINCT FROM OLD.additional_notes;

  IF shared_changed AND (OLD.mentee_signature IS NOT NULL OR OLD.mentor_signature IS NOT NULL) THEN
    RAISE EXCEPTION 'Agreement details are locked once either party has signed';
  END IF;

  -- Derive status server-side instead of trusting the client.
  IF NEW.mentee_signature IS NOT NULL AND NEW.mentor_signature IS NOT NULL THEN
    NEW.status := 'complete';
  ELSIF NEW.mentee_signature IS NOT NULL OR NEW.mentor_signature IS NOT NULL THEN
    NEW.status := 'pending_signatures';
  ELSE
    -- Both unsigned: pending_details if any shared field is empty, else pending_signatures.
    IF NEW.meeting_day IS NULL OR length(btrim(coalesce(NEW.meeting_day,''))) = 0
       OR NEW.meeting_time IS NULL OR length(btrim(coalesce(NEW.meeting_time,''))) = 0
       OR NEW.meeting_frequency IS NULL OR length(btrim(coalesce(NEW.meeting_frequency,''))) = 0
       OR NEW.meeting_platform IS NULL OR length(btrim(coalesce(NEW.meeting_platform,''))) = 0
    THEN
      NEW.status := 'pending_details';
    ELSE
      NEW.status := 'pending_signatures';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER agreements_enforce_update
BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.enforce_agreement_update_rules();

-- 6. Auto-create agreement when a pairing becomes active
CREATE OR REPLACE FUNCTION public.create_agreement_on_pairing_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active')
  THEN
    INSERT INTO public.agreements (pairing_id, mentor_id, mentee_id)
    VALUES (NEW.id, NEW.mentor_id, NEW.mentee_id)
    ON CONFLICT (pairing_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pairings_auto_create_agreement
AFTER INSERT OR UPDATE OF status ON public.pairings
FOR EACH ROW EXECUTE FUNCTION public.create_agreement_on_pairing_active();

-- 7. Backfill: create agreement rows for existing active pairings
INSERT INTO public.agreements (pairing_id, mentor_id, mentee_id)
SELECT p.id, p.mentor_id, p.mentee_id
FROM public.pairings p
WHERE p.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM public.agreements a WHERE a.pairing_id = p.id);

-- 8. Extend account deletion cascade
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> target_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.session_logs WHERE logged_by = target_user_id
    OR pairing_id IN (SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id);
  DELETE FROM public.goals WHERE pairing_id IN (
    SELECT id FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id
  );
  DELETE FROM public.agreements WHERE mentor_id = target_user_id OR mentee_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.pairings WHERE mentor_id = target_user_id OR mentee_id = target_user_id;
  DELETE FROM public.course_progress WHERE user_id = target_user_id;
  DELETE FROM public.mentor_details WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  UPDATE public.discount_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE redeemed_by = target_user_id;
  DELETE FROM public.email_unsubscribe_tokens WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );
  DELETE FROM public.suppressed_emails WHERE email IN (
    SELECT email FROM public.profiles WHERE user_id = target_user_id
  );
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$;
