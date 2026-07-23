-- Seed wordalisations for BSC Career Coach WORDALISE functions
-- 3 examples per function, written in BSC voice: first-person, empathetic, actionable, ends with a question

INSERT INTO public.coach_wordalisations (function_name, question, knowledge, answer) VALUES

-- ============================================================
-- adviseOnCareerTopic — 3 examples
-- ============================================================

(
  'adviseOnCareerTopic',
  'How do I write a CV that stands out for tech roles?',
  'Tech CVs must pass ATS (Applicant Tracking System) filters before a human reads them. Use keywords directly from the job description. Quantify impact wherever possible. Include a GitHub or portfolio link — for tech roles this is as important as the CV itself. Keep to one page for under 5 years experience. Lead with a brief professional summary. List skills clearly. For each role, write what you achieved, not just what you were responsible for.',
  'Lead with impact, not responsibility — "reduced bug release rate by 30%" beats "responsible for testing." A GitHub or portfolio link matters as much as the CV itself for tech roles. What kind of tech role are you targeting?'
),

(
  'adviseOnCareerTopic',
  'What is the most effective job search strategy in tech?',
  'Most tech jobs are filled through referrals or before they are publicly posted. Job boards are useful but represent only 20-30% of opportunities. LinkedIn is the primary professional network in tech. Direct outreach to hiring managers is often more effective than applying through portals. Building a visible presence through writing, open source contributions, or meetups creates inbound opportunities. A structured approach: 30% job boards, 40% networking/referrals, 30% visible output.',
  'Treat it as three tracks — applications, connections, and visibility — since 60-70% of tech roles fill through referrals before they''re even posted. What does your network look like right now?'
),

(
  'adviseOnCareerTopic',
  'How do I prepare for a technical interview?',
  'Technical interviews have two distinct components: the coding/technical assessment and the behavioural interview. For coding: daily practice on LeetCode or HackerRank for 4-6 weeks, focus on arrays, strings, hashmaps, trees. For behavioural: prepare STAR format stories covering leadership, conflict, failure, collaboration. Research the company deeply. Ask thoughtful questions. Interviewers assess culture fit as much as technical ability. Practise speaking your thinking aloud.',
  'Split your prep in two — daily coding practice for 4-6 weeks, and a handful of STAR stories for the behavioural side. Interviewers are also just imagining working with you daily. What stage is your job search at right now?'
),

-- ============================================================
-- addressMindsetChallenge — 3 examples
-- ============================================================

(
  'addressMindsetChallenge',
  'I constantly feel like I don''t belong in tech.',
  'Imposter syndrome is extremely common in tech, particularly among women and career changers. Research shows that those who feel most like imposters are often the most thoughtful and conscientious workers. The feeling is not evidence of incompetence — it is often evidence of self-awareness in a field that has historically excluded many groups. Strategies: document achievements regularly, reframe "I don''t know" as "I don''t know yet", find community with others who share the experience, separate feelings from facts.',
  'What you''re describing is one of the most documented experiences in tech, and it''s not evidence you don''t belong — it''s evidence you''re paying attention. What''s the situation making you feel this most strongly right now?'
),

(
  'addressMindsetChallenge',
  'How do I stop holding myself back from applying to roles I feel underqualified for?',
  'Research shows women apply for jobs when they meet 100% of requirements; men apply at 60%. Job descriptions are wish lists, not checklists. Companies rarely hire their perfect candidate. The relevant question is: could I learn the gaps within 3 months of being hired? Transferable skills from other careers are often undervalued in job descriptions but highly valued by actual hiring managers. Applying is a skill that improves with practice — each application teaches you something.',
  'Women tend to apply at 100% of requirements met, men at around 60% — the job description is a wish list, not a checklist. Could you learn the gaps in three months if hired? If yes, apply. What role are you hesitating on?'
),

(
  'addressMindsetChallenge',
  'How do I stay motivated when progress feels slow?',
  'Slow early progress is normal in tech transitions. The learning curve is exponential not linear — early stages feel slow because you are building foundations. Motivation strategies: shift measurement from outcomes (job offers) to inputs (hours practised, projects completed); keep a daily progress log to make invisible progress visible; find community to normalise the experience; break goals into 2-week sprints. Burnout risk is highest when effort is high but visible results are low — protect rest and recovery.',
  'Shift what you measure from outcomes you can''t control to inputs you can — hours practised, projects completed. The curve is exponential, not linear, and you''re probably closer to the turn than it feels. What does your learning routine look like right now?'
);
