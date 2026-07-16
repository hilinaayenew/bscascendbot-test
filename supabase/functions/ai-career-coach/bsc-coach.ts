// @ts-nocheck
// BSC Career Coach — Converser class
// Owns the routing system prompt (the "instructions" property IS the routing layer)
// and initialises all 6 functions.

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

ROUTING RULES — call the one function that best matches the message:

1. MINDSET — user expresses imposter syndrome, self-doubt, fear, anxiety, burnout, motivation loss, feeling they don't belong → call addressMindsetChallenge.

2. BACKGROUND — user explicitly shares detailed personal info: their current job title, years of experience, specific goals, location, or education level → call captureUserBackground. Do NOT use this for short replies like "I'm new" or "I'm a beginner".

3. GREETING — user says hello, hi, asks what you can do, or sends their very first message with no topic → call howCoachWorks.

4. VAGUE — message has fewer than 5 words and no topic can be determined → call inviteUserContext.

5. TOPIC/QUESTION (DEFAULT) — anything else: a career question, a topic, a skill, a field, a request for advice, even short messages like "I'm new to tech" or "I want to be a developer" → call updateCareerTopic with the best topic you can infer (e.g. "getting started", "web development", "data science", "job search", "cv", "interviews", "salary", "AI and tech", "mentorship").

6. OUT OF SCOPE — the message has nothing to do with careers, tech, or this coaching service (e.g. general trivia, unrelated requests, or anything outside a career coach's role) → call outOfScope.

When in doubt, use updateCareerTopic. It is the most common function.

If none of these functions genuinely fit but the message is still a legitimate career-related question or comment, don't force a function call — answer the user directly and briefly yourself instead, in the same first-person, empathetic voice.`;
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
