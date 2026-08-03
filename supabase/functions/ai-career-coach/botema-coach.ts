// @ts-nocheck
// Botema — Career Coach persona
// Direct, personal, African-context aware. Uses Otema's Q&A examples as few-shot data.

import { Converser, ConverserContext, AzureConfig, WordaliseFunction, InstructionsFunction, EngageFunction, OAIMessage, ChatFunction, FunctionType, withChoices } from "./converser.ts";
import { UpdateCareerTopic, CaptureUserBackground, InviteUserContext } from "./bsc-functions.ts";
import { KNOWLEDGE_BASE, GENERAL_FALLBACK } from "./bsc-knowledge.ts";
import { BOTEMA_EXAMPLES, BOTEMA_SYSTEM_PROMPT } from "./botema-examples.ts";

// Single Azure OpenAI chat-completions call. Returns null content (not a
// thrown error) if the API responded OK but with no visible text — that
// happens when gpt-5-nano, a reasoning model, spends its whole token budget
// on hidden reasoning (see README §6). A thrown error means the API call
// itself failed (bad request, auth, etc.), a real problem callAzure() below
// won't paper over.
async function callAzureOnce(
  azure: AzureConfig,
  messages: OAIMessage[],
  maxTokens: number
): Promise<{ content: string | null; finishReason?: string }> {
  const url = `${azure.endpoint}openai/deployments/${azure.deployment}/chat/completions?api-version=${azure.apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": azure.apiKey },
    body: JSON.stringify({ messages, max_completion_tokens: maxTokens }),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Azure OpenAI error:", data); throw new Error("Azure OpenAI call failed"); }
  return { content: data.choices?.[0]?.message?.content || null, finishReason: data.choices?.[0]?.finish_reason };
}

// Helper: call Azure OpenAI chat completions, with one automatic retry at
// double the token budget if the first attempt comes back empty — quietly
// recovering from the reasoning-token-starvation gotcha instead of showing
// the user a dead end that makes them retype their message.
async function callAzure(
  azure: AzureConfig,
  messages: OAIMessage[],
  opts: { maxTokens?: number } = {}
): Promise<string> {
  const baseTokens = opts.maxTokens ?? 2000;

  let result = await callAzureOnce(azure, messages, baseTokens);
  if (!result.content) {
    console.error(`Azure OpenAI returned empty content (finish_reason: ${result.finishReason}) — retrying with a larger token budget.`);
    result = await callAzureOnce(azure, messages, baseTokens * 2);
    if (!result.content) {
      console.error(`Azure OpenAI still returned empty content after retry (finish_reason: ${result.finishReason}).`);
    }
  }

  return result.content || "I wasn't able to generate a response. Please try again.";
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

  async loadFewShotExamples(_args: Record<string, unknown> = {}, limit = 3) {
    const topic = this.converser.context.currentEntities[0];
    const pool = BOTEMA_EXAMPLES.adviseOnCareerTopic;
    const matched = topic ? pool.filter(ex => ex.topic === topic) : [];
    const chosen = (matched.length > 0 ? matched : pool).slice(0, limit);
    return chosen.map(ex => ({ question: ex.question, knowledge: "", answer: ex.answer }));
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

  async loadFewShotExamples(args: Record<string, unknown> = {}, limit = 3) {
    const topic = args.challenge_type as string | undefined;
    const pool = BOTEMA_EXAMPLES.addressMindsetChallenge;
    const matched = topic ? pool.filter(ex => ex.topic === topic) : [];
    const chosen = (matched.length > 0 ? matched : pool).slice(0, limit);
    return chosen.map(ex => ({ question: ex.question, knowledge: "", answer: ex.answer }));
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

  get parameters() {
    return {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "A short, one-sentence question narrowing down what the user wants, tailored to their message (e.g. \"What area of tech interests you most?\"). Keep it brief — no preamble.",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "3-5 short, mutually exclusive answer options for the question above (each under 6 words), tailored to what the user actually asked — not generic filler.",
        },
      },
      required: ["question", "options"],
    };
  }

  getAreaQuestion(): string {
    return withChoices("Happy to help — what area of tech interests you most?", [
      "Web/software development",
      "Data & AI/Machine Learning",
      "UX design",
      "Cybersecurity",
      "IT support / networking",
      "Not sure yet — need guidance",
    ]);
  }

  getEngagementPrompt(args: Record<string, unknown> = {}): string {
    const profile = this.converser.context.userProfile;
    const currentTopic = this.converser.context.currentEntities[0];

    if (args.forceAreaQuestion) return this.getAreaQuestion();

    const aiQuestion = typeof args.question === "string" ? args.question.trim() : "";
    const aiOptions = Array.isArray(args.options)
      ? args.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0)
      : [];
    if (aiQuestion && aiOptions.length > 0) {
      return withChoices(aiQuestion, aiOptions);
    }

    if (!profile.career_stage && !profile.current_background && !currentTopic) return this.getAreaQuestion();

    if (currentTopic && !profile.career_stage) {
      return withChoices("Good focus. Quick one first — where are you starting from?", [
        "Completely new to tech",
        "Switching from another career",
        "Already in the field",
      ]);
    }

    return withChoices("What would be most useful right now?", [
      "My CV",
      "Interview prep",
      "A specific decision",
      "Something else",
    ]);
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

5. NEEDS NARROWING — the message is a broad, open-ended ask ("help me learn tech", "I want to get into tech in [country]", "how do I start a career in tech") that could go in several directions, AND the profile above shows "No profile captured yet" (we don't yet know their background or what specifically they want) → call inviteUserContext to ask ONE focused question narrowing down what they want to focus on, instead of answering broadly. Do NOT use this if the message already names a specific skill, role, field, or challenge (e.g. "how do I learn Python", "CV help", "salary negotiation") — those go to rule 6 even if short. Also skip this if the profile already has real detail captured — answer directly instead. When you call inviteUserContext, always also fill in its "question" and "options" arguments yourself — a short question and 3-5 answer options tailored specifically to what THIS user asked, not generic ones.

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