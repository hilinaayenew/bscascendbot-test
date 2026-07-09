/**
 * Purpose: Daily cron job that emails unread-message reminders at 1, 3, and 7 days.
 * DB tables: messages, profiles
 * Emails: message-reminder
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://bscascend.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to service_role callers — cron only.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (payload?.role !== "service_role") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Determine the highest reminder stage each unread message qualifies for
  // based on age. Stage 1 = 1d, Stage 2 = 3d, Stage 3 = 7d.
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, reminders_sent")
    .eq("read", false)
    .lt("reminders_sent", 3)
    .lte("created_at", new Date(now - ONE_DAY).toISOString())
    .limit(500);

  if (error) {
    console.error("Failed to fetch messages", error);
    return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!messages?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Compute target stage for each message
  type Item = { msg: (typeof messages)[number]; targetStage: number; ageLabel: string };
  const items: Item[] = [];
  for (const m of messages) {
    const ageMs = now - new Date(m.created_at).getTime();
    const ageDays = ageMs / ONE_DAY;
    let targetStage = 0;
    let ageLabel = "";
    if (ageDays >= 7) {
      targetStage = 3;
      ageLabel = "7 days ago";
    } else if (ageDays >= 3) {
      targetStage = 2;
      ageLabel = "3 days ago";
    } else if (ageDays >= 1) {
      targetStage = 1;
      ageLabel = "yesterday";
    }
    if (targetStage > (m.reminders_sent ?? 0)) {
      items.push({ msg: m, targetStage, ageLabel });
    }
  }

  if (!items.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Pre-fetch profiles for senders + recipients
  const userIds = new Set<string>();
  items.forEach(({ msg }) => {
    userIds.add(msg.sender_id);
    userIds.add(msg.receiver_id);
  });
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", Array.from(userIds));
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

  let sent = 0;
  const messagesUrl = `${SITE_URL}/messages`;

  for (const { msg, targetStage, ageLabel } of items) {
    const recipient = profileMap.get(msg.receiver_id);
    const sender = profileMap.get(msg.sender_id);
    if (!recipient?.email) continue;

    // Do not send automated message reminders to the admin/BSC email
    const recipientEmailLower = recipient.email.toLowerCase();
    if (
      recipientEmailLower === "mentorship@becauseshecan.tech" ||
      recipientEmailLower === "mentorships@becauseshecan.tech"
    ) {
      continue;
    }

    const previewText = (msg.content || "").slice(0, 140);

    const { error: sendErr } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "message-reminder",
        recipientEmail: recipient.email,
        idempotencyKey: `msg-reminder-${msg.id}-${targetStage}`,
        templateData: {
          recipientName: recipient.full_name,
          senderName: sender?.full_name || "BSC Coordinator",
          ageLabel,
          preview: previewText,
          messagesUrl,
        },
      },
    });

    if (sendErr) {
      console.error("Send failed", { messageId: msg.id, err: sendErr });
      continue;
    }

    await supabase.from("messages").update({ reminders_sent: targetStage }).eq("id", msg.id);

    sent++;
  }

  console.log(`Sent ${sent} unread-message reminders`);

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
