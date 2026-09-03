// @ts-nocheck
// BSC AI Career Coach — Edge Function Entry Point (Converser Architecture)
// Vivid Insights Converser pattern ported to TypeScript/Deno
//
// Flow per request:
//   1. Load user profile + conversation history from Supabase
//   2. Build BSCCoach converser with context
//   3. Routing call → Azure OpenAI selects which function to invoke (tool_choice: required)
//   4. Execute the function (CHANGE_CONTEXT auto-chains to WORDALISE)
//   5. Save AI reply to messages table + return it

import { createClient } from "npm:@supabase/supabase-js@2";
import { BotemaCoach } from "./botema-coach.ts";
import { HISTORY_WINDOW, HISTORY_FETCH } from "./converser.ts";
import type { UserProfile, ConverserContext, AreaState, AzureConfig, AzureToolSchema, OAIMessage } from "./converser.ts";
import { AREAS, AREA_TOPIC_TO_FUNCTION_NAME, saysDone, saysLeaving } from "./discussion-areas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_COACH_ID = "00000000-0000-0000-0000-000000000002";

// ============================================================
// AI ROUTER — the model picks which function to call via
// Azure OpenAI function calling (tool_choice: required), using the
// coach's own routing instructions and function schemas. The decision of
// whether a message needs narrowing (rule 5 in bsc-coach.ts/botema-coach.ts)
// is entirely the AI's judgment call, guided by that instruction — no
// deterministic keyword layer sits in front of this anymore.
// ============================================================
async function routeWithAI(
  instructions: string,
  functionSchemas: AzureToolSchema[],
  history: OAIMessage[],
  message: string,
  azureConfig: AzureConfig
): Promise<{ fnName: string; fnArgs: Record<string, unknown>; debug?: string }> {
  // If routing fails outright, decline rather than silently guessing a topic —
  // answering the wrong domain in-voice is worse than asking the user to retry.
  const fallback = { fnName: "answerOutOfScope", fnArgs: {} };

  const url = `${azureConfig.endpoint}openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": azureConfig.apiKey },
    body: JSON.stringify({
      messages: [
        { role: "system", content: instructions },
        ...history.slice(-HISTORY_WINDOW),
        { role: "user", content: message },
      ],
      tools: functionSchemas,
      tool_choice: "required",
      parallel_tool_calls: false,
      // gpt-5-nano is a reasoning model — it spends part of this budget on hidden
      // reasoning before the tool call itself, so keep this generous (see README §6).
      max_completion_tokens: 2000,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Azure OpenAI routing error:", data);
    return { ...fallback, debug: `api_error: ${JSON.stringify(data).slice(0, 500)}` };
  }

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    console.error("Azure OpenAI routing returned no tool call, finish_reason:", data.choices?.[0]?.finish_reason);
    return { ...fallback, debug: `no_tool_call: finish_reason=${data.choices?.[0]?.finish_reason}` };
  }

  let fnArgs: Record<string, unknown> = {};
  try {
    fnArgs = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    fnArgs = {};
  }

  return { fnName: toolCall.function.name, fnArgs };
}

// ============================================================
// MAIN HANDLER — Converser Architecture
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Single coach as of 2026-08-15: every request goes to Botema. Chataki's
    // implementation is untouched in bsc-coach.ts and her shared functions are
    // still in bsc-functions.ts — nothing was deleted. Reinstating her is an
    // import plus a branch here, plus the picker in AICoachWidget.tsx.
    // A `bot` field in the body is accepted and ignored, so older clients
    // keep working rather than erroring.
    const { message, sender_id } = await req.json();
    if (!message || !sender_id) throw new Error("Missing message or sender_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const azureConfig: AzureConfig = {
      endpoint: Deno.env.get("AZURE_OPENAI_ENDPOINT")!,
      apiKey: Deno.env.get("AZURE_OPENAI_API_KEY")!,
      apiVersion: Deno.env.get("AZURE_OPENAI_API_VERSION") || "2025-04-01-preview",
      deployment: Deno.env.get("AZURE_OPENAI_DEPLOYMENT") || "gpt-5-nano",
    };
    if (!azureConfig.endpoint || !azureConfig.apiKey) throw new Error("Azure OpenAI credentials not set");

    // ── 1. Load persisted user profile ───────────────────────────────
    // Area-state columns (active_area, covered_facets, etc.) are the v4
    // area/stage model's persistence — see the migration in
    // supabase/migrations/20260815120000_area_state_and_location.sql and
    // discussion-coach.ts. A profile row without them (migration not yet
    // applied, or a brand-new user) just comes back with those fields
    // undefined, and areaState below falls back to "outside any area" —
    // the flat-topic path behaves exactly as it does today either way.
    const { data: savedProfile } = await supabase
      .from("coach_user_profiles")
      .select("career_stage, current_background, target_role, goals, challenges, active_area, covered_facets, closed_areas, location, situation, aims, stall_count, wrapped_up, last_stage")
      .eq("user_id", sender_id)
      .single();

    const userProfile: UserProfile = {
      career_stage: savedProfile?.career_stage || "",
      current_background: savedProfile?.current_background || "",
      target_role: savedProfile?.target_role || "",
      goals: savedProfile?.goals || "",
      challenges: savedProfile?.challenges || [],
    };

    const areaState: AreaState = {
      activeArea: savedProfile?.active_area || null,
      coveredFacets: savedProfile?.covered_facets || [],
      closedAreas: savedProfile?.closed_areas || [],
      location: savedProfile?.location || null,
      situation: savedProfile?.situation || "",
      aims: savedProfile?.aims || "",
      stallCount: savedProfile?.stall_count || 0,
      wrappedUp: savedProfile?.wrapped_up || false,
      lastStage: savedProfile?.last_stage || null,
    };

    // ── 2. Load conversation history (OpenAI format) ─────────────────
    const { data: history } = await supabase
      .from("messages")
      .select("sender_id, content")
      .or(
        `and(sender_id.eq.${sender_id},receiver_id.eq.${AI_COACH_ID}),` +
        `and(sender_id.eq.${AI_COACH_ID},receiver_id.eq.${sender_id})`
      )
      .order("created_at", { ascending: false })
      .limit(HISTORY_FETCH);

    const conversationHistory: OAIMessage[] = (history || [])
      .reverse()
      .map((m) => ({
        role: (m.sender_id === AI_COACH_ID ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      }));

    // ── 3. Build converser with full context ──────────────────────────
    const context: ConverserContext = {
      currentEntities: [],
      userProfile,
      conversationHistory,
      areaState,
    };

    const coach = new BotemaCoach(context, supabase, sender_id, azureConfig);

    // ── 4. Routing ──────────────────────────────────────────────────
    let replyText: string;
    let functionCalled: string;
    let routingDebug: string | undefined;

    const activeAreaConfig = areaState.activeArea ? AREAS[areaState.activeArea] : null;

    if (activeAreaConfig && saysDone(message)) {
      // Layer 2a — she has finished, ahead of any model call. Checked before
      // the leave phrases so "no that's everything, thank you" can't be read
      // as a hand-off to another area. Mirrors scripts/coach-local.mjs.
      areaState.closedAreas = [...new Set([...areaState.closedAreas, areaState.activeArea!])];
      areaState.activeArea = null;
      areaState.stallCount = 0;
      areaState.wrappedUp = false;
      areaState.lastStage = null;
      await supabase.from("coach_user_profiles").upsert({
        user_id: sender_id,
        active_area: null, closed_areas: areaState.closedAreas,
        stall_count: 0, wrapped_up: false, last_stage: null,
        updated_at: new Date().toISOString(),
      });
      replyText = "Hope that's been helpful. Is there anything else on your mind?";
      functionCalled = "closeDiscussionArea";
    } else if (activeAreaConfig && saysLeaving(message)) {
      // Layer 2 — explicit leave, ahead of any model call.
      areaState.closedAreas = [...new Set([...areaState.closedAreas, areaState.activeArea!])];
      areaState.activeArea = null;
      areaState.stallCount = 0;
      areaState.wrappedUp = false;
      areaState.lastStage = null;
      await supabase.from("coach_user_profiles").upsert({
        user_id: sender_id,
        active_area: null, closed_areas: areaState.closedAreas,
        stall_count: 0, wrapped_up: false, last_stage: null,
        updated_at: new Date().toISOString(),
      });
      replyText = "Of course — what's on your mind?";
      functionCalled = "closeDiscussionArea";
    } else if (activeAreaConfig) {
      // An area is already open — go straight to it rather than risk the
      // generic router reclassifying a continuing message into something
      // else. Mirrors the local harness, which has no generic router inside
      // an area at all; one classification call decides everything.
      const fnName = AREA_TOPIC_TO_FUNCTION_NAME[areaState.activeArea!];
      const fn = coach.getFunctionByName(fnName);
      if (!fn) throw new Error(`No discussion-area function found for ${areaState.activeArea}`);
      replyText = await fn.call({}, message);
      functionCalled = fnName;
    } else {
      // No area open — entirely the AI's own judgment which function to
      // call, per rule 5 in the coach's routing instructions.
      const routed = await routeWithAI(
        coach.instructions,
        coach.functionSchemas,
        conversationHistory,
        message,
        azureConfig
      );
      routingDebug = routed.debug;
      console.log(`[Converser] Routing → ${routed.fnName}`, routed.fnArgs, routingDebug ? `(${routingDebug})` : "");
      const fn = coach.getFunctionByName(routed.fnName) || coach.getFunctionByName("adviseOnCareerTopic");
      if (!fn) throw new Error(`No function found: ${routed.fnName}`);
      replyText = await fn.call(routed.fnArgs, message);
      functionCalled = routed.fnName;
    }

    // ── 6. Save AI reply to messages table ────────────────────────────
    const { error: insertError } = await supabase.from("messages").insert({
      sender_id: AI_COACH_ID,
      receiver_id: sender_id,
      content: replyText,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText,
        function_called: functionCalled,
        ...(routingDebug ? { routing_debug: routingDebug } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-career-coach:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
