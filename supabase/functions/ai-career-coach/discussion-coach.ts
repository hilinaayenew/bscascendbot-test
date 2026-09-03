// @ts-nocheck
// ============================================================================
// v4 area/stage model — the live generation path, ported from the local test
// harness (scripts/coach-local.mjs) into production.
//
// One class, DiscussArea, instantiated once per built area (see AREAS in
// discussion-areas.ts). Its call() is a full override of WordaliseFunction's
// default pipeline — classification, stall/wrap-up state, generation and the
// guard chain all happen here, mirroring the harness's per-turn logic, rather
// than the generic buildFewShotPrompt() flow the rest of the coach uses.
// ============================================================================

import type { ConverserContext, AzureConfig, AreaState, OAIMessage } from "./converser.ts";
import {
  Converser,
  WordaliseFunction,
  NEVER_DISCOUNT_HER_PLACE,
  REFLECT_BACK,
  NEVER_OFFER_TO_ACT,
  PLAIN_LANGUAGE,
  ASK_WITHOUT_EXTRACTING,
  VARY_YOUR_OPENING,
  NO_INVENTED_FIGURES,
  HISTORY_WINDOW,
  stripQuotaConcession,
  stripUnsourcedFigures,
  stripUnearnedValidation,
  stripRepeatedOpener,
  dropRepeatedSentences,
  stripAdsOversell,
  stripImplausiblePeriods,
  stripImplausibleFigures,
  flattenEnumerations,
  flattenInlineList,
  capSentencesFlagged,
  dropDanglingQuestion,
  endsOnDanglingReference,
  dropSecondQuestion,
  isOnlyAQuestion,
  echoesUser,
  stripInventedLocation,
} from "./converser.ts";
import type { AreaConfig, Facet } from "./discussion-areas.ts";
import {
  buildFacets,
  mostRelevant,
  conversationQuery,
  matchStrength,
  otherAreas,
  ALL_AREAS,
  WRAP_UP_LINE,
  COULD_NOT_ANSWER,
} from "./discussion-areas.ts";
import { KNOWLEDGE_BASE } from "./bsc-knowledge.ts";
import { BOTEMA_VALUES, BOTEMA_SYSTEM_PROMPT } from "./botema-examples.ts";

const REASONING_GENERATE = "low";
const REASONING_PROFILE = "minimal";

async function callAzureOnce(
  azure: AzureConfig,
  messages: OAIMessage[],
  maxTokens: number,
  opts: { tools?: unknown[]; reasoning?: string | null } = {},
): Promise<{ content: string | null; toolArgs: Record<string, unknown> | null; finishReason?: string }> {
  const url = `${azure.endpoint}openai/deployments/${azure.deployment}/chat/completions?api-version=${azure.apiVersion}`;
  const body: Record<string, unknown> = { messages, max_completion_tokens: maxTokens };
  if (opts.reasoning) body.reasoning_effort = opts.reasoning;
  if (opts.tools) { body.tools = opts.tools; body.tool_choice = "required"; body.parallel_tool_calls = false; }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": azure.apiKey },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Azure OpenAI error (discussion area):", data); throw new Error("Azure OpenAI call failed"); }

  const choice = data.choices?.[0];
  if (opts.tools) {
    const call = choice?.message?.tool_calls?.[0];
    if (!call) return { content: null, toolArgs: null, finishReason: choice?.finish_reason };
    try {
      return { content: null, toolArgs: JSON.parse(call.function.arguments || "{}"), finishReason: choice?.finish_reason };
    } catch {
      return { content: null, toolArgs: null, finishReason: "parse_error" };
    }
  }
  return { content: choice?.message?.content || null, toolArgs: null, finishReason: choice?.finish_reason };
}

// One retry at double the token budget, matching the rest of this coach — a
// reasoning model can spend its whole budget thinking and return nothing (or,
// for a tool call, a truncated/dropped one) before a word or a field is
// written.
async function callAzure(
  azure: AzureConfig,
  messages: OAIMessage[],
  opts: { maxTokens?: number; tools?: unknown[]; reasoning?: string | null } = {},
): Promise<{ content: string | null; toolArgs: Record<string, unknown> | null }> {
  const baseTokens = opts.maxTokens ?? 2000;
  let result = await callAzureOnce(azure, messages, baseTokens, opts);
  const empty = opts.tools ? !result.toolArgs : !result.content;
  if (empty && baseTokens < 12000) {
    result = await callAzureOnce(azure, messages, baseTokens * 2, opts);
  }
  return result;
}

// ── Layer 1: classification ──────────────────────────────────────────────

interface ClassifyResult {
  stage: string;
  leaveTo: string;
  newInformation?: boolean;
  newProfileFacts?: boolean;
  reportsExternalTreatment?: boolean;
  why: string;
}

function classifyTool(area: AreaConfig) {
  const others = otherAreas(area.n);
  const areaList = Object.entries(others).map(([n, t]) => `${n} (${t})`).join(", ");
  return [{
    type: "function",
    function: {
      name: "placeInArea",
      description: `Decide which stage of the ${area.name} area this message belongs to, or whether the user is leaving the area.`,
      parameters: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: [...Object.keys(area.stages), "leaving"],
            description: [
              ...Object.keys(area.stages).map((k) => `${k} — ${area.stages[k].describes}`),
              `leaving — the message is not about ${area.name} at all: they want a different subject, or the real blocker belongs to another area entirely (e.g. confidence rather than tactics).`,
            ].join(" | "),
          },
          leaveTo: {
            type: "string",
            description: `If leaving, the number of the area that suits better — always give one. Use "none" when not leaving. Options: ${areaList}`,
          },
          newInformation: {
            type: "boolean",
            description: "Did this message move the conversation forward — a fact, a constraint, an answer to what was asked, OR a genuinely new question she hasn't asked before? False only for filler, a restatement of something already said, or a shrug.",
          },
          reportsExternalTreatment: {
            type: "boolean",
            description: "Did she describe something OTHER PEOPLE did to her? True for: being interrupted or talked over, her idea repeated back as someone else's, being paid less than a colleague, being passed over, being called difficult, being assumed junior, being dismissed or excluded, a specific thing someone said or did to her. FALSE when she is describing herself — how she feels, what she avoids, what she does not believe, a habit of her own. A feeling ABOUT other people is still false unless she reports what they actually did.",
          },
          newProfileFacts: {
            type: "boolean",
            description: "Did she say something about HERSELF in this message that a coach would write down? True only for: her role or job title, her seniority or years of experience, her employer or team, where she is, her pay, her education or training, what she is trying to reach, what is blocking her, what she has already tried, or a constraint on any of it. FALSE for everything else. When in doubt, false.",
          },
          why: { type: "string", description: "One short clause explaining the choice." },
        },
        required: ["stage", "leaveTo", "newInformation", "newProfileFacts", "reportsExternalTreatment", "why"],
      },
    },
  }];
}

async function classify(
  area: AreaConfig,
  message: string,
  history: OAIMessage[],
  covered: string[],
  azure: AzureConfig,
  maxTokens = 2000,
): Promise<ClassifyResult | null> {
  const sys = [
    `You are placing a message inside the "${area.name}" discussion area of a tech career coach.`,
    `Decide which stage of that area it belongs to, or whether the user has left the area.`,
    covered.length ? `Stages already worked through: ${covered.join(", ")}. Prefer a new stage only if the message genuinely moved.` : "",
    `Judge from the user's situation, not their wording. Someone can be in a stage without using the words that describe it.`,
    `Only choose "leaving" on a clear signal — an ambiguous follow-up belongs to the stage that is already open.`,
    `A bare statement of fact about her situation — a promotion, a new role, a life event — is context, not a request to leave. Only classify "leaving" when she explicitly asks about, or clearly wants to talk through, a subject outside this area — not just because the fact she mentioned would also fit somewhere else.`,
  ].filter(Boolean).join(" ");

  const { toolArgs } = await callAzure(azure, [
    { role: "system", content: sys },
    ...history.slice(-10),
    { role: "user", content: message },
  ], { tools: classifyTool(area), maxTokens });

  return (toolArgs as ClassifyResult) || null;
}

// ── Who she is, in prose ──────────────────────────────────────────────────

async function updateProfileNote(
  state: { situation: string; aims: string },
  message: string,
  history: OAIMessage[],
  azure: AzureConfig,
): Promise<void> {
  const sys = [
    "You keep a short private note about someone a career coach is talking to. Rewrite it now, incorporating anything new in her latest message.",
    "",
    "Return exactly two paragraphs separated by a blank line, nothing else:",
    "1. WHERE SHE IS — her role, her place, what is happening with her pay or job right now.",
    "2. WHAT SHE IS TRYING TO DO — where she wants to get to, what is in her way, what she has already tried.",
    "",
    "Write it as a note in the third person — \"She is a job-title in a-place, N years in the role\" — never by quoting her back at herself.",
    "ACCUMULATE. The note so far is below; keep everything in it that is still true and fold in whatever is new. Do not start again from only the latest message.",
    "Record ONLY what she has actually said. Never infer, never embellish, never guess a city or a salary she has not given.",
    "If you genuinely know nothing for a paragraph, output the single word NONE for it. Never write \"no information provided\" or any other placeholder — that gets stored as if it were a fact.",
    "A few sentences each at most. This is a memory, not a dossier.",
    "",
    "The note so far:",
    state.situation ? "WHERE SHE IS: " + state.situation : "WHERE SHE IS: (nothing yet)",
    state.aims ? "WHAT SHE IS TRYING TO DO: " + state.aims : "WHAT SHE IS TRYING TO DO: (nothing yet)",
  ].join("\n");

  const { content: out } = await callAzure(azure, [
    { role: "system", content: sys },
    ...history.slice(-HISTORY_WINDOW),
    { role: "user", content: message },
  ], { maxTokens: 4800, reasoning: REASONING_PROFILE });
  if (!out) return;

  const parts = out.split(/\n\s*\n/).map((p) => p.replace(/^\s*(?:\d[.)]\s*)?(?:WHERE SHE IS|WHAT SHE IS TRYING TO DO)\s*:?\s*/i, "").trim());
  const real = (p: string | undefined) => p && !/^[(\-–—]*\s*(?:none|n\/a|unknown|no information|nothing)\b/i.test(p.trim());
  if (real(parts[0])) state.situation = parts[0];
  if (real(parts[1])) state.aims = parts[1];
}

// ── Generation ──────────────────────────────────────────────────────────

function buildAreaSystemPrompt(
  area: AreaConfig,
  stage: string,
  near: Facet[],
  wide: Facet[],
  thin: boolean,
  state: { situation: string; aims: string },
  priorReplies: string[],
): string {
  const render = (list: Facet[]) => list.map((e) => `Q: ${e.question}\nA: ${e.answer}`).join("\n\n");
  const wrapUp = area.wrapUp;

  const parts: string[] = [];

  parts.push(BOTEMA_VALUES + "\n\n" + BOTEMA_SYSTEM_PROMPT);

  parts.push(`Where the user is right now: ${area.stages[stage].describes}`);

  if (state.situation || state.aims) {
    parts.push([
      state.situation ? `WHAT YOU KNOW ABOUT HER: ${state.situation}` : null,
      state.aims ? `WHAT SHE IS TRYING TO DO: ${state.aims}` : null,
      "Use this. Never ask her again for something she has already told you, and never recite it back at her — just let it shape the answer.",
    ].filter(Boolean).join("\n"));
  }

  parts.push([
    thin
      ? "Answers you have given to OTHER questions. Nothing here is close to what she just asked, so take ONLY the voice from them — the directness, the length, the habit of giving her one thing she can act on. The advice must be your own, worked out for her question from what you know. Do not bend her question towards these answers because they are what you have."
      : "Answers you have given to related questions. These are your VOICE REFERENCE — match their tone, their directness and above all their length. Do not quote them, and do not answer questions the user did not ask.",
    "",
    render(near),
    wide.length ? "\nOTHER ANSWERS OF YOURS, on different questions in this same area. These are NOT about what she asked and you must not answer from them. They are here so you can hear the full range of how you write — where you are blunt, where you soften, how long you run, how you open. Take the range, leave the content.\n" : "",
    wide.length ? render(wide) : "",
  ].filter(Boolean).join("\n"));

  parts.push(`Background you may draw on if it is relevant to what was actually asked:\n${KNOWLEDGE_BASE[area.topic] || ""}`);

  parts.push(NO_INVENTED_FIGURES);

  parts.push([
    "NOW THE RULES FOR YOUR REPLY, WHICH OVERRIDE EVERYTHING ABOVE:",
    NEVER_DISCOUNT_HER_PLACE,
    REFLECT_BACK,
    NEVER_OFFER_TO_ACT,
    PLAIN_LANGUAGE,
    ASK_WITHOUT_EXTRACTING,
    "ANSWER THE CONVERSATION, NOT THE TOPIC. Before you write, ask yourself what has actually already happened to her — what she has been offered, refused, told or decided in this conversation so far. Her latest message is usually a detail added to that situation, not a new question.",
    "The examples above are the nearest material you have. They are not necessarily the right material. If her situation has moved past what they describe, then say what fits HER, and let the examples inform only your voice. Advice that would have been right two turns ago is wrong now, and she will notice.",
    "When she adds a fact, the reply must be ABOUT that fact. It is not background colour — it is evidence about her situation, and it should change what you tell her, not sit alongside the same advice as before.",
    "You can see everything you have already said in this conversation. Do NOT repeat advice you have already given — she heard it. If a point still applies, refer back to it in a clause and spend the reply on what is new.",
    // Found by area-tester 2026-09-03: a drawn example's opening CLAIM — the
    // thing that reframes what she's afraid of or asking, not just its topic
    // — was repeatedly getting mined for tactics and dropped. "How long will
    // this realistically take" got a plain timeline even though the drawn
    // answer calls the short-timeline promise "a facade"; "they'll realise I
    // don't know what I'm doing" got a tactics checklist even though the
    // drawn answer opens by saying nerves aren't a readout of preparedness.
    "If the closest example above opens by stating a fact that reframes her situation or her fear — a promise is false, a feeling isn't a signal of unpreparedness, a number is really a floor not a ceiling — that fact is not optional colour. Keep it, in your own words, before you move to what to do.",
    // Found the same day: a full "which field should I pick" conversation
    // gave nothing but build-it-yourself advice and never once named a
    // person, though the drawn example explicitly says to talk to people
    // already in the field, and lifting as she climbs is a stated value.
    "Likewise, if the closest example above points her toward a person — a mentor, someone already in the field, a community, BSC's own programme — keep that pointer somewhere in your reply. Don't let the advice narrow down to resources and self-directed work alone.",
    VARY_YOUR_OPENING,
    priorReplies.length
      ? `You have already opened replies in this conversation with: ${priorReplies.map((r) => `"${r.split(/\s+/).slice(0, 6).join(" ")}…"`).join(", ")}. Do NOT begin this one like ANY of those — a different first word and a different shape, not the same construction with the noun swapped.`
      : null,
    `Answer only the one thing the user actually asked. You have been given several examples above so that you can pick the right one — not so that you can cover them all.`,
  ].filter(Boolean).join(" "));

  parts.push([
    "Two or three sentences. Never a list. Never a rundown of the whole subject.",
    "HOW TO END. Most of the time, end on a light check she can answer with a yes or a no — 'Does that make sense?', 'Does that feel like something you could actually do?', 'How does that sound to you?', 'Is that the bit you're stuck on?'. That is the ordinary ending, not a fallback.",
    "Ask a forward-driving follow-on only where her answer would genuinely change what you say next. ONE question per reply, never two. And never re-ask something she has already left unanswered — if she skipped it, she had a reason, and asking again tells her you were not listening.",
    "Where the answer is complete in itself, end on the advice and stop. Never ask a question you do not need the answer to. Never ask one that presses her to disclose her own pay.",
    wrapUp && stage === wrapUp
      ? [
          "THIS TURN IS THE WRAP-UP, AND IT OVERRIDES THE RULES ABOVE.",
          "She is agreeing, not asking. Do not give new advice. No extra step, no further tip, no 'one more thing', no reopening a thread she has just closed, and nothing at all from the examples above — they are here for voice only this turn.",
          "Say back what she is actually going to do, in her words rather than yours, in one sentence. If there is nothing concrete to say back, say what she has worked out instead.",
          "Then check whether that is genuinely it — 'I think we've got a plan, haven't we?', 'Have we covered that one?', 'Is there anything else on your mind?'. One check, warm, and short.",
          "Two sentences. Three at the outside. A wrap-up that runs long is not a wrap-up.",
        ].join(" ")
      : null,
  ].filter(Boolean).join("\n"));

  return parts.filter(Boolean).join("\n\n");
}

async function generate(
  area: AreaConfig,
  stage: string,
  message: string,
  history: OAIMessage[],
  facets: Record<string, Facet>,
  usedExamples: string[],
  state: { situation: string; aims: string },
  priorReplies: string[],
  azure: AzureConfig,
): Promise<{ raw: string | null; near: Facet[]; wide: Facet[] }> {
  const all = area.stages[stage].facets.map((id) => facets[id]).filter(Boolean);
  const query = conversationQuery(message, history);
  const { near, wide } = mostRelevant(area, all, query, 3, usedExamples);
  const thin = matchStrength(near, query) <= 1;

  const sys = buildAreaSystemPrompt(area, stage, near, wide, thin, state, priorReplies);
  const { content } = await callAzure(azure, [
    { role: "system", content: sys },
    ...history.slice(-HISTORY_WINDOW),
    { role: "user", content: message },
  ], { maxTokens: 2000, reasoning: REASONING_GENERATE });

  return { raw: content, near, wide };
}

// ── The area/stage state, mutated in place per turn ────────────────────────
// AreaState itself is defined in converser.ts, alongside ConverserContext.

export function freshAreaState(): AreaState {
  return {
    activeArea: null, coveredFacets: [], closedAreas: [],
    location: null, situation: "", aims: "",
    stallCount: 0, wrappedUp: false, lastStage: null,
  };
}

// ── DiscussArea ─────────────────────────────────────────────────────────
// One WORDALISE function per built area (see AREAS in discussion-areas.ts).
// Full call() override — see the file header for why.
export class DiscussArea extends WordaliseFunction {
  constructor(converser: Converser, private area: AreaConfig, private functionName: string) {
    super(converser);
  }

  get name() { return this.functionName; }
  get description() { return `Discuss the ${this.area.name} area, stage by stage, using Otema's real and approved answers as grounding.`; }

  getDomainKnowledge(_args: Record<string, unknown>): string {
    return KNOWLEDGE_BASE[this.area.topic] || "";
  }

  async generateResponse(_prompt: string, _question: string): Promise<string> {
    // Unused — call() is fully overridden below. Present only to satisfy
    // WordaliseFunction's abstract contract.
    return "";
  }

  private get ctx(): ConverserContext { return this.converser.context; }
  private get azure(): AzureConfig { return this.converser.azureConfig; }
  private get userId(): string { return (this.converser as unknown as { userId: string }).userId; }

  private async persist(state: AreaState): Promise<void> {
    try {
      if (!this.userId) return;
      await (this.converser.supabase as any)
        .from("coach_user_profiles")
        .upsert({
          user_id: this.userId,
          active_area: state.activeArea,
          area_opened_at: state.activeArea ? new Date().toISOString() : null,
          covered_facets: state.coveredFacets,
          closed_areas: state.closedAreas,
          location: state.location,
          situation: state.situation,
          aims: state.aims,
          stall_count: state.stallCount,
          wrapped_up: state.wrappedUp,
          last_stage: state.lastStage,
          updated_at: new Date().toISOString(),
        });
    } catch { /* best-effort, same as the rest of this coach */ }
  }

  private closingLine(reason: "user" | "coach", to: string | null): string {
    if (reason === "user") {
      return to ? `Of course — let's get into ${to.toLowerCase()}.` : "Of course — what's on your mind?";
    }
    return "Hope that's been helpful. Is there anything else on your mind?";
  }

  async call(_args: Record<string, unknown>, question: string): Promise<string> {
    const state = this.ctx.areaState;
    if (!state) return COULD_NOT_ANSWER; // index.ts always populates this before routing here

    const history = this.ctx.conversationHistory;
    const priorReplies = history.filter((m) => m.role === "assistant").map((m) => m.content);
    const saidByUser = [...history.filter((m) => m.role === "user").map((m) => m.content), question]
      .join(" ").toLowerCase();

    let placed: ClassifyResult | null;
    try {
      placed = await classify(this.area, question, history, state.coveredFacets, this.azure);
    } catch {
      return COULD_NOT_ANSWER;
    }
    // The model can call the tool but drop or misname a required field —
    // same failure shape as no tool call at all, just one layer deeper. A
    // longer system prompt (more stages, more description text) means more
    // hidden reasoning before the tool call, so the same budget that works
    // for a 3-stage area drops the field more often on a 5-stage one. A
    // single retry at double the budget held for a while but wasn't enough
    // once Getting Started grew a 5th stage (E, the wrap-up) — an
    // area-tester run on 2026-09-03 caught it failing twice in one five-turn
    // conversation via the harness's equivalent path. Laddered up to match,
    // to the same 12000 ceiling callAzure() already uses elsewhere.
    if (!placed || (placed.stage !== "leaving" && !this.area.stages[placed.stage])) {
      let recovered: ClassifyResult | null = null;
      for (const budget of [4000, 8000, 12000]) {
        try {
          const retried = await classify(this.area, question, history, state.coveredFacets, this.azure, budget);
          if (retried && (retried.stage === "leaving" || this.area.stages[retried.stage])) { recovered = retried; break; }
        } catch { /* try the next budget */ }
      }
      placed = recovered;
    }
    if (!placed) return COULD_NOT_ANSWER;

    // Layer 1 — the classifier itself decided she's leaving.
    if (placed.stage === "leaving") {
      const dest = (() => {
        const raw = String(placed.leaveTo || "").trim();
        if (!raw || /^none$/i.test(raw)) return null;
        const num = raw.match(/\d+/)?.[0];
        if (num && ALL_AREAS[num]) return ALL_AREAS[num];
        return Object.values(ALL_AREAS).find((t) => raw.toLowerCase().includes(t.split(" ")[0].toLowerCase())) || null;
      })();
      state.closedAreas = [...new Set([...state.closedAreas, this.area.topic])];
      state.activeArea = null;
      state.stallCount = 0;
      state.wrappedUp = false;
      state.lastStage = null;
      await this.persist(state);
      return this.closingLine("user", dest);
    }

    // Layer 3 — stall: the same stage again with nothing new added.
    const addedSomething = placed.newInformation !== false;
    let effectiveStage = placed.stage;
    if (placed.stage === state.lastStage && !addedSomething) {
      state.stallCount += 1;
      if (state.stallCount >= 2) {
        if (this.area.wrapUp && !state.wrappedUp && placed.stage !== this.area.wrapUp) {
          effectiveStage = this.area.wrapUp;
          state.wrappedUp = true;
          state.stallCount = 0;
        } else {
          state.closedAreas = [...new Set([...state.closedAreas, this.area.topic])];
          state.activeArea = null;
          state.stallCount = 0;
          state.wrappedUp = false;
          state.lastStage = null;
          await this.persist(state);
          return this.closingLine("coach", null);
        }
      }
    } else {
      state.stallCount = 0;
    }
    state.lastStage = placed.stage;
    state.activeArea = this.area.topic;

    const facets = buildFacets(this.area);
    for (const f of this.area.stages[effectiveStage].facets) {
      if (facets[f] && !state.coveredFacets.includes(f)) state.coveredFacets.push(f);
    }

    // Keep the note current before answering — never blocks the reply.
    if (placed.newProfileFacts !== false) {
      try { await updateProfileNote(state, question, history, this.azure); } catch { /* ignore */ }
    }

    let raw: string | null;
    let near: Facet[], wide: Facet[];
    try {
      const result = await generate(this.area, effectiveStage, question, history, facets, state.coveredFacets, state, priorReplies, this.azure);
      raw = result.raw; near = result.near; wide = result.wide;
    } catch {
      await this.persist(state);
      return COULD_NOT_ANSWER;
    }
    if (!raw) {
      await this.persist(state);
      return COULD_NOT_ANSWER;
    }

    // No enumerated-options safety net here, deliberately — unlike the
    // flat-topic path, this one was tried live and dropped. Each stage is
    // already narrowly scoped to a handful of facets, and an ordinary answer
    // routinely names 2-3 things in a list ("ask about equity, a signing
    // bonus, or a learning budget") without being the multi-track hedge the
    // check exists to catch. Confirmed live: it fired on exactly that kind of
    // ordinary, specific answer and replaced it with a generic "which one
    // would you like to focus on?" — a regression the harness this was
    // ported from never had, because it never had this check either.
    let text = this.runGuards(raw, placed, priorReplies, saidByUser);

    // The whole reply turned out to be advice already given — a stall the
    // pre-generation check (Layer 3, above) couldn't see because the
    // classifier itself said this message added something. Separate counter,
    // same rule: two in a row offers to finish (if there's a wrap-up stage)
    // or closes the area.
    if (!text.deduped) {
      state.stallCount += 1;
      if (state.stallCount >= 2) {
        if (this.area.wrapUp && !state.wrappedUp) {
          state.wrappedUp = true;
          state.stallCount = 0;
        } else {
          state.closedAreas = [...new Set([...state.closedAreas, this.area.topic])];
          state.activeArea = null;
          state.stallCount = 0;
          state.wrappedUp = false;
          state.lastStage = null;
          await this.persist(state);
          return this.closingLine("coach", null);
        }
      }
    }

    // Wrap-up rescue: nothing survived, or only a dangling question/statement
    // did, and the area has a wrap-up stage to offer instead of closing on a
    // stripped reply.
    const somethingWasCut = text.capped || !text.deduped;
    const danglingBody = !!text.text && endsOnDanglingReference(text.text);
    if (
      somethingWasCut && (!text.text || isOnlyAQuestion(text.text) || danglingBody) &&
      this.area.wrapUp && effectiveStage !== this.area.wrapUp
    ) {
      state.wrappedUp = true;
      try {
        const again = await generate(this.area, this.area.wrapUp, question, history, facets, state.coveredFacets, state, priorReplies, this.azure);
        if (again.raw) {
          let regen = stripQuotaConcession(again.raw).text;
          if (placed.reportsExternalTreatment === false) regen = stripUnearnedValidation(regen);
          regen = stripRepeatedOpener(regen, priorReplies);
          regen = dropRepeatedSentences(regen, priorReplies);
          const cleaned = capSentencesFlagged(flattenInlineList(flattenEnumerations(regen)), 3).text;
          const finished = dropSecondQuestion(cleaned || "");
          if (finished && finished.trim() && !isOnlyAQuestion(finished)) text.text = finished;
        }
      } catch { /* fall through to the empty-reply rescue below */ }
    }

    if (text.text && echoesUser(text.text, question)) text.text = "";

    let finalText = text.text;
    if (!finalText || !finalText.trim()) {
      finalText = (state.wrappedUp || effectiveStage === this.area.wrapUp) ? WRAP_UP_LINE : this.area.fallbackQuestion;
    }

    // Only the three closest count as "used" — the random four are voice
    // only, and marking them used would retire facets she's never been told.
    for (const e of near) if (!state.coveredFacets.includes(e.id)) state.coveredFacets.push(e.id);

    await this.persist(state);
    return finalText;
  }

  // Mirrors the guard-chain order in scripts/coach-local.mjs's main loop.
  private runGuards(
    raw: string,
    placed: ClassifyResult,
    priorReplies: string[],
    saidByUser: string,
  ): { text: string; capped: boolean; deduped: boolean } {
    const unquota = stripQuotaConcession(raw).text;
    const unearned = placed.reportsExternalTreatment === false ? stripUnearnedValidation(unquota) : unquota;
    const figureGuarded = stripUnsourcedFigures(unearned);
    const guarded = stripInventedLocation(figureGuarded, saidByUser);
    const openerFixed = stripRepeatedOpener(guarded, priorReplies);
    const deduped = dropRepeatedSentences(openerFixed, priorReplies);
    if (!deduped) return { text: "", capped: false, deduped: false };

    const plausible = stripAdsOversell(stripImplausiblePeriods(stripImplausibleFigures(deduped)));
    const unlisted = flattenEnumerations(plausible);
    const { text: capped, capped: wasCapped } = capSentencesFlagged(flattenInlineList(unlisted), 3);
    const undangled = dropDanglingQuestion(capped, wasCapped);
    const oneQuestion = dropSecondQuestion(undangled);

    return { text: oneQuestion, capped: wasCapped, deduped: true };
  }
}
