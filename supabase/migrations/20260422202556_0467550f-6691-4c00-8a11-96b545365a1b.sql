
DO $$
DECLARE
  v_course_id uuid;
BEGIN
  -- Create the course
  INSERT INTO public.courses (title, description, audience, cohort_label, published)
  VALUES (
    'The Art of Mentorship: A Guide for BSC Mentors',
    'A comprehensive, self-paced course built from the official Because She Can Mentorship Handbook. Learn how to be a trusted advisor, structure impactful sessions, and guide your mentee through a successful 3-month journey in tech.',
    'mentor',
    'Cohort V — 2026',
    true
  )
  RETURNING id INTO v_course_id;

  -- ============================================================
  -- MODULE 1 — Foundations: Understanding Because She Can
  -- ============================================================
  INSERT INTO public.course_checklist_items (course_id, title, description, resource_url, target_role, sort_order) VALUES
  (v_course_id,
   'Module 1.1 — Why Because She Can exists',
   'Read the founding story of BSC. Our co-founders studied tech and experienced first-hand what it feels like to affirm their position in a male-dominated space. BSC exists to change that — to encourage more girls into tech, and to guide women who have no idea what career to venture into. As a mentor, you are the front line of that mission. Reflect: what does it mean to you to "talk a young woman out of the ideology that certain fields are not tailored for women"?',
   'https://becauseshecan.tech',
   'mentor', 10),

  (v_course_id,
   'Module 1.2 — Vision, Mission, and your role within them',
   'BSC''s vision is to bridge the gap between women in tech on the job and aspiring girls, and to grow a community of successful women who solve challenges while encouraging others into the field. The mission: to encourage and empower women and girls to excel in technology disciplines and roles. Every conversation you have with your mentee is an act of mission delivery. Write down — in one sentence — how you personally plan to advance this mission over the next 3 months.',
   NULL, 'mentor', 20),

  (v_course_id,
   'Module 1.3 — How the Cohort V program works',
   'Our flagship program is a 3-month intensive that pairs mentees with industry professionals across Data Science/Analytics, Frontend, Backend, UI/UX, Product/Program Management, Mobile Engineering, and Cybersecurity. Mentors and mentees fill out monthly feedback forms and have monthly feedback calls with the BSC team to track progress. Three compulsory career workshops per month (Resume Writing, Personal Branding, Job Search & Navigation) run alongside. Make sure you understand where the program starts, where it ends, and what is expected of you each month.',
   NULL, 'mentor', 30),

  -- ============================================================
  -- MODULE 2 — What it means to be a great mentor
  -- ============================================================
  (v_course_id,
   'Module 2.1 — The mentor mindset',
   '"At its core, being a mentor is being a trusted advisor. It all boils down to making yourself available to support and advise someone when they need it, delivering that support in a way that makes sense to them, and always keeping that person''s best interests in mind." Internalise this definition. You are not a teacher, not a manager, and not a fixer — you are a trusted advisor. Your authority comes from earned trust, not from your title.',
   NULL, 'mentor', 40),

  (v_course_id,
   'Module 2.2 — Build trust deliberately',
   'Trust is the foundation of every effective mentorship. Apply these ten habits from the BSC handbook in every interaction:

• Know when to give advice — and when to listen. Respect their boundaries.
• Set expectations together at the very beginning.
• Don''t assume anything about your mentee — ask.
• Take a genuine interest in your mentee as a person, not just as a mentee.
• Celebrate their achievements, big and small.
• Communicate clearly and listen actively.
• Let your mentee make their own decisions.
• Be willing to offer constructive criticism — kindly, specifically, and with care.
• Create a recurring schedule with your mentee and protect it.
• Be open about your own mistakes — vulnerability builds connection.',
   NULL, 'mentor', 50),

  (v_course_id,
   'Module 2.3 — Set expectations in your first call',
   'Before you dive into anything technical, agree on the ground rules. Cover: meeting cadence and length, preferred communication channel between sessions, what your mentee hopes to achieve in 3 months, what you can and cannot help with, and how you will both handle missed sessions. Write the agreement down and share it. Setting expectations early prevents almost every problem later.',
   NULL, 'mentor', 60),

  (v_course_id,
   'Module 2.4 — Active listening and powerful questions',
   'Mentors talk less than mentees. Practise these four habits in every session: (1) restate what you heard before responding, (2) ask open-ended questions that begin with "What", "How", or "Tell me more about…", (3) sit with silence — give your mentee room to think, (4) never solve a problem your mentee hasn''t finished describing. The best mentors leave their mentees feeling smarter, not lectured.',
   NULL, 'mentor', 70),

  -- ============================================================
  -- MODULE 3 — The Six Pillars of Mentorship Impact
  -- ============================================================
  (v_course_id,
   'Module 3.1 — Pillar 1: Mentee''s Portfolio Development',
   'Help your mentee build a single end-to-end project that aligns with their interests and showcases their skills. Your job:
• Help them define the scope, milestones, and deliverables.
• Provide guidance throughout — technical expertise, feedback, and emotional support.
• Hold them accountable to ship something real by the end of the program.

A finished portfolio piece is worth more than ten started ones. Push for completion.',
   NULL, 'mentor', 80),

  (v_course_id,
   'Module 3.2 — Pillar 2: Skill Advancement',
   'Support your mentee in acquiring new technical skills or sharpening existing ones. Practical steps:
• In month 1, identify 2–3 specific skill gaps with them.
• Set measurable goals (e.g., "Build a REST API in Node by week 6").
• In every session, briefly assess progress and adjust.

Skills are built through repetition, not lectures. Assign small, weekly stretch tasks.',
   NULL, 'mentor', 90),

  (v_course_id,
   'Module 3.3 — Pillar 3: Professional Growth',
   'Guide your mentee in setting career goals beyond just code. Help them:
• Identify and attend at least one conference, workshop, or networking event during the program.
• Improve their LinkedIn presence, GitHub profile, or design portfolio.
• Reflect on the impact of those activities on their growth.

Tech careers are accelerated by visibility, not just skill.',
   NULL, 'mentor', 100),

  (v_course_id,
   'Module 3.4 — Pillar 4: Knowledge Transfer',
   'Share what you know — generously. The handbook''s guidance:
• Share your knowledge, expertise, and lived experiences in tech.
• Assess whether your mentee actually understood and can apply what you shared.
• Encourage them to ask questions, seek clarification, and demonstrate learning through discussion and concrete examples.

Don''t assume understanding — ask them to teach the concept back to you.',
   NULL, 'mentor', 110),

  (v_course_id,
   'Module 3.5 — Pillar 5: Self-Reflection and Goal Achievement',
   'Mentorship sticks when mentees own their growth. Build a reflection habit:
• Start each monthly call with: "What went well? What got in your way? What will you change?"
• Encourage them to set personal goals and track progress visibly.
• Celebrate progress publicly inside your pairing.

Ownership is the single biggest predictor of long-term career growth.',
   NULL, 'mentor', 120),

  (v_course_id,
   'Module 3.6 — Pillar 6: Project & Time Management',
   'Many mentees are technically capable but struggle to ship. Teach the meta-skills:
• Help them break large tasks into small, time-boxed pieces.
• Show them how you plan your own week (calendar, task list, priorities).
• Evaluate whether they''re actually meeting deadlines and delivering on schedule.

A mentee who learns to manage their time outlives any single project.',
   NULL, 'mentor', 130),

  -- ============================================================
  -- MODULE 4 — Running an effective mentorship session
  -- ============================================================
  (v_course_id,
   'Module 4.1 — Anatomy of a great 1:1 session',
   'A repeatable session structure beats improvisation every time. Try this 45-minute template:

• 5 min — Personal check-in (how are you, really?)
• 5 min — Wins and blockers since last session
• 20 min — Focused discussion on one topic the mentee chose in advance
• 10 min — Live work or feedback (code review, portfolio look, mock interview)
• 5 min — Action items for next session, written down by the mentee

Always end with: "What is the one thing you will do before we meet again?"',
   NULL, 'mentor', 140),

  (v_course_id,
   'Module 4.2 — Build the action plan together',
   'In month 1 you are required to come up with an action plan with your mentee. Write it together — do not hand it to them. The plan should include: a 3-month outcome, monthly milestones, weekly habits, and the portfolio project. Keep it on one page so it stays alive. Revisit it at the start of every monthly feedback call.',
   NULL, 'mentor', 150),

  (v_course_id,
   'Module 4.3 — Giving feedback that lands',
   'Use the SBI model: Situation → Behaviour → Impact. Example: "In yesterday''s code review (situation), you defended your approach before reading my comments (behaviour) — it made it harder for me to help you improve (impact)." Be kind, be specific, be soon. Praise in public, correct in private — and always invite a response.',
   NULL, 'mentor', 160),

  (v_course_id,
   'Module 4.4 — Handling difficult moments',
   'You will hit hard conversations: missed sessions, missed deadlines, low confidence, family pressure, imposter syndrome. Your defaults:
• Address the issue directly but privately.
• Separate the behaviour from the person.
• Ask before advising — "Do you want me to listen, or do you want my take?"
• If you feel out of your depth, escalate to the BSC team via mentorship@becauseshecan.tech.',
   NULL, 'mentor', 170),

  -- ============================================================
  -- MODULE 5 — Program Schedule & Operational Expectations
  -- ============================================================
  (v_course_id,
   'Module 5.1 — Onboarding (May 2026)',
   'Your onboarding tasks before the program officially starts:
• Fill out the mentor agreement form.
• Reach out to your mentee to introduce yourself and get to know them as a person.
• Attend the Onboarding Email kickoff and the live Onboarding Call.
• Confirm your meeting cadence (we recommend weekly, 45 minutes).

Note: the full schedule also lives inside the Ascendency web app — bookmark it.',
   NULL, 'mentor', 180),

  (v_course_id,
   'Module 5.2 — Month 1: Foundations & Action Plan',
   'Month 1 milestones:
• Complete the Month 1 Feedback Form before your monthly feedback call with BSC.
• Co-create the action plan with your mentee.
• Attend the Month 1 Workshop (tentative) — workshops focus on building soft skills and are compulsory for mentees. Mentors are strongly encouraged to attend.
• Confirm the portfolio project topic with your mentee.',
   NULL, 'mentor', 190),

  (v_course_id,
   'Module 5.3 — Month 2: Build & Iterate',
   'Month 2 milestones:
• Complete the Month 2 Feedback Form ahead of your monthly call.
• Attend the Month 2 Workshop (tentative).
• Track portfolio project progress weekly — your mentee should have a working draft by month-end.
• Note: there is a mentorship hangout in October. Venue and date are yet to be determined. We strongly encourage everyone to attend, meet their mentees in person, and network.',
   NULL, 'mentor', 200),

  (v_course_id,
   'Module 5.4 — Month 3: Ship & Reflect',
   'Month 3 milestones:
• Complete the Month 3 Feedback Form before your final feedback call.
• Attend the Month 3 Workshop (tentative).
• Help your mentee finalise and present their portfolio project.
• Join the End of Mentorship Call — this closes the formal program.
• Pairs who wish to continue mentoring after the program ends may do so, but it will not be under the auspices of BSC.',
   NULL, 'mentor', 210),

  -- ============================================================
  -- MODULE 6 — Recommended Resources by Discipline
  -- ============================================================
  (v_course_id,
   'Module 6.1 — Full Stack Development',
   'Curated reading and tutorials your mentee can lean on between sessions. Use these as starting points — your lived experience is still the most valuable resource you bring.',
   'https://roadmap.sh/full-stack',
   'mentor', 220),

  (v_course_id,
   'Module 6.2 — Frontend Development',
   'Pointers to high-quality frontend learning paths. Pair these with hands-on project work — knowledge without shipping doesn''t stick.',
   'https://roadmap.sh/frontend',
   'mentor', 230),

  (v_course_id,
   'Module 6.3 — Backend Development',
   'Backend roadmaps and best practices. Encourage your mentee to build at least one API end-to-end during the program.',
   'https://roadmap.sh/backend',
   'mentor', 240),

  (v_course_id,
   'Module 6.4 — UI/UX Design',
   'Design fundamentals, tooling, and case-study libraries. Push your mentee to publish a Figma case study by program end.',
   'https://www.nngroup.com/articles/',
   'mentor', 250),

  (v_course_id,
   'Module 6.5 — Data Science & Analytics',
   'Recommended Python, SQL, and statistics resources. The portfolio bar here is one cleaned dataset turned into one clear story.',
   'https://roadmap.sh/ai-data-scientist',
   'mentor', 260),

  (v_course_id,
   'Module 6.6 — Cybersecurity',
   'Foundational security learning paths. Pair theory with hands-on labs (TryHackMe, HackTheBox).',
   'https://roadmap.sh/cyber-security',
   'mentor', 270),

  (v_course_id,
   'Module 6.7 — Product / Project Management',
   'Frameworks for discovery, prioritisation, and delivery. A great PM portfolio is one well-documented case study, not a CV.',
   'https://roadmap.sh/product-manager',
   'mentor', 280),

  (v_course_id,
   'Module 6.8 — Mobile Engineering',
   'iOS, Android, and cross-platform learning resources. Encourage shipping a real app to a store or TestFlight.',
   'https://roadmap.sh/android',
   'mentor', 290),

  -- ============================================================
  -- MODULE 7 — Capstone Reflection
  -- ============================================================
  (v_course_id,
   'Module 7.1 — Your mentor commitment statement',
   'Write a short statement (3–5 sentences) describing the mentor you intend to be over the next 3 months. Include: how often you''ll meet, what you most want your mentee to walk away with, and one habit you commit to (e.g., "I will respond to messages within 48 hours"). Save it somewhere you''ll re-read in month 2.',
   NULL, 'mentor', 300),

  (v_course_id,
   'Module 7.2 — Stay connected with the BSC team',
   'You are never mentoring alone. For anything — escalations, questions, ideas, wins worth celebrating — reach the team at mentorship@becauseshecan.tech or +233 50 690 0543. Follow @becauseshecan_ to share your journey and amplify the mission.',
   'mailto:mentorship@becauseshecan.tech',
   'mentor', 310);

END $$;
