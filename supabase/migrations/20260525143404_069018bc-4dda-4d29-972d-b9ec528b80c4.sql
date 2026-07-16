DO $$
DECLARE
  fn record;
  admin_fns text[] := ARRAY[
    'admin_get_profile_contacts(uuid[])',
    'admin_get_invited_mentor_emails()',
    'was_email_invited(text)',
    'get_mentors_last_sign_in()',
    'send_system_message(uuid,text)'
  ];
  fn_sig text;
BEGIN
  FOREACH fn_sig IN ARRAY admin_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC', fn_sig);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, authenticated', fn_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn_sig);
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Skipping missing function: %', fn_sig;
      WHEN undefined_object THEN
        RAISE NOTICE 'Skipping missing object for: %', fn_sig;
    END;
  END LOOP;
END $$;