// @ts-nocheck
// Botema — Career Coach persona
// Direct, personal, African-context aware. Uses Otema's Q&A examples as few-shot data.

import { Converser, ConverserContext, AzureConfig, WordaliseFunction, InstructionsFunction, EngageFunction, OAIMessage, ChatFunction, FunctionType } from "./converser.ts";
import { UpdateCareerTopic, CaptureUserBackground, InviteUserContext } from "./bsc-functions.ts";
import { KNOWLEDGE_BASE, classifyTopic, GENERAL_FALLBACK } from "./bsc-knowledge.ts";
import { BOTEMA_EXAMPLES, BOTEMA_SYSTEM_PROMPT } from "./botema-examples.ts";

async function callAzure(
  azure: AzureConfig,
  messages: OAIMessage[],
  opts: { maxTokens?: number } = {}
): Promise<string> {
  const url = `${azure.endpoint}openai/deployments/${azure.deployment}/chat/completions?api-version=${azure.apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": azure.apiKey },
    body: JSON.stringify({
      messages,
      max_completion_tokens: opts.maxTokens ?? 2000,
    }),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Azure OpenAI error:", data); throw new Error("Azure OpenAI call failed"); }
  const content = data.choices?.[0]?.message?.content;
  if (!content) console.error("Azure OpenAI returned empty content, finish_reason:", data.choices?.[0]?.finish_reason);
  return content || "I wasn't able to generate a response. Please try again.";
}

// ── WORDALISE 1: Botema career advice ──────────────────────────────────────
class BotemaAdvise extends WordaliseFunction {
  get name() { return "adviseOnCareerTopic"; }
  get description() { return "Give career advice in Botema's direct, personal voice."; }

  getDomainKnowledge(_args: Record<string, unknown>): string {
    const topic = this.converser.context.currentEntities[0] || "general";
    const userProfile = this.converser.context.userProfile;
    let knowledge = KNOWLEDGE_BASE[topic] || GENERAL_FALLBACK;
    if (userProfile.current_background || userProfile.target_role || userProfile.career_stage) {
      knowledge = `User context: ${[
        userProfile.career_stage && `Career stage: ${userProfile.career_stage}`,
        userProfile.current_background && `Background: ${userProfile.current_background}`,
        userProfile.target_role && `Target role: ${userProfile.target_role}`,
        userProfile.goals && `Goals: ${userProfile.goals}`,
      ].filter(Boolean).join(". ")}\n\n${knowledge}`;
    }
    return knowledge;
  }

  async loadFewShotExamples() {
    return BOTEMA_EXAMPLES.adviseOnCareerTopic.map(ex => ({
      question: ex.question,
      knowledge: "",
      answer: ex.answer,
    }));
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: BOTEMA_SYSTEM_PROMPT + " If the user's question has nothing to do with tech careers, jobs, skills, mentorship, or mindset (e.g. travel, general trivia, unrelated technical help), do not answer it — say briefly that it's outside what you help with, and redirect to tech career topics instead.",
      },
      ...history,
      { role: "user", content: prompt },
    ];
    return callAzure(this.converser.azureConfig, messages);
  }
}

// ── WORDALISE 2: Botema mindset support ───────────────────────────────────
class BoteMindset extends WordaliseFunction {
  get name() { return "addressMindsetChallenge"; }
  get description() { return "Call when the user expresses imposter syndrome, self-doubt, lack of confidence, burnout, or motivation difficulties."; }
  get parameters() {
    return {
      type: "object",
      properties: {
        challenge_type: { type: "string", description: "imposter_syndrome, confidence, motivation, burnout, belonging, or general" },
      },
      required: [],
    };
  }

  getDomainKnowledge(_args: Record<string, unknown>): string {
    return KNOWLEDGE_BASE["mindset"] + "\n\n---\n\n" + KNOWLEDGE_BASE["wellbeing"];
  }

  async loadFewShotExamples() {
    return BOTEMA_EXAMPLES.addressMindsetChallenge.map(ex => ({
      question: ex.question,
      knowledge: "",
      answer: ex.answer,
    }));
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: BOTEMA_SYSTEM_PROMPT + " When addressing a mindset challenge, lead with acknowledgement of what the user is feeling before offering any advice. Be warm and honest.",
      },
      ...history,
      { role: "user", content: prompt },
    ];
    return callAzure(this.converser.azureConfig, messages);
  }
}

// ── INSTRUCTIONS: how Botema works ────────────────────────────────────────
class BotemaHowItWorks extends InstructionsFunction {
  get name() { return "howCoachWorks"; }
  get description() { return "Call when the user asks what the coach does or says hello without context."; }

  getInstructionsContent(): string {
    const profile = this.converser.context.userProfile;
    const hasProfile = profile.career_stage || profile.target_role || profile.current_background;
    return hasProfile
      ? "Hi, welcome back. I'm Botema, your BSC Career Coach — how can I help you today?"
      : "Hi, I'm Botema, your BSC Career Coach — how can I help you today?";
  }
}

// ── INSTRUCTIONS: out of scope (Botema voice) ──────────────────────────────
class BotemaOutOfScope extends InstructionsFunction {
  get name() { return "answerOutOfScope"; }
  get description() { return "Call this when the user's message has nothing to do with tech career coaching — general trivia, unrelated technical help, creative writing requests, or anything unrelated to careers, jobs, skills, mentorship, or mindset."; }

  getInstructionsContent(): string {
    return `That one's outside my lane — I'm Botema, your BSC Career Coach, and I stick to tech careers: getting started, choosing a path, CVs and job search, interview prep, salary negotiation, further education, mentorship, and the mindset side of a career change.

If you've got a tech career question, bring it — I'll give you my honest take. What's going on with your career right now?`;
  }
}

// ── ENGAGE: invite user context (Botema voice) ────────────────────────────
class BotemaInvite extends EngageFunction {
  get name() { return "inviteUserContext"; }
  get description() { return "Call when the user's message is vague or you need more context."; }

  getEngagementPrompt(): string {
    const profile = this.converser.context.userProfile;
    const currentTopic = this.converser.context.currentEntities[0];

    if (!profile.career_stage && !profile.current_background && !currentTopic) {
      return `I'm glad you're here. To give you advice that's actually relevant to where you are, it helps me to know a little about your situation.

What's your starting point — are you completely new to tech, switching from another career, or already in the field and looking to grow? And what's the one thing you most want to figure out right now?`;
    }

    if (currentTopic && !profile.career_stage) {
      return `That's a good area to focus on. Before I give you specific advice, tell me a bit more about yourself.

What's your background — what do you do now, or what were you doing before you started thinking about tech? And what are you aiming for?`;
    }

    return `What would be most useful to work through right now? Tell me what's on your mind and we'll go from there.`;
  }
}

// ── BotemaCoach ───────────────────────────────────────────────────────────
export class BotemaCoach extends Converser {
  userId: string;

  constructor(context: ConverserContext, supabase: unknown, userId: string, azureConfig: AzureConfig) {
    super("Botema", "tech career development for women", context, supabase, azureConfig);
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

    return `You are routing user messages to the correct Botema Career Coach function.

Current user profile: ${profileSummary}
Current career topic in focus: ${currentTopic}

ROUTING RULES — always call exactly one function, never respond directly:

1. OUT OF SCOPE — the message has nothing to do with tech career coaching: general trivia, unrelated technical help (e.g. "write me a script", "what's the capital of France"), creative writing requests, or anything unrelated to careers, jobs, skills, mentorship, or mindset → call answerOutOfScope.

2. MINDSET — user expresses fear, self-doubt, imposter syndrome, burnout, anxiety, motivation loss, feeling they don't belong → call addressMindsetChallenge.

3. BACKGROUND — user explicitly shares detailed personal info: their current job title, years of experience, specific goals, location, or education level → call captureUserBackground. Do NOT use this for short replies like "I'm new" or "I'm a beginner".

4. GREETING — user says hello, hi, asks what you can do, or sends their very first message with no topic → call howCoachWorks.

5. VAGUE — message has fewer than 5 words and no topic can be determined → call inviteUserContext.

6. TOPIC/QUESTION (DEFAULT) — anything else: a career question, a topic, a skill, a field, a request for advice, even short messages like "I'm new to tech" or "I want to be a developer" → call updateCareerTopic with the best topic you can infer.

When in doubt between updateCareerTopic and answerOutOfScope, prefer updateCareerTopic unless the message is clearly unrelated to tech careers.

Always call exactly one function.`;
  }

  initializeFunctions(): ChatFunction[] {
    return [
      new UpdateCareerTopic(this),
      new CaptureUserBackground(this),
      new BotemaAdvise(this),
      new BoteMindset(this),
      new BotemaHowItWorks(this),
      new BotemaInvite(this),
      new BotemaOutOfScope(this),
    ];
  }
}