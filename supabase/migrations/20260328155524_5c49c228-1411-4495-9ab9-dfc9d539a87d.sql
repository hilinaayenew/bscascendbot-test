
-- Function to send system messages from BSC Coordinator
CREATE OR REPLACE FUNCTION public.send_system_message(p_receiver_id uuid, p_content text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.messages (sender_id, receiver_id, content, read)
  VALUES ('00000000-0000-0000-0000-000000000001'::uuid, p_receiver_id, p_content, false);
END;
$$;

-- Trigger function: on mentor role assignment, send welcome message
CREATE OR REPLACE FUNCTION public.on_mentor_signup_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mentor_name text;
  first_name text;
BEGIN
  IF NEW.role = 'mentor' THEN
    SELECT full_name INTO mentor_name FROM public.profiles WHERE user_id = NEW.user_id;
    first_name := COALESCE(NULLIF(split_part(mentor_name, ' ', 1), ''), 'there');
    
    PERFORM public.send_system_message(
      NEW.user_id,
      'Hi ' || first_name || E',\n\nThank you for signing up as a mentor on Ascendency. We''re really glad you''re here.\n\nYour application is currently under review by our team. We take mentor approvals seriously because the mentees coming onto this platform are trusting us to connect them with the right people — and we want to make sure every mentor on Ascendency is set up for a great experience.\n\nWhile you wait, your account is active and ready for you to explore. Here''s what you can do right now:\n\n• Complete your mentor profile under Settings — a strong profile helps us review your application faster and makes a great first impression when you go live\n• Browse the platform and get familiar with how things work\n• Take courses available to you in the Courses tab\n\nWe''ll be in touch as soon as your application has been reviewed. It shouldn''t be a long wait.\n\nIf you have any questions in the meantime, you can reach us at support@becauseshecan.com.\n\nWelcome aboard,\nAscendency by Because She Can'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mentor_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_mentor_signup_message();

-- Trigger function: on mentor approval/rejection
CREATE OR REPLACE FUNCTION public.on_mentor_approval_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mentor_name text;
  first_name text;
BEGIN
  IF OLD.approval_status = 'pending' AND NEW.approval_status IN ('approved', 'rejected') THEN
    SELECT full_name INTO mentor_name FROM public.profiles WHERE user_id = NEW.user_id;
    first_name := COALESCE(NULLIF(split_part(mentor_name, ' ', 1), ''), 'there');
    
    IF NEW.approval_status = 'approved' THEN
      PERFORM public.send_system_message(
        NEW.user_id,
        'Hi ' || first_name || E',\n\nGreat news — your Ascendency mentor application has been approved! You now have full access to the platform and can start connecting with mentees.\n\nHere''s what''s unlocked for you:\n\n• Your profile is now live and visible to mentees on the Explore page\n• Mentees can send you pairing requests and you can accept or decline them\n• You can book and receive one-on-one session requests\n• You can message your mentees directly through the platform\n\nA few things worth doing before your first session:\n\n• Double-check your profile is complete and reflects how you want to show up to mentees\n• Set your availability so mentees know when you''re open for sessions\n• Familiarise yourself with the Pairings tab — that''s where you''ll track your mentees'' progress\n\nWe''re excited to have you as part of the Ascendency community. The work you do as a mentor genuinely changes the trajectory of the people you work with — thank you for showing up for that.\n\nIf you have any questions as you get started, we''re always reachable at support@becauseshecan.com.\n\nLet''s go,\nAscendency by Because She Can'
      );
    ELSIF NEW.approval_status = 'rejected' THEN
      PERFORM public.send_system_message(
        NEW.user_id,
        'Hi ' || first_name || E',\n\nThank you for your interest in mentoring on Ascendency. After reviewing your application, we''re not able to approve it at this time.\n\nThis doesn''t reflect on your abilities or experience — we review every application carefully and sometimes the timing or fit isn''t quite right.\n\nIf you have any questions or would like to know more, please don''t hesitate to reach out to us at support@becauseshecan.com. We''re always happy to chat.\n\nWarm regards,\nAscendency by Because She Can'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mentor_approval_status_change
  AFTER UPDATE ON public.mentor_details
  FOR EACH ROW
  EXECUTE FUNCTION public.on_mentor_approval_change();
