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
import { BSCCoach } from "./bsc-coach.ts";
import { BotemaCoach } from "./botema-coach.ts";
import type { UserProfile, ConverserContext, AzureConfig, AzureToolSchema, OAIMessage } from "./converser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_COACH_ID = "00000000-0000-0000-0000-000000000002";

// ============================================================
// AI ROUTER — the model picks which function to call via
// Azure OpenAI function calling (tool_choice: required), using the
// coach's own routing instructions and function schemas.
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
        ...history.slice(-6),
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
    const { message, sender_id, bot = "chataki" } = await req.json();
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
    const { data: savedProfile } = await supabase
      .from("coach_user_profiles")
      .select("career_stage, current_background, target_role, goals, challenges")
      .eq("user_id", sender_id)
      .single();

    const userProfile: UserProfile = {
      career_stage: savedProfile?.career_stage || "",
      current_background: savedProfile?.current_background || "",
      target_role: savedProfile?.target_role || "",
      goals: savedProfile?.goals || "",
      challenges: savedProfile?.challenges || [],
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
      .limit(10);

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
    };

    const coach = bot === "botema"
      ? new BotemaCoach(context, supabase, sender_id, azureConfig)
      : new BSCCoach(context, supabase, sender_id, azureConfig);

    // ── 4. AI routing call — model selects the function via tool_choice ──
    const { fnName, fnArgs, debug: routingDebug } = await routeWithAI(
      coach.instructions,
      coach.functionSchemas,
      conversationHistory,
      message,
      azureConfig
    );
    console.log(`[Converser] Routing → ${fnName}`, fnArgs, routingDebug ? `(${routingDebug})` : "");

    // ── 5. Execute the selected function ──────────────────────────────
    let replyText: string;
    const functionCalled = fnName;

    {
      const fn = coach.getFunctionByName(fnName) || coach.getFunctionByName("adviseOnCareerTopic");
      if (!fn) throw new Error(`No function found: ${fnName}`);
      replyText = await fn.call(fnArgs, message);
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
