// @ts-nocheck
// BSC Career Coach — 6 domain-specific functions
// Mirrors the Movivid functions pattern from vivid-insights-main/examples/movivid/movivid_functions.py
//
// Function map:
//   updateCareerTopic     (CHANGE_CONTEXT) → adviseOnCareerTopic
//   captureUserBackground (CHANGE_CONTEXT) → inviteUserContext
//   adviseOnCareerTopic   (WORDALISE)
//   addressMindsetChallenge (WORDALISE)
//   howCoachWorks         (INSTRUCTIONS)
//   inviteUserContext     (ENGAGE)

import {
  ChangeContextFunction,
  WordaliseFunction,
  InstructionsFunction,
  EngageFunction,
  Converser,
  AzureConfig,
  OAIMessage,
} from "./converser.ts";
import { KNOWLEDGE_BASE, classifyTopic } from "./bsc-knowledge.ts";

// Helper: call Azure OpenAI chat completions
async function callAzure(
  azure: AzureConfig,
  messages: OAIMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
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
          description: "The career topic, role, or skill area mentioned by the user",
        },
      },
      required: ["topic"],
    };
  }

  async updateContext(args: Record<string, unknown>): Promise<void> {
    const topic = classifyTopic(String(args.topic || ""));
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

  getDomainKnowledge(_args: Record<string, unknown>): string {
    const topic = this.converser.context.currentEntities[0] || "cv_job_search";
    const userProfile = this.converser.context.userProfile;

    let knowledge = KNOWLEDGE_BASE[topic] || KNOWLEDGE_BASE["cv_job_search"];

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
        content: "You are the BSC AI Career Coach. Answer in first person. Be empathetic, practical, and concise. 2-3 short paragraphs. No markdown formatting. Always end with a question that invites the user to share more about their situation.",
      },
      ...history,
      { role: "user", content: prompt },
    ];
    return callAzure(this.converser.azureConfig, messages, { temperature: 0.7 });
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

  getDomainKnowledge(_args: Record<string, unknown>): string {
    return `${KNOWLEDGE_BASE["mindset"]}\n\n---\n\n${KNOWLEDGE_BASE["wellbeing"]}`;
  }

  async generateResponse(prompt: string, _question: string): Promise<string> {
    const history = this.converser.context.conversationHistory.slice(-6);
    const messages: OAIMessage[] = [
      {
        role: "system",
        content: "You are the BSC AI Career Coach addressing a mindset challenge. Lead with validation before advice — acknowledge what the user is feeling before suggesting anything. Speak in first person. Be warm, honest, and grounded. 2-3 paragraphs. No markdown. End with a question that invites them to share more.",
      },
      ...history,
      { role: "user", content: prompt },
    ];
    return callAzure(this.converser.azureConfig, messages, { temperature: 0.75 });
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

    const greeting = hasProfile
      ? `I'm here as your BSC AI Career Coach — good to hear from you again.`
      : `I'm your BSC AI Career Coach — I'm here to help you navigate your tech career.`;

    return `${greeting}

I can help you with: getting started in tech, choosing a career path, writing a CV and job searching, interview preparation, salary negotiation, further education decisions, finding and using mentors, and working through mindset challenges like imposter syndrome or motivation.

The best way to use me is to be specific about where you are and what you are trying to figure out. The more context you share about your background and goals, the more useful I can be. What's on your mind?`;
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

  getEngagementPrompt(): string {
    const profile = this.converser.context.userProfile;
    const currentTopic = this.converser.context.currentEntities[0];

    if (!profile.career_stage && !profile.current_background && !currentTopic) {
      // Fresh start — invite context from scratch
      return `I'm glad you're here. To give you advice that's actually relevant to where you are, it helps me to know a little about your situation.

What's your starting point — are you completely new to tech, switching from another career, or already working in the field and looking to grow?

And what's the thing you most want to figure out right now?`;
    }

    if (currentTopic && !profile.career_stage) {
      // They mentioned a topic but we don't know their background
      return `That's a good area to focus on. Before I give you specific advice, it helps to know a bit more about you.

What's your current background — what do you do now, or what were you doing before you started thinking about tech? And what are you aiming for?`;
    }

    if (profile.current_background && !profile.target_role) {
      // We know background but not direction
      return `Thanks for sharing that. Knowing your background helps me give you more relevant advice.

What kind of tech role or area are you aiming for? Even a rough direction — data, design, development, management — helps me point you somewhere specific.`;
    }

    // Generic re-engagement
    return `What would be most useful to talk through right now? We could work on something specific — your CV, interview prep, a career decision — or if you're not sure where to start, tell me what's feeling most uncertain and we'll go from there.`;
  }
}
