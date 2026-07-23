-- Expands Chataki's few-shot examples to cover the full BSC training-questions
-- list (bsc-coach-training-questions.csv), tagged by topic for topic-aware
-- retrieval. Questions #41, #42, and #43 (the CV, job-search-strategy, and
-- technical-interview questions) are already seeded by
-- 20260615110000_seed_wordalisations.sql, so they're skipped here.
-- Question #35 ("manage my mental health during a challenging transition") is
-- intentionally seeded under both adviseOnCareerTopic/wellbeing and
-- addressMindsetChallenge/general, since it's genuinely ambiguous which
-- function the router will pick for it.

INSERT INTO public.coach_wordalisations (function_name, topic, question, knowledge, answer) VALUES

-- ============================================================
-- getting_started
-- ============================================================
('adviseOnCareerTopic', 'getting_started', 'I have no tech background at all. where do I even begin?',
 'Self-teaching, bootcamps, and degrees are the three main routes in; free resources like freeCodeCamp and CS50 let you test interest before committing money or time.',
 'Start by getting clear on which area draws you in, then dive into a free resource like freeCodeCamp or CS50 to test the interest before committing money. What pulled you toward tech in the first place?'),

('adviseOnCareerTopic', 'getting_started', 'What is the difference between self-teaching and bootcamps and a computer science degree, which should I choose?',
 'Self-teaching is cheapest and most flexible; bootcamps are structured and job-focused over 3-6 months; degrees take 3-4 years but open senior/research doors long-term.',
 'It depends on how you learn best and your timeline — self-teaching is cheapest and most flexible, bootcamps are structured and fast, a degree opens doors long-term but takes years. What''s your runway looking like, time and budget-wise?'),

('adviseOnCareerTopic', 'getting_started', 'What are the most beginner friendly programming languages to start with?',
 'Python (versatile, readable, used in data/AI/general development) and JavaScript (powers the web, huge job market) are the standard beginner recommendations.',
 'Python and JavaScript are the most beginner-friendly and most in demand — Python for data and general development, JavaScript for anything web. Which direction interests you more, building things people see or working with data?'),

('adviseOnCareerTopic', 'getting_started', 'How long does it realistically take to be job ready in tech from scratch?',
 'Realistic time to a first job is 6-18 months depending on hours invested and target role; junior frontend/web roles are generally the most accessible entry point.',
 'Realistically 6-18 months of focused effort, depending on the role and hours you can put in. What field are you aiming for — that changes the timeline a lot.'),

('adviseOnCareerTopic', 'getting_started', 'I''m switching careers from a completely non-tech field, what transferable skills do I have?',
 'Project management, client communication, analytical thinking, domain expertise, writing, and stakeholder management are genuinely valued transferable skills, not just soft skills.',
 'Your previous career almost certainly gave you something tech genuinely values — client communication, project management, domain expertise. What was your last role, so I can point to what carries over?'),

('adviseOnCareerTopic', 'getting_started', 'What free resources do you recommend for someone starting in tech today?',
 'freeCodeCamp (web dev), The Odin Project (full-stack web), CS50 (Harvard, general CS), Kaggle (data science/ML), and Google''s free certificates are all strong free starting points.',
 'freeCodeCamp, The Odin Project, and CS50 are the best free starting points, plus Google''s free certificates for UX, data, and IT support. What area are you leaning toward?'),

('adviseOnCareerTopic', 'getting_started', 'How do I figure out which area of tech is right for me, development vs data vs UX vs cybersecurity?',
 'Interest and the kind of problems you enjoy solving — building things, working with numbers, or designing experiences — usually points toward development, data, or UX respectively.',
 'Start by noticing what you''re drawn to when you read about tech — building things, working with numbers, or designing experiences usually points to development, data, or UX. What kind of problems do you enjoy solving?'),

('adviseOnCareerTopic', 'getting_started', 'What does a typical day look like for someone early in their tech career?',
 'Early tech roles are collaborative rather than solitary — a mix of focused work, stand-ups, code reviews, and asking questions, less glamorous than commonly pictured.',
 'It''s less glamorous and more collaborative than people expect — a mix of focused work, stand-ups, code reviews, and asking questions. What role are you picturing when you ask?'),

-- ============================================================
-- further_education
-- ============================================================
('adviseOnCareerTopic', 'further_education', 'Do I need a master''s degree to succeed in tech?',
 'Most tech roles value a strong portfolio and demonstrable skill over a master''s degree; it matters more for research-heavy specialisations than general software roles.',
 'No — most tech roles value a strong portfolio and demonstrable skill over a master''s. Is there a specific role you''re considering where you''ve seen it required?'),

('adviseOnCareerTopic', 'further_education', 'Which tech fields benefit most from having a postgraduate qualification?',
 'Research-heavy fields like machine learning and certain cybersecurity specialisations benefit most from a postgraduate qualification; most software/product roles do not require one.',
 'Research-heavy fields like machine learning and certain specialisations in cybersecurity benefit most — most software and product roles don''t need one. What field are you weighing this for?'),

('adviseOnCareerTopic', 'further_education', 'What should I look for when choosing a master''s programme in a tech related field?',
 'Look at where a programme''s graduates actually end up and its industry ties, not just its ranking or reputation.',
 'Look at where its graduates actually end up, not just its ranking, and whether it has strong industry ties. What''s drawing you to a master''s specifically?'),

('adviseOnCareerTopic', 'further_education', 'Is it better to do a master''s before or after gaining work experience?',
 'Doing a master''s after some work experience is usually recommended, since it clarifies exactly what you need to study and employers sometimes fund it.',
 'After, usually — work experience tells you what you actually need to study, and often your employer will help fund it. Are you weighing this because of a specific opportunity?'),

('adviseOnCareerTopic', 'further_education', 'Are there certifications that are more valued than a master''s degree in tech?',
 'Cloud certifications (e.g. AWS Solutions Architect) provide a clear, industry-recognised progression that is often more directly valued than a master''s for those specific paths.',
 'For cloud and DevOps especially, certifications like AWS Solutions Architect are often more directly valued than a master''s. What field are you looking at?'),

('adviseOnCareerTopic', 'further_education', 'How do I fund further education in tech, are there scholarships for women?',
 'Women-in-tech scholarships and employer tuition-assistance programmes are worth researching before self-funding further education.',
 'Yes — look specifically for women-in-tech scholarships and employer tuition support before self-funding. What programme are you considering?'),

('adviseOnCareerTopic', 'further_education', 'How do I balance working full time while pursuing further academic qualifications?',
 'Part-time or online programmes with clear personal boundaries are how most people manage further study alongside full-time work.',
 'It''s demanding but doable with clear boundaries — most people find part-time or online programmes essential for this. What does your current workload look like?'),

-- ============================================================
-- career_paths
-- ============================================================
('adviseOnCareerTopic', 'career_paths', 'What does the roadmap look like to become a software developer?',
 'Learn fundamentals, build projects, contribute to open source or freelance, then apply for junior roles — portfolio matters more than credentials for most software roles.',
 'Learn fundamentals, build real projects, then contribute to open source or freelance before applying for junior roles — portfolio matters more than credentials here. What have you built so far, if anything?'),

('adviseOnCareerTopic', 'career_paths', 'How do I get into data science or machine learning with a non-technical background?',
 'Python and statistics foundations first, then pandas/numpy/visualisation before ML basics; domain expertise from a non-technical background is often a competitive advantage.',
 'Start with Python and statistics fundamentals, then move into pandas and visualisation before touching ML — your non-technical background is an asset if it gives you domain expertise. What field are you coming from?'),

('adviseOnCareerTopic', 'career_paths', 'What are the steps to becoming a UX/UI designer?',
 'UX/UI is one of the most accessible tech paths without a coding background; 3-4 strong case studies in a portfolio matter more than any certificate, with Figma as the essential tool.',
 'Build a portfolio of 3-4 strong case studies showing your full process — that matters more than any certificate, including Figma. Have you started designing anything yet, even informally?'),

('adviseOnCareerTopic', 'career_paths', 'What does a career path in cybersecurity look like and where do I start?',
 'Many people enter cybersecurity through IT support roles first; CompTIA Security+ and Network+ are genuinely valued entry-level certifications.',
 'Many people enter through IT support first, then specialise — CompTIA Security+ is a well-respected entry certification. Do you have any IT or networking background already?'),

('adviseOnCareerTopic', 'career_paths', 'How do I get into product management in tech?',
 'Product management typically requires 2-3 years of experience in an adjacent function (engineering, design, data) first — it''s rarely a first tech role.',
 'PM is rarely a first tech role — it usually needs 2-3 years in an adjacent function like engineering or design first. What''s your current background?'),

('adviseOnCareerTopic', 'career_paths', 'What is the roadmap for getting into cloud computing or DevOps?',
 'Linux fundamentals, scripting (Python/Bash), and one cloud platform (AWS has the largest market share) are the core trio, with certifications providing clear progression.',
 'Linux fundamentals, scripting, and one cloud platform — AWS has the largest market share — are the core trio, then certifications give you a clear ladder up. Do you have any scripting experience yet?'),

('adviseOnCareerTopic', 'career_paths', 'How do I transition into tech project management?',
 'Existing organisational and stakeholder-management skills transfer directly into tech project management; pairing that with basic tech literacy (Jira, Agile) is usually enough.',
 'Your existing organisational and stakeholder skills likely transfer directly — pairing that with some tech literacy, like Jira or Agile basics, is usually enough to make the case. What''s your current role?'),

('adviseOnCareerTopic', 'career_paths', 'What are the different specialisations within software engineering and how do I choose?',
 'Frontend (what users see), backend (servers/databases/APIs), full-stack (both), and mobile (iOS/Android) are the main specialisations, each with different day-to-day work.',
 'Frontend, backend, full-stack, and mobile each have different day-to-day work — frontend if you like what users see, backend if you like systems and data. What have you enjoyed building, if anything?'),

('adviseOnCareerTopic', 'career_paths', 'How do I break into AI and machine learning roles without a deep mathematics or research background?',
 'Many practitioners build real ML skills through applied Python projects before deep math; math gaps can be filled progressively rather than needing to be mastered first.',
 'Start with Python and applied projects rather than the theory first — many practitioners built real ML skills before deep math, and you can fill gaps as you go. What''s your current comfort level with Python?'),

-- ============================================================
-- mentorship
-- ============================================================
('adviseOnCareerTopic', 'mentorship', 'How do I find a good mentor in tech?',
 'Looking within an existing network — a former colleague, a structured pairing programme, or someone whose path you admire — is usually more effective than approaching a stranger cold.',
 'Look within your existing network first — a former colleague, a BSC pairing, or someone whose career path you admire — rather than a stranger. Have you already got someone in mind?'),

('adviseOnCareerTopic', 'mentorship', 'What should I look for in a mentor and how do I approach them?',
 'Someone a few steps ahead rather than at the very top, approached with a specific small ask rather than an open-ended "be my mentor," tends to work best.',
 'Look for someone a few steps ahead of you, not necessarily at the top, and approach with a specific, small ask rather than "be my mentor." What would you want help with first?'),

('adviseOnCareerTopic', 'mentorship', 'How do I make the most of my mentorship sessions?',
 'Coming prepared with a specific question or problem each session, rather than a general check-in, is what keeps mentors engaged and makes sessions valuable.',
 'Come with a specific question or problem each time, not just "how''s it going" — that''s what makes mentors want to keep showing up. What''s on your mind for your next session?'),

('adviseOnCareerTopic', 'mentorship', 'What is the difference between a mentor and a sponsor and do I need both?',
 'A mentor advises; a sponsor actively advocates for you when you''re not in the room. Ideally you have both, though a sponsor tends to matter more for promotions.',
 'A mentor advises you; a sponsor advocates for you when you''re not in the room — ideally you have both, but a sponsor tends to matter more for promotions. Do you have someone actively advocating for you right now?'),

('adviseOnCareerTopic', 'mentorship', 'How do I maintain a productive long-term mentorship relationship?',
 'Consistency, coming prepared, and reporting back on outcomes are what sustain a mentorship relationship over the long term.',
 'Consistency and follow-through matter most — show up prepared, and tell them when their advice actually worked. How long have you been working with this mentor?'),

('adviseOnCareerTopic', 'mentorship', 'How can the BSC programme help me with my specific career goals?',
 'BSC pairs mentees with a mentor, provides structured career resources, and connects members to a community of women navigating similar tech-career paths.',
 'BSC pairs you with a mentor, gives you structured career resources, and connects you to a community of women navigating the same path — the more specific your goals, the more targeted that support can be. What''s the goal you''re focused on right now?'),

-- ============================================================
-- wellbeing
-- ============================================================
('adviseOnCareerTopic', 'wellbeing', 'How do I set healthy boundaries in a demanding tech job?',
 'Clear working hours, actively protected, counter the "always available" culture that''s common but not required in tech.',
 'Set clear working hours and protect them — in tech, "always available" is a habit, not a requirement. What''s making boundaries hard for you right now?'),

('adviseOnCareerTopic', 'wellbeing', 'How do women in tech manage family responsibilities alongside career growth?',
 'Remote and flexible-hours arrangements are widespread in tech, but they still require being upfront with your team about what you need.',
 'Flexible and remote arrangements are genuinely common in tech now, which helps — but it also takes being upfront with your team about what you need. What does your current setup look like?'),

('adviseOnCareerTopic', 'wellbeing', 'How do I avoid burnout when learning to code or building a new tech skill?',
 'Consistent smaller study sessions with built-in rest outperform marathon sessions and are the main protection against burnout while learning.',
 'Build in rest as part of the plan, not a reward after — consistent smaller sessions beat marathon ones and prevent burnout. How much time are you currently putting in, and how sustainable does that feel?'),

('adviseOnCareerTopic', 'wellbeing', 'Is it possible to have flexible working arrangements in most tech roles?',
 'Remote and flexible-hours roles are more widespread in tech than in most industries, and asking directly about this in interviews is normal.',
 'Yes, remote and flexible-hours roles are widespread in tech, more so than most industries — it''s worth asking about directly in interviews. Is this a dealbreaker for a role you''re considering?'),

('adviseOnCareerTopic', 'wellbeing', 'How do I manage my mental health while going through a challenging career transition?',
 'Treating rest and support as a built-in part of a career transition plan, not an afterthought, reflects that transitions are genuinely stressful and deserve real care.',
 'Treat rest and support as part of the plan, not an afterthought — a career transition is genuinely stressful and deserves real care. What''s weighing on you most right now?'),

-- ============================================================
-- cv_job_search
-- ============================================================
('adviseOnCareerTopic', 'cv_job_search', 'How do I get a tech job without prior industry experience?',
 'Real-world projects — for a small business or NGO — substitute for work experience in ways tutorial projects cannot; fellowships and apprenticeships for career switchers help too.',
 'Projects are your best bet — build something real for a business or nonprofit so you have an actual reference point. What have you built so far, or what are you comfortable building?'),

('adviseOnCareerTopic', 'cv_job_search', 'How should I use LinkedIn to support my job search in tech?',
 'A complete profile with a clear headline about where you''re going, regular activity, and recommendations that speak to specific skills all compound over time.',
 'A clear headline about where you''re going, regular activity, and recommendations from people who know your specific work all compound over time. What does your profile look like right now?'),

-- ============================================================
-- salary
-- ============================================================
('adviseOnCareerTopic', 'salary', 'How do I find out what salary I should be earning in my current or target tech role?',
 'Levels.fyi, Glassdoor, and community salary-sharing threads are the most reliable sources; role, location, company size, and experience all significantly affect the number.',
 'Levels.fyi, Glassdoor, and community salary-sharing threads are the most reliable places to check — role, location, and company size all move the number a lot. What role and location are you benchmarking?'),

('adviseOnCareerTopic', 'salary', 'How do I negotiate my first tech job salary without feeling awkward or rude?',
 'Having a specific target range ready before the conversation makes negotiating feel professional rather than confrontational; the discomfort is brief but the uplift compounds.',
 'Have a specific range ready before the conversation — the discomfort is temporary, but the uplift lasts years. Do you have a number in mind yet?'),

('adviseOnCareerTopic', 'salary', 'What do I say when an employer asks for my current salary or expectations?',
 '"I''d rather discuss what the role is worth than anchor on my current salary" is a professionally acceptable, direct redirect.',
 '"I''d rather discuss what the role is worth than anchor on my current salary" is a professional, direct way to redirect. Is this coming up in an active process right now?'),

('adviseOnCareerTopic', 'salary', 'How do I ask for a pay rise in my current tech role?',
 'Timing around a review or a real achievement, and framing around market rate and contribution rather than personal need, is the most effective approach.',
 'Time it around a review or a real achievement, and frame it around market rate and contribution, not personal need. What''s prompting this — a specific achievement or milestone?'),

('adviseOnCareerTopic', 'salary', 'What benefits and perks should I negotiate beyond base salary in a tech offer?',
 'Remote flexibility, learning budget, extra leave, and equity are all negotiable and often cost employers less than salary while carrying high value to you.',
 'Remote flexibility, learning budget, extra leave, and equity are all negotiable and often cost the employer less than salary — always negotiate the full package. Which of those matters most to you?'),

-- ============================================================
-- ai_impact
-- ============================================================
('adviseOnCareerTopic', 'ai_impact', 'Is learning tech still worth it due to AI replacing jobs?',
 'AI is reshaping tech roles rather than eliminating them; judgement, system design, and communication remain durable even as some coding tasks get automated.',
 'AI is reshaping tech roles more than eliminating them — judgement, system design, and communication stay durable even as some coding tasks get automated. What''s making you worried about this right now?'),

('adviseOnCareerTopic', 'ai_impact', 'How can I use AI tools like ChatGPT and GitHub Copilot to accelerate my tech learning?',
 'AI tools accelerate people who already understand the fundamentals and can evaluate what the tool produces; treat them as a fast first draft, not a substitute for learning.',
 'Use them as a fast first draft and research partner, not a substitute for understanding — they help most once you already grasp the fundamentals. Are you using them already, or just starting to?'),

('adviseOnCareerTopic', 'ai_impact', 'Will AI make my current or target tech skills obsolete and how do I future-proof my career?',
 'Future-proofing means getting strong at what AI is weak at — ambiguous requirements, cross-team communication, judgement — and prioritising fundamentals over tool-specific tricks.',
 'Get strong at what AI is weak at — ambiguous problems, cross-team communication, judgement — and keep learning fundamentals over tool-specific tricks. What skill are you most worried about?'),

('adviseOnCareerTopic', 'ai_impact', 'How is AI changing hiring and recruitment practices for tech roles?',
 'AI-assisted screening and take-home tests are increasingly common, alongside more emphasis on system design and judgement-based interviews as coding-recall becomes easier to fake.',
 'Expect more AI-assisted screening and more emphasis on system design over pure coding recall, since that''s harder to fake. Are you preparing for interviews right now?'),

('adviseOnCareerTopic', 'ai_impact', 'What ethical responsibilities do I have as a tech professional building or working with AI systems?',
 'Understanding bias in training data and outputs, being honest about a system''s limitations, and pushing back on harmful or deceptive requests are explicit expectations, not optional extras.',
 'Understand bias in the data and outputs you''re working with, be honest about a system''s limitations, and be willing to push back if asked to ship something harmful. Is this coming up in a specific role or project?'),

('adviseOnCareerTopic', 'ai_impact', 'How do I position myself to work alongside AI rather than be replaced by it?',
 'Showing you can direct and evaluate AI-assisted work, not just prompt it, is the differentiator employers increasingly look for.',
 'Show you can direct and evaluate AI-assisted work, not just prompt it — that''s the differentiator employers are looking for now. What role are you aiming this at?'),

-- ============================================================
-- addressMindsetChallenge — tagged by challenge_type
-- Note: "stay motivated when progress feels slow" (motivation), "I constantly
-- feel like I don't belong" (belonging), and "stop holding myself back from
-- applying" (confidence) are already seeded by
-- 20260615110000_seed_wordalisations.sql, so they're skipped here.
-- ============================================================
('addressMindsetChallenge', 'general', 'How do I manage my mental health while going through a challenging career transition?',
 'Treating rest and support as a built-in part of the plan, not an afterthought, reflects that a career transition is genuinely stressful and deserves real care.',
 'Treat rest and support as part of the plan, not an afterthought — a career transition is genuinely stressful and deserves real care. What''s weighing on you most right now?'),

('addressMindsetChallenge', 'confidence', 'How do I handle moments when I feel less competent than my colleagues?',
 'Comparing your own behind-the-scenes uncertainty to colleagues'' polished, visible output is a common but misleading comparison — most people feel less certain than they appear.',
 'Comparing your behind-the-scenes to everyone else''s highlight reel is a setup for feeling behind — most people are less certain than they look. What''s triggering this comparison right now?'),

('addressMindsetChallenge', 'confidence', 'How do I build confidence speaking up in meetings or presenting my work?',
 'Starting with one small contribution per meeting builds confidence through action, rather than waiting to feel confident before speaking up.',
 'Start small — one comment or question per meeting — confidence tends to follow action, not the other way around. What''s holding you back in the room right now?'),

('addressMindsetChallenge', 'general', 'How do I actually internalise my achievements instead of brushing them off?',
 'Keeping a running written log of wins as they happen makes them much harder to dismiss than relying on memory alone.',
 'Keep a running log of wins as they happen — it''s much harder to dismiss something in writing than in your head. What''s something you''ve achieved recently that you brushed off?');
