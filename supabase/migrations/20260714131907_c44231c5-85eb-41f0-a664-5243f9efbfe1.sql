DROP FUNCTION IF EXISTS public.send_system_message(uuid, text);

CREATE OR REPLACE FUNCTION public.send_system_message(p_receiver_id uuid, p_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  system_sender_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  caller uuid := auth.uid();
  v_id uuid;
BEGIN
  IF caller IS NOT NULL AND NOT public.has_role(caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = system_sender_id) THEN
    INSERT INTO public.messages (sender_id, receiver_id, content, read)
    VALUES (system_sender_id, p_receiver_id, p_content, false)
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$function$;