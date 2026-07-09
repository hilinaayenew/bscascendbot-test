import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated admin caller.
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const callerId = claimsData?.claims?.sub;
    if (claimsErr || !callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: isAdminRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin");
    if (!isAdminRows || isAdminRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all mentors (approved) with profiles
    const { data: mentorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "mentor");

    const mentorIds = mentorRoles?.map((r: any) => r.user_id) || [];

    const { data: approvedMentors } = await supabase
      .from("mentor_details")
      .select("*")
      .eq("approval_status", "approved")
      .in("user_id", mentorIds);

    const approvedMentorIds = approvedMentors?.map((m: any) => m.user_id) || [];

    // Get all mentees
    const { data: menteeRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "mentee");

    const menteeIds = menteeRoles?.map((r: any) => r.user_id) || [];

    if (!approvedMentorIds.length || !menteeIds.length) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Not enough mentors or mentees to match." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles for all
    const allIds = [...approvedMentorIds, ...menteeIds];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", allIds);

    // Get existing pairings to avoid duplicates
    const { data: existingPairings } = await supabase
      .from("pairings")
      .select("mentor_id, mentee_id")
      .in("status", ["active", "pending"]);

    const existingPairs = new Set(
      (existingPairings || []).map((p: any) => `${p.mentor_id}:${p.mentee_id}`)
    );

    const mentorProfiles = (profiles || []).filter((p: any) => approvedMentorIds.includes(p.user_id));
    const menteeProfiles = (profiles || []).filter((p: any) => menteeIds.includes(p.user_id));

    // Build prompt for AI
    const mentorSummaries = mentorProfiles.map((m: any) => {
      const details = approvedMentors?.find((d: any) => d.user_id === m.user_id);
      return `Mentor [${m.user_id}] "${m.full_name}": country=${m.country || "unknown"}, expertise=${(m.expertise || []).join(", ")}, specializations=${(details?.specializations || []).join(", ")}, experience=${details?.years_experience || 0} years, bio="${m.bio || ""}"`;
    }).join("\n");

    const menteeSummaries = menteeProfiles.map((m: any) =>
      `Mentee [${m.user_id}] "${m.full_name}": country=${m.country || "unknown"}, interests=${(m.interests || []).join(", ")}, pathway=${m.pathway_level || "curious"}, bio="${m.bio || ""}"`
    ).join("\n");

    const existingPairsStr = existingPairs.size > 0
      ? `\nAlready paired (skip these): ${Array.from(existingPairs).join(", ")}`
      : "";

    const prompt = `You are an AI matching system for the Ascendency mentorship program by Because She Can.

Suggest optimal pairings using ALL of the following weighted criteria:
1. Industry / domain overlap — strongest signal. Compare mentor expertise + specializations against mentee interests and bio. Reward direct overlap (e.g. "Product Management" mentor ↔ "PM" mentee) and closely related fields (e.g. "Backend" ↔ "Full Stack").
2. Years of experience vs pathway level — match seniority to need.
   - "curious" mentees → have LESS than 2 years of experience themselves; pair with mentors offering broad, foundational guidance (any seniority works, but approachability matters more than deep specialization)
   - "mentee" / early-career → mentors with 3+ years
   - "apprentice" / advanced → mentors with 5+ years and deep specialization
   Penalise mentors whose experience is clearly too junior for the mentee's pathway.
3. Country proximity — prefer same country, then same African region (West, East, North, Southern, Central Africa), then same continent. Cross-continent matches are allowed but should score lower unless industry fit is exceptional.
4. Complementary backgrounds and bio context.

Scoring guidance (0-100):
- 90-100: strong industry overlap + appropriate seniority + same country/region
- 75-89: solid industry overlap + appropriate seniority, possibly different country
- 60-74: partial overlap or seniority gap
- below 60: do not return

In each "reason", explicitly mention the industry overlap, the experience-vs-pathway fit, and the country/region relationship.

MENTORS:
${mentorSummaries}

MENTEES:
${menteeSummaries}
${existingPairsStr}

Only suggest pairs that don't already exist. Return up to 10 matches, sorted by score descending.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "You are an expert mentorship matching AI for an Africa-focused women-in-tech program. You weigh industry overlap, years of experience vs pathway level, and country/region proximity. Return only valid structured tool calls." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_matches",
            description: "Return mentor-mentee match suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      mentor_id: { type: "string" },
                      mentee_id: { type: "string" },
                      score: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["mentor_id", "mentee_id", "score", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_matches" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = JSON.parse(toolCall?.function?.arguments || "{}");
    const suggestions = parsed.suggestions || [];

    // Enrich with names
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
    const enriched = suggestions.map((s: any) => ({
      ...s,
      mentor_name: profileMap.get(s.mentor_id) || "Unknown",
      mentee_name: profileMap.get(s.mentee_id) || "Unknown",
    }));

    return new Response(
      JSON.stringify({ suggestions: enriched }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("AI match error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});