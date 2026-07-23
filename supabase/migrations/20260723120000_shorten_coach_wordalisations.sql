-- Retroactively shorten Chataki's seeded few-shot answers if the original
-- 20260615110000_seed_wordalisations.sql migration already ran with the old
-- long-form (2-3 paragraph) answers. Matches on function_name + question, so
-- this is a no-op if the seed hasn't run yet or already has the short text.

UPDATE public.coach_wordalisations SET answer =
  'Lead with impact, not responsibility — "reduced bug release rate by 30%" beats "responsible for testing." A GitHub or portfolio link matters as much as the CV itself for tech roles. What kind of tech role are you targeting?'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'How do I write a CV that stands out for tech roles?';

UPDATE public.coach_wordalisations SET answer =
  'Treat it as three tracks — applications, connections, and visibility — since 60-70% of tech roles fill through referrals before they''re even posted. What does your network look like right now?'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'What is the most effective job search strategy in tech?';

UPDATE public.coach_wordalisations SET answer =
  'Split your prep in two — daily coding practice for 4-6 weeks, and a handful of STAR stories for the behavioural side. Interviewers are also just imagining working with you daily. What stage is your job search at right now?'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'How do I prepare for a technical interview?';

UPDATE public.coach_wordalisations SET answer =
  'What you''re describing is one of the most documented experiences in tech, and it''s not evidence you don''t belong — it''s evidence you''re paying attention. What''s the situation making you feel this most strongly right now?'
WHERE function_name = 'addressMindsetChallenge' AND question = 'I constantly feel like I don''t belong in tech.';

UPDATE public.coach_wordalisations SET answer =
  'Women tend to apply at 100% of requirements met, men at around 60% — the job description is a wish list, not a checklist. Could you learn the gaps in three months if hired? If yes, apply. What role are you hesitating on?'
WHERE function_name = 'addressMindsetChallenge' AND question = 'How do I stop holding myself back from applying to roles I feel underqualified for?';

UPDATE public.coach_wordalisations SET answer =
  'Shift what you measure from outcomes you can''t control to inputs you can — hours practised, projects completed. The curve is exponential, not linear, and you''re probably closer to the turn than it feels. What does your learning routine look like right now?'
WHERE function_name = 'addressMindsetChallenge' AND question = 'How do I stay motivated when progress feels slow?';
