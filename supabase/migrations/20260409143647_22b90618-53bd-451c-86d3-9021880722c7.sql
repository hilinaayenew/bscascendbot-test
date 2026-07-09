
-- Add country column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- Update handle_new_user to include country from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'country'
  );
  
  -- Assign role from metadata
  IF NEW.raw_user_meta_data->>'role' = 'mentor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentor');
    INSERT INTO public.mentor_details (user_id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'mentee' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'mentee');
  END IF;
  
  RETURN NEW;
END;
$$;
