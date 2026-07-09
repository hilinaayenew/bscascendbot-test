-- Converser framework tables for BSC AI Career Coach

-- Stores few-shot wordalisation examples per WORDALISE function
CREATE TABLE IF NOT EXISTS public.coach_wordalisations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name text NOT NULL,
  question text NOT NULL,
  knowledge text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_wordalisations ENABLE ROW LEVEL SECURITY;

-- Only the service role (edge function) reads these — no user access needed
CREATE POLICY "Service role only" ON public.coach_wordalisations
  FOR ALL USING (false);

-- Persists user career profile across sessions
CREATE TABLE IF NOT EXISTS public.coach_user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  career_stage text,          -- 'complete_beginner' | 'career_changer' | 'early_career' | 'growing'
  current_background text,
  target_role text,
  goals text,
  challenges text[],
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coach profile" ON public.coach_user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own coach profile" ON public.coach_user_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
