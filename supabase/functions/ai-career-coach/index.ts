// @ts-nocheck
// BSC AI Career Coach — Edge Function Entry Point (Converser Architecture)
// Vivid Insights Converser pattern ported to TypeScript/Deno
//
// Flow per request:
//   1. Load user profile + conversation history from Supabase
//   2. Build BSCCoach converser with context
//   3. Routing call → Azure OpenAI selects which function to invoke (tool_choice: auto),
//      or answers directly if no function fits
//   4. Execute the function (CHANGE_CONTEXT auto-chains to WORDALISE), or use the direct answer
//   5. Save AI reply to messages table + return it

import { createClient } from "npm:@supabase/supabase-js@2";
import { BSCCoach } from "./bsc-coach.ts";
import { BotemaCoach } from "./botema-coach.ts";
import type { UserProfile, ConverserContext, AzureConfig, OAIMessage } from "./converser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_COACH_ID = "00000000-0000-0000-0000-000000000002";

// ============================================================
// KEYWORD ROUTER — fast, reliable routing without an extra AI call
// ============================================================
function routeMessage(message: string, context: ConverserContext): { fnName: string; fnArgs: Record<string, unknown> } {
  const m = message.toLowerCase().trim();

  // Greeting — only pure greetings with no career content
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|hiya|sup|what's up|whats up)[\s!?.,']*$/.test(m)) {
    return { fnName: "howCoachWorks", fnArgs: {} };
  }

  // Mindset challenges
  if (/imposter|don.t belong|dont belong|i don.t fit|feel like a fraud|not smart enough|not good enough|afraid (of|that)|scared|anxiety|anxious|burnout|burnt out|demotivat|unmotivat|lost (my )?motivation|no motivation|feel stuck|feel lost|feel overwhelm|losing hope|giving up|self.doubt|insecur|lack confidence/.test(m)) {
    return { fnName: "addressMindsetChallenge", fnArgs: { challenge_type: "general" } };
  }

  // Background capture — only when message is long and shares substantial personal detail
  if (
    message.length > 120 &&
    /\b(i am|i'm|i work(ed)?|my background|i studied|i graduated|years? of experience|i have \d|my goal is|i want to become|i currently)\b/.test(m)
  ) {
    return { fnName: "captureUserBackground", fnArgs: extractBackground(m) };
  }

  // Everything else → topic advice (the main function)
  return { fnName: "updateCareerTopic", fnArgs: { topic: extractTopic(m) } };
}

function extractTopic(m: string): string {
  if (/cv|resume|cover letter/.test(m)) return "cv and job search";
  if (/job search|job hunt|find(ing)? a job|job board|apply|application|linkedin/.test(m)) return "job search";
  if (/interview|technical test|coding test|leetcode/.test(m)) return "interview preparation";
  if (/salary|pay rise|pay raise|negotiat|compensation/.test(m)) return "salary negotiation";
  if (/imposter|confidence|belong|motivat|burnout|mental|overwhelm/.test(m)) return "mindset";
  if (/mentor|sponsor|bsc|pairing/.test(m)) return "mentorship";
  if (/master|degree|certif|bootcamp|further study|scholarship/.test(m)) return "further education";
  if (/python|javascript|html|css|coding|programming|software|developer|web dev|full.?stack|frontend|backend/.test(m)) return "software development";
  if (/data science|machine learning|ml|ai|artificial intelligence|data analyst/.test(m)) return "data science and AI";
  if (/ux|ui|design|figma|user research/.test(m)) return "UX design";
  if (/cybersecur|security|ethical hack|pentest/.test(m)) return "cybersecurity";
  if (/cloud|devops|aws|azure|gcp|docker|kubernetes/.test(m)) return "cloud and DevOps";
  if (/product manager|product management|pm role/.test(m)) return "product management";
  if (/start|begin|new to tech|no background|where do i|how do i get into|learn tech|learn to code/.test(m)) return "getting started in tech";
  if (/africa|ethiopia|nigeria|kenya|ghana|uganda|rwanda|remote|work from home/.test(m)) return "tech careers in Africa";
  return "tech career guidance";
}

function extractBackground(m: string): Record<string, string> {
  const args: Record<string, string> = {};
  if (/beginner|new to tech|no background|no experience|complete(ly)? new/.test(m)) args.career_stage = "complete_beginner";
  else if (/switch(ing)?|transition(ing)?|career change/.test(m)) args.career_stage = "career_changer";
  else if (/junior|early career|just started|graduate|entry level/.test(m)) args.career_stage = "early_career";
  if (/nurse|teacher|finance|banking|accountant|lawyer|doctor|engineer|marketing|sales/.test(m)) {
    const match = m.match(/(nurse|teacher|finance|banking|accountant|lawyer|doctor|engineer|marketing|sales)/);
    if (match) args.current_background = match[1];
  }
  if (/developer|data scientist|designer|product manager|devops|cloud|security/.test(m)) {
    const match = m.match(/(developer|data scientist|designer|product manager|devops|cloud engineer|security engineer)/);
    if (match) args.target_role = match[1];
  }
  return args;
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

    // ── 4. AI-based routing: the model picks which function to call ───
    // Falls back to the keyword router only if the Azure routing call itself
    // errors (network/credentials) — not when the model simply finds no
    // function fits, which is handled by `directAnswer` below.
    let fnName: string | null;
    let fnArgs: Record<string, unknown>;
    let directAnswer: string | null;
    try {
      ({ fnName, fnArgs, directAnswer } = await coach.routeViaAI(message));
      console.log(`[Converser] AI routing → ${fnName ?? "direct answer"}`, fnArgs);
    } catch (routingError) {
      console.error("AI routing failed, falling back to keyword router:", routingError);
      const fallback = routeMessage(message, context);
      fnName = fallback.fnName;
      fnArgs = fallback.fnArgs;
      directAnswer = null;
      console.log(`[Converser] Keyword routing → ${fnName}`, fnArgs);
    }

    // ── 5. Execute the selected function, or use the model's direct answer ──
    let replyText: string;
    const functionCalled = fnName;

    if (directAnswer) {
      replyText = directAnswer;
    } else {
      const fn = coach.getFunctionByName(fnName!) || coach.getFunctionByName("adviseOnCareerTopic");
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
      JSON.stringify({ success: true, reply: replyText, function_called: functionCalled }),
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
