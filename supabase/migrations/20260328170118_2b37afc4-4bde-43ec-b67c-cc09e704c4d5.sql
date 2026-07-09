CREATE OR REPLACE FUNCTION public.send_system_message(p_receiver_id uuid, p_content text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $$
DECLARE
  system_sender_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = system_sender_id) THEN
    INSERT INTO public.messages (sender_id, receiver_id, content, read)
    VALUES (system_sender_id, p_receiver_id, p_content, false);
  END IF;
END;
$$;