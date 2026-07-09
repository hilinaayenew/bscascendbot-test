-- Insert AI Coach into auth.users so the foreign key constraint is satisfied
INSERT INTO auth.users (id, instance_id, aud, role, email, created_at, updated_at, is_super_admin)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'ai-coach@becauseshecan.tech',
  now(),
  now(),
  false
) ON CONFLICT (id) DO NOTHING;

-- Create the AI Coach System User profile
INSERT INTO public.profiles (user_id, full_name, email, bio)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'AI Career Coach',
  'ai-coach@becauseshecan.tech',
  'I am the AI Career Coach. I am here to help you navigate your career path, answer questions, and provide guidance based on the BSC methodology.'
) ON CONFLICT (user_id) DO NOTHING;
