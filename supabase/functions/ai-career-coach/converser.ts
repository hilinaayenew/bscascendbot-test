// @ts-nocheck
// Vivid Insights Converser Framework — TypeScript/Deno port
// Mirrors the Python architecture in vivid-insights-main/framework/converser.py

export enum FunctionType {
  CHANGE_CONTEXT = "change_context",
  WORDALISE = "wordalise",
  INSTRUCTIONS = "instructions",
  ENGAGE = "engage",
}

// Appends a parseable marker the frontend uses to render clickable option
// buttons under a message, without needing a DB schema change — it's just
// plain text in the same `messages.content` column. Fixed option sets only
// (no extra AI call to generate them), so these responses stay instant.
export const CHOICES_MARKER = "%%CHOICES%%";

export function withChoices(text: string, choices: string[]): string {
  return choices.length ? `${text}\n${CHOICES_MARKER}${JSON.stringify(choices)}` : text;
}

// A WORDALISE function sometimes only realizes mid-answer that the request
// was still too broad to answer in one direction (e.g. it would need to
// write "which track are you most drawn to" before it can recommend
// anything specific). Rather than a second AI call to re-route, it signals
// this in its own output using this fixed, code-parseable format instead of
// writing the hedged multi-direction answer — resolveNarrowOrAnswer() turns
// that into the same tappable-button format inviteUserContext uses, or
// passes the text through unchanged if the model just answered normally.
export const NARROW_SELF_CHECK = `Self-check before you answer — read this carefully: if your answer would name more than one distinct direction/track/option side by side (e.g. "for web development, do A; for data, do B; for IT, do C"), that is ALWAYS wrong — even if you also end with a clarifying question. Listing every track "to be safe" instead of asking which one FIRST is exactly the mistake to avoid; ending with a question does not excuse it. The moment you notice yourself about to name a second distinct track/option in the same answer, stop — do not send that answer. Output ONLY these two lines instead, exactly, and nothing else:
NARROW_QUESTION: <a short question tailored to what they asked>
NARROW_OPTIONS: <option 1> | <option 2> | <option 3>
(3-5 short options tailored to their message, each under 6 words, separated by " | ")`;

const NARROW_OUTPUT_PATTERN = /^\s*NARROW_QUESTION:\s*(.+?)\s*\n+\s*NARROW_OPTIONS:\s*(.+?)\s*$/is;

// Fallback safety net for when the model hedges across multiple tracks
// anyway, without self-reporting via NARROW_QUESTION/NARROW_OPTIONS above
// (observed repeatedly in practice — the instruction alone isn't fully
// reliable). This checks the model's OWN generated answer for a generic
// structural tell — a comma-separated list of 3+ short items ending in
// "or <item>" (e.g. "web, data, or IT?", "CV, networking, or interview
// prep?") — not a guess at the user's intent from their input wording.
// Deliberately requires 2+ comma-joined items before the "or" so it doesn't
// fire on ordinary two-item questions ("time or money?"), which are a
// normal, legitimate way to end an already-focused answer.
const ENUMERATED_LIST_PATTERN = /\b([A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2}(?:,\s*[A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2})+,?\s+or\s+[A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2})\b/;

function extractEnumeratedOptions(text: string): string[] | null {
  const match = text.match(ENUMERATED_LIST_PATTERN);
  if (!match) return null;
  // Normalize the trailing ", or X" / " or X" into a plain ", X" first — a
  // combined split on /,|\bor\b/ would let the comma-branch greedily eat the
  // space before "or", fusing it onto the next word ("or interview prep").
  const normalized = match[1].replace(/,?\s+or\s+/i, ", ");
  const options = normalized
    .split(/,\s*/)
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 40)
    .map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  const unique = [...new Set(options)];
  return unique.length >= 2 ? unique.slice(0, 5) : null;
}

// A different failure mode from hedging across tracks: the model stays on
// one topic but writes it up as a multi-section rundown (e.g. "Foundations
// to learn... / Beginner-friendly labs... / Security basics... / Tools...
// / Certifications... / Free resources...") instead of a short answer, even
// though it was told to. Rather than trust that instruction alone (it
// repeatedly hasn't held), this keeps only the opening answer and the
// closing question — a paragraph-count cap, not a content judgment.
function capParagraphs(text: string, max = 2): string {
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= max) return text;
  return [paragraphs[0], paragraphs[paragraphs.length - 1]].join("\n\n");
}

export function resolveNarrowOrAnswer(raw: string): string {
  const selfReported = raw.match(NARROW_OUTPUT_PATTERN);
  if (selfReported) {
    const question = selfReported[1].trim();
    const options = selfReported[2].split("|").map((o) => o.trim()).filter(Boolean);
    if (question && options.length >= 2) return withChoices(question, options);
  }

  const enumeratedOptions = extractEnumeratedOptions(raw);
  if (enumeratedOptions) {
    return withChoices("Which one would you like to focus on?", enumeratedOptions);
  }

  return capParagraphs(raw);
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

  abstract getEngagementPrompt(args: Record<string, unknown>): string;

  async call(args: Record<string, unknown>, _question: string): Promise<string> {
    return this.getEngagementPrompt(args);
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
