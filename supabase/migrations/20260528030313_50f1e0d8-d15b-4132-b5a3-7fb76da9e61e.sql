ALTER TABLE public.feedback_questions
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_other boolean NOT NULL DEFAULT false;