-- The 20260723140000 migration seeded coach_wordalisations with placeholder
-- answers written against a training-questions CSV that turned out to be
-- Botema-specific, not shared with Chataki. Clearing all rows here — Chataki
-- goes back to zero few-shot examples (still functions, just less
-- voice-consistent) until her real training data is provided and seeded.
DELETE FROM public.coach_wordalisations;
