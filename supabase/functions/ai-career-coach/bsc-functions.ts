// @ts-nocheck
// BSC Career Coach — 7 domain-specific functions
// Mirrors the Movivid functions pattern from vivid-insights-main/examples/movivid/movivid_functions.py
//
// Function map:
//   updateCareerTopic     (CHANGE_CONTEXT) → adviseOnCareerTopic
//   captureUserBackground (CHANGE_CONTEXT) → inviteUserContext
//   adviseOnCareerTopic   (WORDALISE)
//   addressMindsetChallenge (WORDALISE)
//   howCoachWorks         (INSTRUCTIONS)
//   answerOutOfScope      (INSTRUCTIONS)
//   inviteUserContext     (ENGAGE)

import {
  ChangeContextFunction,
  WordaliseFunction,
  InstructionsFunction,
  EngageFunction,
  Converser,
  AzureConfig,
  OAIMessage,
  withChoices,
  NARROW_SELF_CHECK,
  LONG_FORM_ESCAPE_HATCH,
  resolveNarrowOrAnswer,
} from "./converser.ts";
import { KNOWLEDGE_BASE, TOPIC_CATEGORIES, GENERAL_FALLBACK } from "./bsc-knowledge.ts";

const ADVISE_SYSTEM_PROMPT = `You are the BSC AI Career Coach. Answer in first person, empathetic and practical. No markdown formatting. Never start your answer with a filler acknowledgment like "Great question," "Good question," or "Nice" — get straight to the point. Default to a short, direct answer — a sentence or two, or a short paragraph at most. The knowledge below may cover several sub-areas of this topic — answer only the specific angle the user actually asked about, don't summarize every related sub-area 'just in case'. ${NARROW_SELF_CHECK} Otherwise, only give a longer, more detailed explanation if the question genuinely needs it, or the user asks you to explain more or go deeper — ${LONG_FORM_ESCAPE_HATCH} Always end with a question that invites the user to share more about their situation. If the user's question isn't about a TECH career specifically — general trivia, unrelated technical help, or explicitly wanting a career/field that is NOT tech — do not answer it — say briefly that it's outside what you help with, and redirect to tech career topics instead. Being about careers/jobs in general isn't enough; it has to be about tech.`;

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
  opts: { temperature?: number; maxTokens?: number } = {}
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

// ----------------------------------------------------------------
// CHANGE_CONTEXT 1: UpdateCareerTopic
// Triggered when user mentions a specific career area, role, or topic.
// Sets currentEntities to the classified topic, then calls adviseOnCareerTopic.
// ----------------------------------------------------------------
export class UpdateCareerTopic extends ChangeContextFunction {
  get name() { return "updateCareerTopic"; }
  get description() {
    return "Call this when the user mentions a specific career area, role, skill, or topic they want to discuss — e.g. CV writing, data science, salary negotiation, interview prep, Python, cloud computing.";
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: TOPIC_CATEGORIES,
          description: "Classify the user's message into exactly one category: getting_started (no background yet, how to begin, beginner languages, free learning resources), career_paths (roadmap for a specific role — software dev, data science, UX, cybersecurity, product management, cloud/DevOps), further_education (master's degrees, certifications, scholarships, studying while working), mentorship (finding or using a mentor/sponsor, the BSC programme), wellbeing (boundaries, burnout, work-life balance, family responsibilities, flexible working), cv_job_search (CV writing, job search strategy, LinkedIn, getting a job without experience), salary (pay, negotiation, benefits, raises), interview_prep (preparing for a technical interview), ai_impact (AI replacing jobs, using AI tools like ChatGPT/Copilot, AI ethics), mindset (imposter syndrome, confidence, belonging, motivation), or general if none of these clearly fit.",
        },
      },
      required: ["topic"],
    };
  }

  async updateContext(args: Record<string, unknown>): Promise<void> {
    const topic = (args.topic as string) || "general";
    this.converser.context.currentEntities = [topic];
  }

  getWordaliseFunction() { return "adviseOnCareerTopic"; }
}

// ----------------------------------------------------------------
// CHANGE_CONTEXT 2: CaptureUserBackground
// Triggered when user shares personal info about their situation.
// Upserts coach_user_profiles, then calls inviteUserContext.
// ----------------------------------------------------------------
export class CaptureUserBackground extends ChangeContextFunction {
  get name() { return "captureUserBackground"; }
  get description() {
    return "Call this when the user shares information about themselves — their career stage, current job, background, goals, or what they are struggling with. Extract and save this context.";
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        career_stage: {
          type: "string",
          description: "One of: complete_beginner, career_changer, early_career, growing",
        },
        current_background: {
          type: "string",
          description: "Their current role or field (e.g. nurse, teacher, junior developer)",
        },
        target_role: {
          type: "string",
          description: "The tech role or area they are aiming for",
        },
        goals: {
          type: "string",
          description: "What they want to achieve",
        },
      },
      required: [],
    };
  }

  async updateContext(args: Record<string, unknown>): Promise<void> {
    const profile = this.converser.context.userProfile;
    if (args.career_stage) profile.career_stage = String(args.career_stage);
    if (args.current_background) profile.current_background = String(args.current_background);
    if (args.target_role) profile.target_role = String(args.target_role);
    if (args.goals) profile.goals = String(args.goals);

    // Persist to database (best-effort, don't block on failure)
    try {
      const userId = (this.converser as unknown as { userId: string }).userId;
      if (userId) {
        await (this.converser.supabase as any)
          .from("coach_user_profiles")
          .upsert({
            user_id: userId,
            career_stage: profile.career_stage,
            current_background: profile.current_background,
            target_role: profile.target_role,
            goals: profile.goals,
            updated_at: new Date().toISOString(),
          });
      }
    } catch { /* non-blocking */ }
  }

  getWordaliseFunction() { return "adviseOnCareerTopic"; }
}

// ----------------------------------------------------------------
// WORDALISE 1: AdviseOnCareerTopic
// Main advice function. Uses KNOWLEDGE_BASE + wordalisations + Gemini.
// ----------------------------------------------------------------
export class AdviseOnCareerTopic extends WordaliseFunction {
  constructor(converser: Converser) {
    super(converser);
  }

  get name() { return "adviseOnCareerTopic"; }
  get description() {
    return "Generate career advice on the current topic using BSC knowledge and voice. Use after updateCareerTopic has set the current entity.";
  }

  getTopicFilter(_args: Record<string, unknown>): string | null {
    return this.converser.context.currentEntities[0] || null;
  }

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

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: ADVISE_SYSTEM_PROMPT,
      },
      ...history,
      { role: "user", content: prompt },
    ];
    const raw = await callAzure(this.converser.azureConfig, messages, { temperature: 0.7 });
    return resolveNarrowOrAnswer(raw);
  }
}

// ----------------------------------------------------------------
// WORDALISE 2: AddressMindsetChallenge
// Specialised for imposter syndrome, confidence, motivation, burnout.
// Uses mindset + wellbeing knowledge blended.
// ----------------------------------------------------------------
export class AddressMindsetChallenge extends WordaliseFunction {
  constructor(converser: Converser) {
    super(converser);
  }

  get name() { return "addressMindsetChallenge"; }
  get description() {
    return "Call this when the user expresses a mindset challenge — imposter syndrome, feeling like they don't belong, self-doubt, lack of confidence, burnout, motivation difficulties, or mental health during a career transition.";
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        challenge_type: {
          type: "string",
          description: "The specific mindset challenge: imposter_syndrome, confidence, motivation, burnout, belonging, or general",
        },
      },
      required: [],
    };
  }

  getTopicFilter(args: Record<string, unknown>): string | null {
    return (args.challenge_type as string) || null;
  }

  getDomainKnowledge(_args: Record<string, unknown>): string {
    return `${KNOWLEDGE_BASE["mindset"]}\n\n---\n\n${KNOWLEDGE_BASE["wellbeing"]}`;
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: `You are the BSC AI Career Coach addressing a mindset challenge. Be warm, honest, and grounded — but never open with a stock acknowledgment phrase like "I hear you," "That sounds hard," or "Great question." Get straight into a helpful, specific response; let the understanding come through in what you say, not a scripted opening line. Speak in first person. No markdown. Default to a short, direct response — one clear insight plus one next step is often enough. Only go longer if the situation genuinely needs more, or the user asks you to explain more or go deeper — ${LONG_FORM_ESCAPE_HATCH} End with a question that invites them to share more.`,
      },
      ...history,
      { role: "user", content: prompt },
    ];
    const raw = await callAzure(this.converser.azureConfig, messages, { temperature: 0.75 });
    return resolveNarrowOrAnswer(raw);
  }
}

// ----------------------------------------------------------------
// INSTRUCTIONS: HowCoachWorks
// Explains what the BSC AI Career Coach does and how to use it.
// ----------------------------------------------------------------
export class HowCoachWorks extends InstructionsFunction {
  get name() { return "howCoachWorks"; }
  get description() {
    return "Call this when the user asks what the coach does, how it works, or what they can ask about.";
  }

  getInstructionsContent(): string {
    const profile = this.converser.context.userProfile;
    const hasProfile = profile.career_stage || profile.target_role || profile.current_background;

    return hasProfile
      ? `Hi, welcome back. I'm your BSC AI Career Coach — how can I help you today?`
      : `Hi, I'm your BSC AI Career Coach — how can I help you today?`;
  }
}

// ----------------------------------------------------------------
// INSTRUCTIONS: OutOfScope
// Declines gracefully when the message has nothing to do with tech
// career coaching (general trivia, unrelated technical help, etc).
// ----------------------------------------------------------------
export class OutOfScope extends InstructionsFunction {
  get name() { return "answerOutOfScope"; }
  get description() {
    return "Call this when the user's message has nothing to do with tech career coaching — e.g. general trivia, requests unrelated to careers, creative writing requests, or asking you to do something other than coach them on their tech career.";
  }

  getInstructionsContent(): string {
    return `That's a bit outside what I can help with — I'm the BSC AI Career Coach, so I'm focused specifically on tech career guidance: things like getting started in tech, choosing a path, CVs and job search, interview prep, salary negotiation, further education, mentorship, and working through the mindset side of a career change.

If there's a tech career question on your mind, I'd love to help with that. What's going on with your career right now?`;
  }
}

// ----------------------------------------------------------------
// ENGAGE: InviteUserContext
// Proactively asks the user to share their background and goals.
// Context-aware: different prompts based on what we know.
// ----------------------------------------------------------------
export class InviteUserContext extends EngageFunction {
  get name() { return "inviteUserContext"; }
  get description() {
    return "Call this when the user's message is vague, they haven't shared any context yet, or you want to invite them to share more about their situation so you can give better advice.";
  }

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

    // The message itself was a broad "help me learn/get into tech" ask (set by
    // index.ts's deterministic bypass) — always ask which area, regardless of
    // what happens to be saved in the profile from unrelated past questions.
    if (args.forceAreaQuestion) return this.getAreaQuestion();

    // The AI router itself decided this needed narrowing and supplied a
    // tailored question + options as part of the SAME tool call — no extra
    // AI call needed. Falls through to the fixed profile-based questions
    // below only if the model didn't populate these.
    const aiQuestion = typeof args.question === "string" ? args.question.trim() : "";
    const aiOptions = Array.isArray(args.options)
      ? args.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0)
      : [];
    if (aiQuestion && aiOptions.length > 0) {
      return withChoices(aiQuestion, aiOptions);
    }

    if (!profile.career_stage && !profile.current_background && !currentTopic) return this.getAreaQuestion();

    if (currentTopic && !profile.career_stage) {
      // They mentioned a topic but we don't know their background
      return withChoices("Good focus. Quick one first — where are you starting from?", [
        "Completely new to tech",
        "Switching from another career",
        "Already working in the field",
      ]);
    }

    if (profile.current_background && !profile.target_role) {
      // We know background but not direction
      return withChoices("What kind of tech role or area are you aiming for?", [
        "Software development",
        "Data & AI",
        "Design",
        "Management",
        "Not sure yet",
      ]);
    }

    // Generic re-engagement
    return withChoices("What would be most useful right now?", [
      "My CV",
      "Interview prep",
      "A specific career decision",
      "Something else",
    ]);
  }
}
