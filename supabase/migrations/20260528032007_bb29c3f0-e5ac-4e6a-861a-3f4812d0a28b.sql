ALTER TABLE public.feedback_questions
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'general';
ALTER TABLE public.feedback_questions
  DROP CONSTRAINT IF EXISTS feedback_questions_scope_check;
ALTER TABLE public.feedback_questions
  ADD CONSTRAINT feedback_questions_scope_check CHECK (scope IN ('general','per_pairing'));