
CREATE OR REPLACE FUNCTION public.redeem_discount_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total int;
  v_row record;
  v_existing record;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('status','error','reason','not_authenticated');
  END IF;

  -- Already redeemed by this user?
  SELECT code INTO v_existing FROM public.discount_codes WHERE redeemed_by = v_user LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('status','already_active','code',v_existing.code);
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.discount_codes WHERE redeemed_by IS NOT NULL;
  IF v_total >= 250 THEN
    RETURN jsonb_build_object('status','exhausted');
  END IF;

  SELECT id, redeemed_by INTO v_row
    FROM public.discount_codes
    WHERE upper(code) = upper(trim(p_code))
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;

  IF v_row.redeemed_by IS NOT NULL THEN
    RETURN jsonb_build_object('status','claimed');
  END IF;

  UPDATE public.discount_codes
    SET redeemed_by = v_user, redeemed_at = now()
    WHERE id = v_row.id AND redeemed_by IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','claimed');
  END IF;

  UPDATE public.profiles SET pathway_level = 'mentee' WHERE user_id = v_user;

  RETURN jsonb_build_object('status','valid');
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_discount_code(text) TO authenticated;
