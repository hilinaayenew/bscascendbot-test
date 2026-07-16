/**
 * Purpose: Send an instant email notification when a user receives a new message.
 * Auth: JWT verified in-code. Caller must be the sender of the message they reference.
 * DB tables: messages, profiles
 * Emails: new-message-notification
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://bscascend.lovable.app";
const SYSTEM_SENDER_ID = "00000000-0000-0000-0000-000000000001";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1) Verify JWT
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const callerId = claimsData.claims.sub as string;

  // 2) Validate input
  let body: { messageId?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(messageId)) {
    return jsonResponse({ error: "Invalid messageId" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 3) Load message and confirm caller is the actual sender
  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (msgErr || !msg) return jsonResponse({ error: "Message not found" }, 404);
  // Allow the actual sender, OR an admin dispatching a system (BSC Admin) message.
  if (msg.sender_id !== callerId) {
    if (msg.sender_id === SYSTEM_SENDER_ID) {
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (!isAdmin) return jsonResponse({ error: "Forbidden" }, 403);
    } else {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
  }

  // 4) Load recipient + sender profiles (incl. notification preference)
  const { data: profs } = await admin
    .from("profiles")
    .select("user_id, full_name, email, email_notify_new_message")
    .in("user_id", [msg.sender_id, msg.receiver_id]);

  const recipient = profs?.find((p) => p.user_id === msg.receiver_id);
  const sender = profs?.find((p) => p.user_id === msg.sender_id);

  if (!recipient?.email) return jsonResponse({ skipped: "no_recipient_email" });
  if (recipient.email_notify_new_message === false) {
    return jsonResponse({ skipped: "opted_out" });
  }

  const recipientEmailLower = recipient.email.toLowerCase();
  if (
    recipientEmailLower === "mentorship@becauseshecan.tech" ||
    recipientEmailLower === "mentorships@becauseshecan.tech"
  ) {
    return jsonResponse({ skipped: "admin_inbox" });
  }

  const previewText = (msg.content || "").slice(0, 200);

  const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "new-message-notification",
      recipientEmail: recipient.email,
      idempotencyKey: `new-msg-${msg.id}`,
      templateData: {
        recipientName: recipient.full_name,
        senderName: sender?.full_name || "A community member",
        preview: previewText,
        messagesUrl: `${SITE_URL}/messages`,
      },
    },
  });

  if (sendErr) {
    console.error("Failed to enqueue new-message email", sendErr);
    return jsonResponse({ error: "Send failed" }, 500);
  }

  return jsonResponse({ sent: true });
});