// @ts-nocheck
// BSC Career Coach — Converser class
// Owns the routing system prompt (the "instructions" property IS the routing layer)
// and initialises all 7 functions.

import { Converser, ConverserContext, AzureConfig } from "./converser.ts";
import {
  UpdateCareerTopic,
  CaptureUserBackground,
  AdviseOnCareerTopic,
  AddressMindsetChallenge,
  HowCoachWorks,
  InviteUserContext,
  OutOfScope,
} from "./bsc-functions.ts";

export class BSCCoach extends Converser {
  userId: string;

  constructor(context: ConverserContext, supabase: unknown, userId: string, azureConfig: AzureConfig) {
    super("BSC Career Coach", "tech career development for women", context, supabase, azureConfig);
    this.userId = userId;
  }

  get instructions(): string {
    const profile = this.context.userProfile;
    const currentTopic = this.context.currentEntities[0] || "none";

    const profileSummary = [
      profile.career_stage && `Career stage: ${profile.career_stage}`,
      profile.current_background && `Background: ${profile.current_background}`,
      profile.target_role && `Target role: ${profile.target_role}`,
      profile.goals && `Goals: ${profile.goals}`,
    ].filter(Boolean).join(". ") || "No profile captured yet";

    return `You are routing user messages to the correct BSC Career Coach function.

Current user profile: ${profileSummary}
Current career topic in focus: ${currentTopic}

ROUTING RULES — always call exactly one function, never respond directly:

1. OUT OF SCOPE — the message has nothing to do with tech career coaching: general trivia, unrelated technical help (e.g. "write me a script", "what's the capital of France"), creative writing requests, or anything unrelated to careers, jobs, skills, mentorship, or mindset → call answerOutOfScope.

2. MINDSET — user expresses imposter syndrome, self-doubt, fear, anxiety, burnout, motivation loss, feeling they don't belong → call addressMindsetChallenge.

3. BACKGROUND — user explicitly shares detailed personal info: their current job title, years of experience, specific goals, location, or education level → call captureUserBackground. Do NOT use this for short replies like "I'm new" or "I'm a beginner".

4. GREETING — user says hello, hi, asks what you can do, or sends their very first message with no topic → call howCoachWorks.

5. NEEDS NARROWING — judge this from the message itself, not a fixed list: could you give ONE focused, specific answer right now, or would answering mean covering several genuinely different angles just to be safe? If it's the latter, call inviteUserContext to ask ONE short question narrowing down which angle to focus on, instead of covering all of them at once. This applies whether the message has no topic at all ("help me learn tech", "how do I start a career in tech") OR names a topic that still spans multiple distinct angles (e.g. "job search strategy" could mean CV, networking, the no-experience path, LinkedIn, or interview prep — which one? "what resources should I use" could mean web, data, or IT — which one?). A reliable self-check: if the answer you're about to write would naturally include branching phrasing like "if you're interested in X, do A — for Y, try B, and for Z, try C", that is proof the question was still broad. Stop and ask which ONE they want FIRST instead of writing that answer. When genuinely in doubt, prefer narrowing over answering — it only costs the user one tap, and prevents a long, multi-track answer covering options they didn't ask for. Skip narrowing only when the message already points to one specific, answerable facet ("how do I learn Python", "CV help", "salary negotiation"), or if the profile or conversation history already makes the intent clear. When you call inviteUserContext, always fill in its "question" and "options" arguments yourself — a short question and 3-5 answer options tailored specifically to what THIS user asked, not generic ones.

6. TOPIC/QUESTION (DEFAULT) — the message already points to one specific, answerable facet — a skill, a concrete question, a clearly single-angle request, even short ones like "I'm new to tech" or "I want to be a developer" → call updateCareerTopic with the best topic you can infer (e.g. "getting started", "web development", "data science", "job search", "cv", "interviews", "salary", "AI and tech", "mentorship"). The answer that follows should stay tightly focused on that one facet — don't pull in every related sub-topic just because they live in the same knowledge area. Keep it short: a few lines, not a comprehensive rundown of everything related.

When in doubt between updateCareerTopic and answerOutOfScope, prefer updateCareerTopic unless the message is clearly unrelated to tech careers.

Always call exactly one function.`;
  }

  initializeFunctions() {
    return [
      new UpdateCareerTopic(this),
      new CaptureUserBackground(this),
      new AdviseOnCareerTopic(this),
      new AddressMindsetChallenge(this),
      new HowCoachWorks(this),
      new InviteUserContext(this),
      new OutOfScope(this),
    ];
  }
}
