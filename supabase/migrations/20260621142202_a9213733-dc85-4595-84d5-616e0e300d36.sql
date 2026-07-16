ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notify_new_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notify_message_reminders boolean NOT NULL DEFAULT true;