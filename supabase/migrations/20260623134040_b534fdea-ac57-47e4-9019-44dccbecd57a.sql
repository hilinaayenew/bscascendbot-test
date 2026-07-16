
-- 1. Template table (singleton enforced by fixed id)
CREATE TABLE public.agreement_template (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agreement_template_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

GRANT SELECT ON public.agreement_template TO authenticated;
GRANT ALL ON public.agreement_template TO service_role;

ALTER TABLE public.agreement_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read template"
  ON public.agreement_template FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert template"
  ON public.agreement_template FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update template"
  ON public.agreement_template FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER agreement_template_set_updated_at
  BEFORE UPDATE ON public.agreement_template
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed default template (current fields + current terms)
INSERT INTO public.agreement_template (id, fields, terms) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  $json$[
    {"key":"meeting_day","label":"Meeting day","type":"select","required":true,"options":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"helpText":""},
    {"key":"meeting_time","label":"Meeting time","type":"text","required":true,"options":[],"helpText":"e.g. 18:00 (your local time)"},
    {"key":"meeting_frequency","label":"Meeting frequency","type":"select","required":true,"options":["Weekly","Fortnightly","Monthly","Ad-hoc"],"helpText":""},
    {"key":"meeting_platform","label":"Meeting platform","type":"select","required":true,"options":["Google Meet","Zoom","Microsoft Teams","WhatsApp","Phone call","Other"],"helpText":""},
    {"key":"mentee_goals","label":"Mentee goals","type":"textarea","required":false,"options":[],"helpText":"What the mentee wants to achieve in this mentorship."},
    {"key":"additional_notes","label":"Additional notes","type":"textarea","required":false,"options":[],"helpText":"Anything else the pair want recorded."}
  ]$json$::jsonb,
  $json$[
    {"heading":"Purpose","body":"This agreement sets out the shared expectations between mentor and mentee for a structured mentorship through the BSC Ascendency platform. The relationship is built on mutual respect, trust and a genuine commitment to the mentee's growth."},
    {"heading":"Commitment","body":"Both parties commit to meeting on the agreed day, time, frequency and platform recorded above. Either party will give reasonable notice if a session needs to be rescheduled, and both will make a genuine effort to keep the relationship active and engaged."},
    {"heading":"Confidentiality","body":"Anything personal, professional or sensitive shared during sessions is treated as confidential by both parties and will not be shared outside the mentorship without explicit permission, except where required by law."},
    {"heading":"Boundaries and conduct","body":"Both parties will conduct themselves professionally and respectfully. This is a mentorship relationship — not a service, business or romantic engagement. Either party may raise concerns with the BSC team if boundaries are not being respected."},
    {"heading":"Ending the mentorship","body":"Either party may end the mentorship at any time by notifying the other party and the BSC team. We ask that endings are handled with kindness and clarity, ideally with a closing conversation."},
    {"heading":"Platform terms","body":"This agreement complements the BSC Ascendency Terms of Use and Privacy Policy. By signing, both parties confirm they have read and accept those terms and will conduct the mentorship through the platform's tools."}
  ]$json$::jsonb
);

-- 3. Add dynamic responses column to agreements
ALTER TABLE public.agreements
  ADD COLUMN IF NOT EXISTS form_responses jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Update validation rule: lock form_responses after first signature, derive status from required template fields
CREATE OR REPLACE FUNCTION public.enforce_agreement_update_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  is_admin boolean := caller IS NOT NULL AND public.has_role(caller, 'admin'::app_role);
  shared_changed boolean;
  tmpl_fields jsonb;
  fld jsonb;
  fkey text;
  required_missing boolean := false;
BEGIN
  IF caller IS NULL OR is_admin THEN
    RETURN NEW;
  END IF;

  IF caller <> OLD.mentee_id AND caller <> OLD.mentor_id THEN
    RAISE EXCEPTION 'Not authorized to modify this agreement';
  END IF;

  IF NEW.pairing_id IS DISTINCT FROM OLD.pairing_id
     OR NEW.mentee_id IS DISTINCT FROM OLD.mentee_id
     OR NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Cannot modify protected agreement fields';
  END IF;

  -- Signatures
  IF NEW.mentee_signature IS DISTINCT FROM OLD.mentee_signature
     OR NEW.mentee_signed_at IS DISTINCT FROM OLD.mentee_signed_at THEN
    IF caller <> OLD.mentee_id THEN
      RAISE EXCEPTION 'Only the mentee may sign the mentee signature';
    END IF;
    IF OLD.mentee_signature IS NOT NULL THEN
      RAISE EXCEPTION 'Mentee signature already recorded';
    END IF;
    IF NEW.mentee_signature IS NULL OR length(btrim(NEW.mentee_signature)) = 0 THEN
      RAISE EXCEPTION 'Signature cannot be empty';
    END IF;
    NEW.mentee_signed_at := now();
  END IF;

  IF NEW.mentor_signature IS DISTINCT FROM OLD.mentor_signature
     OR NEW.mentor_signed_at IS DISTINCT FROM OLD.mentor_signed_at THEN
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

  -- Shared/locked fields
  shared_changed :=
       NEW.meeting_day IS DISTINCT FROM OLD.meeting_day
    OR NEW.meeting_time IS DISTINCT FROM OLD.meeting_time
    OR NEW.meeting_frequency IS DISTINCT FROM OLD.meeting_frequency
    OR NEW.meeting_platform IS DISTINCT FROM OLD.meeting_platform
    OR NEW.mentee_goals IS DISTINCT FROM OLD.mentee_goals
    OR NEW.additional_notes IS DISTINCT FROM OLD.additional_notes
    OR NEW.form_responses IS DISTINCT FROM OLD.form_responses;

  IF shared_changed AND (OLD.mentee_signature IS NOT NULL OR OLD.mentor_signature IS NOT NULL) THEN
    RAISE EXCEPTION 'Agreement details are locked once either party has signed';
  END IF;

  -- Status derivation: use template required fields against form_responses
  SELECT fields INTO tmpl_fields FROM public.agreement_template LIMIT 1;

  IF tmpl_fields IS NOT NULL THEN
    FOR fld IN SELECT * FROM jsonb_array_elements(tmpl_fields) LOOP
      IF COALESCE((fld->>'required')::boolean, false) THEN
        fkey := fld->>'key';
        IF fkey IS NULL
           OR NEW.form_responses->fkey IS NULL
           OR (jsonb_typeof(NEW.form_responses->fkey) = 'string'
               AND length(btrim(NEW.form_responses->>fkey)) = 0)
        THEN
          required_missing := true;
          EXIT;
        END IF;
      END IF;
    END LOOP;
  END IF;

  IF NEW.mentee_signature IS NOT NULL AND NEW.mentor_signature IS NOT NULL THEN
    NEW.status := 'complete';
  ELSIF NEW.mentee_signature IS NOT NULL OR NEW.mentor_signature IS NOT NULL THEN
    NEW.status := 'pending_signatures';
  ELSIF required_missing THEN
    NEW.status := 'pending_details';
  ELSE
    NEW.status := 'pending_signatures';
  END IF;

  RETURN NEW;
END;
$function$;
