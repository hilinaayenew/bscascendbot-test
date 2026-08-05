// @ts-nocheck
// Botema — Career Coach persona
// Direct, personal, African-context aware. Uses Otema's Q&A examples as few-shot data.

import { Converser, ConverserContext, AzureConfig, WordaliseFunction, InstructionsFunction, EngageFunction, OAIMessage, ChatFunction, FunctionType, withChoices, NARROW_SELF_CHECK, resolveNarrowOrAnswer, pickRandom } from "./converser.ts";
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
    const chosen = pickRandom(matched.length > 0 ? matched : pool, limit);
    return chosen.map(ex => ({ question: ex.question, knowledge: "", answer: ex.answer }));
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: BOTEMA_SYSTEM_PROMPT + ` Never start your answer with a filler acknowledgment like "Great question," "Good question," or "Nice" — get straight to the point. The knowledge you're given may cover several sub-areas of this topic — answer only the specific angle the user actually asked about, don't summarize every related sub-area 'just in case'. ${NARROW_SELF_CHECK} Otherwise, if the user's question isn't about a TECH career specifically — general trivia, unrelated technical help, or explicitly wanting a career/field that is NOT tech — do not answer it — say briefly that it's outside what you help with, and redirect to tech career topics instead. Being about careers/jobs in general isn't enough; it has to be about tech.`,
      },
      ...history,
      { role: "user", content: prompt },
    ];
    const raw = await callAzure(this.converser.azureConfig, messages);
    return resolveNarrowOrAnswer(raw);
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
    const chosen = pickRandom(matched.length > 0 ? matched : pool, limit);
    return chosen.map(ex => ({ question: ex.question, knowledge: "", answer: ex.answer }));
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: BOTEMA_SYSTEM_PROMPT + ` Be warm and honest when addressing a mindset challenge, but never open with a stock acknowledgment phrase like "I hear you," "That sounds hard," or "Great question." Get straight into a helpful, specific response.`,
      },
      ...history,
      { role: "user", content: prompt },
    ];
    const raw = await callAzure(this.converser.azureConfig, messages);
    return resolveNarrowOrAnswer(raw);
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

1. OUT OF SCOPE — the message has nothing to do with TECH career coaching specifically: general trivia, unrelated technical help (e.g. "write me a script", "what's the capital of France"), creative writing requests, explicitly wanting a career/field/job that is NOT tech (e.g. "a field unrelated to tech", "I don't want to work in tech"), or anything else unrelated to tech careers, jobs, skills, mentorship, or mindset → call answerOutOfScope. Being about careers/jobs in general is not enough to be in scope — it has to be about a TECH career.

2. MINDSET — user expresses fear, self-doubt, imposter syndrome, burnout, anxiety, motivation loss, feeling they don't belong → call addressMindsetChallenge.

3. BACKGROUND — user explicitly shares detailed personal info: their current job title, years of experience, specific goals, location, or education level → call captureUserBackground. Do NOT use this for short replies like "I'm new" or "I'm a beginner".

4. GREETING — user says hello, hi, asks what you can do, or sends their very first message with no topic → call howCoachWorks.

5. NEEDS NARROWING — judge this from the message itself, not a fixed list: could you give ONE focused, specific answer right now, or would answering mean covering several genuinely different angles just to be safe? If it's the latter, call inviteUserContext to ask ONE short question narrowing down which angle to focus on, instead of covering all of them at once. This applies whether the message has no topic at all ("help me learn tech", "how do I start a career in tech") OR names a topic that still spans multiple distinct angles (e.g. "job search strategy" could mean CV, networking, the no-experience path, LinkedIn, or interview prep — which one? "what resources should I use" could mean web, data, or IT — which one?). A reliable self-check: if the answer you're about to write would naturally include branching phrasing like "if you're interested in X, do A — for Y, try B, and for Z, try C", that is proof the question was still broad. Stop and ask which ONE they want FIRST instead of writing that answer. When genuinely in doubt, prefer narrowing over answering — it only costs the user one tap, and prevents a long, multi-track answer covering options they didn't ask for. Skip narrowing only when the message already points to one specific, answerable facet ("how do I learn Python", "CV help", "salary negotiation"), or if the profile or conversation history already makes the intent clear. When you call inviteUserContext, always fill in its "question" and "options" arguments yourself — a short question and 3-5 answer options tailored specifically to what THIS user asked, not generic ones.

6. TOPIC/QUESTION (DEFAULT) — the message already points to one specific, answerable facet — a skill, a concrete question, a clearly single-angle request, even short ones like "I'm new to tech" or "I want to be a developer" → call updateCareerTopic with the best topic you can infer. The answer that follows should stay tightly focused on that one facet — don't pull in every related sub-topic just because they live in the same knowledge area. Keep it short: a few lines, not a comprehensive rundown of everything related.

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