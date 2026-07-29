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

5. NEEDS NARROWING — the message is a broad, open-ended ask ("help me learn tech", "I want to get into tech in [country]", "how do I start a career in tech") that could go in several directions, AND the profile above shows "No profile captured yet" (we don't yet know their background or what specifically they want) → call inviteUserContext to ask ONE focused question narrowing down what they want to focus on, instead of answering broadly. Do NOT use this if the message already names a specific skill, role, field, or challenge (e.g. "how do I learn Python", "CV help", "salary negotiation") — those go to rule 6 even if short. Also skip this if the profile already has real detail captured — answer directly instead.

6. TOPIC/QUESTION (DEFAULT) — anything else: a career question, a topic, a skill, a field, a request for advice, even short messages like "I'm new to tech" or "I want to be a developer" → call updateCareerTopic with the best topic you can infer (e.g. "getting started", "web development", "data science", "job search", "cv", "interviews", "salary", "AI and tech", "mentorship").

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
