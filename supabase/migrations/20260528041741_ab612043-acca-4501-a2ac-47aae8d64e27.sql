
ALTER TABLE public.feedback_questions
  ADD COLUMN IF NOT EXISTS period_month date;

CREATE INDEX IF NOT EXISTS feedback_questions_period_month_idx
  ON public.feedback_questions (period_month);
