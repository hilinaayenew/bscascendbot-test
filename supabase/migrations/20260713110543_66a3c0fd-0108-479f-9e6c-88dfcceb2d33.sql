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

  -- Mentee signature: only mentee may set; once set cannot be re-set by mentee.
  IF NEW.mentee_signature IS DISTINCT FROM OLD.mentee_signature
     OR NEW.mentee_signed_at IS DISTINCT FROM OLD.mentee_signed_at THEN
    -- Allow trigger-driven clearing of the OTHER party's signature when the
    -- mentor edits shared details (handled below). Detect that path: mentor caller
    -- clearing mentee signature to NULL is allowed here.
    IF caller = OLD.mentor_id
       AND NEW.mentee_signature IS NULL
       AND NEW.mentee_signed_at IS NULL THEN
      NULL;
    ELSE
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
  END IF;

  IF NEW.mentor_signature IS DISTINCT FROM OLD.mentor_signature
     OR NEW.mentor_signed_at IS DISTINCT FROM OLD.mentor_signed_at THEN
    IF caller = OLD.mentee_id
       AND NEW.mentor_signature IS NULL
       AND NEW.mentor_signed_at IS NULL THEN
      NULL;
    ELSE
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
  END IF;

  -- Shared fields
  shared_changed :=
       NEW.meeting_day IS DISTINCT FROM OLD.meeting_day
    OR NEW.meeting_time IS DISTINCT FROM OLD.meeting_time
    OR NEW.meeting_frequency IS DISTINCT FROM OLD.meeting_frequency
    OR NEW.meeting_platform IS DISTINCT FROM OLD.meeting_platform
    OR NEW.mentee_goals IS DISTINCT FROM OLD.mentee_goals
    OR NEW.additional_notes IS DISTINCT FROM OLD.additional_notes
    OR NEW.form_responses IS DISTINCT FROM OLD.form_responses;

  -- Once fully complete (both signed), shared details are permanently locked.
  IF shared_changed AND OLD.status = 'complete' THEN
    RAISE EXCEPTION 'Agreement details are locked once both parties have signed';
  END IF;

  -- If one party has already signed and the OTHER party edits shared details,
  -- clear the existing signature so they can re-sign the updated agreement.
  IF shared_changed THEN
    IF OLD.mentee_signature IS NOT NULL AND caller = OLD.mentor_id THEN
      NEW.mentee_signature := NULL;
      NEW.mentee_signed_at := NULL;
    END IF;
    IF OLD.mentor_signature IS NOT NULL AND caller = OLD.mentee_id THEN
      NEW.mentor_signature := NULL;
      NEW.mentor_signed_at := NULL;
    END IF;
  END IF;

  -- Status derivation
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