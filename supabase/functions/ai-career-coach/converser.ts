// @ts-nocheck
// Vivid Insights Converser Framework — TypeScript/Deno port
// Mirrors the Python architecture in vivid-insights-main/framework/converser.py

export enum FunctionType {
  CHANGE_CONTEXT = "change_context",
  WORDALISE = "wordalise",
  INSTRUCTIONS = "instructions",
  ENGAGE = "engage",
}

// Azure OpenAI config — passed through from index.ts (loaded from Supabase secrets)
export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deployment: string;
}

// Azure OpenAI tool schema (wraps the function declaration)
export interface AzureToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// Base class for all converser functions
export abstract class ChatFunction {
  abstract get functionType(): FunctionType;
  abstract get name(): string;
  abstract get description(): string;

  get parameters(): { type: string; properties: Record<string, unknown>; required: string[] } {
    return { type: "object", properties: {}, required: [] };
  }

  toSchema(): AzureToolSchema {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }

  abstract call(args: Record<string, unknown>, question: string): Promise<string>;
}

// CHANGE_CONTEXT: updates converser state, then triggers a WORDALISE function
export abstract class ChangeContextFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.CHANGE_CONTEXT;
  }

  abstract updateContext(args: Record<string, unknown>): Promise<void>;
  abstract getWordaliseFunction(): string;

  async call(args: Record<string, unknown>, question: string): Promise<string> {
    await this.updateContext(args);
    const wordaliseFunc = this.converser.getFunctionByName(this.getWordaliseFunction());
    if (!wordaliseFunc) throw new Error(`WORDALISE function '${this.getWordaliseFunction()}' not found`);
    return wordaliseFunc.call(args, question);
  }

  constructor(protected converser: Converser) {
    super();
  }
}

// WORDALISE: fetches domain knowledge + loads few-shot examples + generates response
export abstract class WordaliseFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.WORDALISE;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getDomainKnowledge(args: Record<string, unknown>): string;

  // Subclasses override getTopicFilter() to say which topic tag to prefer —
  // AdviseOnCareerTopic uses the classified career topic, AddressMindsetChallenge
  // uses the challenge_type argument. Returning null skips topic filtering.
  getTopicFilter(_args: Record<string, unknown>): string | null {
    return null;
  }

  async loadFewShotExamples(args: Record<string, unknown> = {}, limit = 3): Promise<Array<{ question: string; knowledge: string; answer: string }>> {
    try {
      const topic = this.getTopicFilter(args);

      if (topic) {
        const { data } = await this.converser.supabase
          .from("coach_wordalisations")
          .select("question, knowledge, answer")
          .eq("function_name", this.name)
          .eq("topic", topic)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (data && data.length > 0) return data;
      }

      // No topic match (or no topic given) — fall back to whatever's most recent for this function.
      const { data } = await this.converser.supabase
        .from("coach_wordalisations")
        .select("question, knowledge, answer")
        .eq("function_name", this.name)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  }

  buildFewShotPrompt(question: string, knowledge: string, examples: Array<{ question: string; knowledge: string; answer: string }>): string {
    const parts: string[] = [];

    if (examples.length > 0) {
      parts.push(
        "[DEVELOPER MESSAGE]\n\n" +
        "You are the BSC AI Career Coach. Below are examples of how you have answered similar questions in the past.\n" +
        "Your voice is: first-person, empathetic, practical, and always ends with a question that invites the user to share more.\n" +
        "Default to a short, direct answer — a sentence or two, or a short paragraph at most. Only go longer if the question genuinely needs it, or the user asks you to explain more or go deeper. Do not use markdown.\n"
      );

      examples.forEach((ex, i) => {
        parts.push(`Example ${i + 1}:`);
        parts.push(`Question: ${ex.question}`);
        parts.push(`Your Knowledge: ${ex.knowledge.slice(0, 300)}...`);
        parts.push(`Your Answer: ${ex.answer}\n`);
      });

      parts.push("---\nNow follow this same voice and style for the current question.");
    }

    parts.push(`\nUser's Question: ${question}`);
    parts.push(`Your Knowledge:\n${knowledge}`);
    parts.push("\nNow give your answer directly to the user:");

    return parts.join("\n");
  }

  abstract generateResponse(prompt: string, question: string): Promise<string>;

  async call(args: Record<string, unknown>, question: string): Promise<string> {
    const knowledge = this.getDomainKnowledge(args);
    const examples = await this.loadFewShotExamples(args);
    const prompt = this.buildFewShotPrompt(question, knowledge, examples);
    return this.generateResponse(prompt, question);
  }
}

// INSTRUCTIONS: explains how the converser works
export abstract class InstructionsFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.INSTRUCTIONS;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getInstructionsContent(): string;

  async call(_args: Record<string, unknown>, _question: string): Promise<string> {
    return this.getInstructionsContent();
  }
}

// ENGAGE: proactively invites the user to share context
export abstract class EngageFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.ENGAGE;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getEngagementPrompt(): string;

  async call(_args: Record<string, unknown>, _question: string): Promise<string> {
    return this.getEngagementPrompt();
  }
}

// User profile persisted across sessions
export interface UserProfile {
  career_stage: string;
  current_background: string;
  target_role: string;
  goals: string;
  challenges: string[];
}

// OpenAI message format (used by Azure OpenAI)
export interface OAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ConverserContext {
  currentEntities: string[];
  userProfile: UserProfile;
  conversationHistory: OAIMessage[];
}

// Base converser class
export abstract class Converser {
  name: string;
  domain: string;
  context: ConverserContext;
  supabase: unknown;
  azureConfig: AzureConfig;
  protected _functions: ChatFunction[] = [];

  constructor(name: string, domain: string, context: ConverserContext, supabase: unknown, azureConfig: AzureConfig) {
    this.name = name;
    this.domain = domain;
    this.context = context;
    this.supabase = supabase;
    this.azureConfig = azureConfig;
  }

  abstract get instructions(): string;
  abstract initializeFunctions(): ChatFunction[];

  get functions(): ChatFunction[] {
    if (!this._functions.length) {
      this._functions = this.initializeFunctions();
    }
    return this._functions;
  }

  get functionSchemas(): AzureToolSchema[] {
    return this.functions.map((f) => f.toSchema());
  }

  getFunctionByName(name: string): ChatFunction | undefined {
    return this.functions.find((f) => f.name === name);
  }
}
