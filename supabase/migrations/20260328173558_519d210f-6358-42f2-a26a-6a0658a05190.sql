-- Attach the mentor approval change trigger to mentor_details
CREATE TRIGGER trg_mentor_approval_change
  AFTER UPDATE OF approval_status ON public.mentor_details
  FOR EACH ROW
  EXECUTE FUNCTION public.on_mentor_approval_change();

-- Attach the mentor signup message trigger to user_roles
CREATE TRIGGER trg_mentor_signup_message
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_mentor_signup_message();