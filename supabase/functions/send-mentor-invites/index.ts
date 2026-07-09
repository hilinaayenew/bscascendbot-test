import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate caller's JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify caller is admin
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: isAdmin } = await serviceClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse emails list
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { emails } = body;
  if (!Array.isArray(emails) || emails.length === 0) {
    return new Response(JSON.stringify({ error: "emails array is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const email of emails) {
    if (!email) {
      results.push({ email, status: "skipped", reason: "missing email" });
      continue;
    }

    try {
      // Look up the user by email to get their full_name
      // Actually, we can get full_name from the profile
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("full_name")
        .eq("email", email)
        .maybeSingle();

      const full_name = profile?.full_name || "";
      const first_name = full_name ? full_name.split(" ")[0] : "";

      // Generate a recovery link — this forces the mentor to set a password
      // before being signed in, instead of auto-logging them in (magiclink).
      const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `https://becauseshecan.tech/onboarding`,
        },
      });

      if (linkError) {
        results.push({ email, status: "error", reason: "Failed to generate invite link: " + linkError.message });
        continue;
      }

      const inviteUrl = linkData.properties.action_link;

      // We call the internal send-transactional-email function
      // It handles rendering the template and enqueuing it in the db.
      const sendEmailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`, // bypass JWT verification
        },
        body: JSON.stringify({
          templateName: "mentor-pool-invite",
          recipientEmail: email,
          templateData: {
            name: first_name,
            inviteUrl: inviteUrl,
          },
        }),
      });

      if (!sendEmailRes.ok) {
        const errData = await sendEmailRes.text();
        results.push({ email, status: "error", reason: "Failed to send email: " + errData });
        continue;
      }

      results.push({ email, status: "success" });
    } catch (err: any) {
      results.push({ email, status: "error", reason: err.message });
    }
  }

  const summary = {
    total: emails.length,
    success: results.filter((r) => r.status === "success").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    details: results,
  };

  console.log("Send invites complete", summary);
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
