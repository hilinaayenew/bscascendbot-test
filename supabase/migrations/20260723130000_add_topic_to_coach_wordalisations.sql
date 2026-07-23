-- Adds topic tagging to coach_wordalisations so few-shot retrieval can pick
-- examples relevant to the current question instead of just "most recent N".
--
-- For adviseOnCareerTopic rows, topic matches a KNOWLEDGE_BASE key
-- (getting_started, career_paths, further_education, mentorship, wellbeing,
-- cv_job_search, salary, interview_prep, ai_impact, general).
-- For addressMindsetChallenge rows, topic matches a challenge_type value
-- (imposter_syndrome, confidence, motivation, burnout, belonging, general).

ALTER TABLE public.coach_wordalisations ADD COLUMN IF NOT EXISTS topic text;

-- Backfill the 6 rows seeded by 20260615110000_seed_wordalisations.sql
UPDATE public.coach_wordalisations SET topic = 'cv_job_search'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'How do I write a CV that stands out for tech roles?';

UPDATE public.coach_wordalisations SET topic = 'cv_job_search'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'What is the most effective job search strategy in tech?';

UPDATE public.coach_wordalisations SET topic = 'interview_prep'
WHERE function_name = 'adviseOnCareerTopic' AND question = 'How do I prepare for a technical interview?';

UPDATE public.coach_wordalisations SET topic = 'belonging'
WHERE function_name = 'addressMindsetChallenge' AND question = 'I constantly feel like I don''t belong in tech.';

UPDATE public.coach_wordalisations SET topic = 'confidence'
WHERE function_name = 'addressMindsetChallenge' AND question = 'How do I stop holding myself back from applying to roles I feel underqualified for?';

UPDATE public.coach_wordalisations SET topic = 'motivation'
WHERE function_name = 'addressMindsetChallenge' AND question = 'How do I stay motivated when progress feels slow?';
