import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Inbox, Send, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BSC_COORDINATOR_ID } from "@/lib/constants";

interface AdminInboxProps {
  allUsers: Array<{
    user_id: string;
    full_name: string;
    email: string | null;
    roles: string[];
  }>;
}

interface ThreadMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean | null;
}

interface ThreadSummary {
  userId: string;
  fullName: string;
  email: string | null;
  roles: string[];
  lastMessage: string;
  lastAt: string;
  unread: number;
}

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const AdminInbox = ({ allUsers }: AdminInboxProps) => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const userLookup = (id: string) => allUsers.find((u) => u.user_id === id);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .or(`sender_id.eq.${BSC_COORDINATOR_ID},receiver_id.eq.${BSC_COORDINATOR_ID}`)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error("Failed to load inbox.");
      setLoading(false);
      return;
    }
    const map = new Map<string, ThreadSummary>();
    (data || []).forEach((m) => {
      const otherId = m.sender_id === BSC_COORDINATOR_ID ? m.receiver_id : m.sender_id;
      const existing = map.get(otherId);
      if (!existing) {
        const u = userLookup(otherId);
        map.set(otherId, {
          userId: otherId,
          fullName: u?.full_name || "Unknown user",
          email: u?.email ?? null,
          roles: u?.roles ?? [],
          lastMessage: m.content,
          lastAt: m.created_at,
          unread:
            m.receiver_id === BSC_COORDINATOR_ID && !m.read ? 1 : 0,
        });
      } else if (m.receiver_id === BSC_COORDINATOR_ID && !m.read) {
        existing.unread += 1;
      }
    });
    // Only keep threads where the user has actually messaged BSC Admin (inbound exists)
    const list = Array.from(map.values()).filter((t) =>
      (data || []).some(
        (m) => m.sender_id === t.userId && m.receiver_id === BSC_COORDINATOR_ID
      )
    );
    list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setThreads(list);
    setLoading(false);
  }, [allUsers]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Realtime — refresh inbox on any BSC Admin message
  useEffect(() => {
    const channel = supabase
      .channel("admin-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${BSC_COORDINATOR_ID}` },
        () => fetchThreads()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchThreads]);

  // Load selected thread
  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, read, created_at")
        .or(
          `and(sender_id.eq.${selected},receiver_id.eq.${BSC_COORDINATOR_ID}),and(sender_id.eq.${BSC_COORDINATOR_ID},receiver_id.eq.${selected})`
        )
        .order("created_at", { ascending: true })
        .limit(500);
      setMessages(data || []);
      // Mark inbound as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", selected)
        .eq("receiver_id", BSC_COORDINATOR_ID)
        .eq("read", false);
      fetchThreads();
    };
    load();
  }, [selected, fetchThreads]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const { data: newId, error } = await supabase.rpc("send_system_message", {
      p_receiver_id: selected,
      p_content: reply.trim(),
    });
    if (error) {
      toast.error(error.message || "Failed to send reply.");
    } else {
      if (newId) {
        supabase.functions
          .invoke("notify-new-message", { body: { messageId: newId } })
          .catch((err) => console.error("notify-new-message failed", err));
      }
      setReply("");
      // Optimistic append
      setMessages((prev) => [
        ...prev,
        {
          id: (newId as string) || crypto.randomUUID(),
          sender_id: BSC_COORDINATOR_ID,
          receiver_id: selected,
          content: reply.trim(),
          created_at: new Date().toISOString(),
          read: false,
        },
      ]);
      fetchThreads();
    }
    setSending(false);
  };

  const selectedThread = threads.find((t) => t.userId === selected);

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr] h-[600px]">
      {/* Threads list */}
      <Card className="shadow-card flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Inbox
            {threads.reduce((n, t) => n + t.unread, 0) > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-body">
                {threads.reduce((n, t) => n + t.unread, 0)} unread
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-body text-sm text-muted-foreground">
                No messages from users yet.
              </p>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.userId}
                onClick={() => setSelected(t.userId)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors cursor-pointer ${
                  selected === t.userId ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs sora-semibold shrink-0">
                    {initials(t.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body text-sm font-medium truncate">{t.fullName}</p>
                      {t.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-body shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body text-xs text-muted-foreground truncate">{t.lastMessage}</p>
                      <span className="font-body text-[10px] text-muted-foreground shrink-0">
                        {formatTime(t.lastAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Thread view */}
      <Card className="shadow-card flex flex-col">
        {selectedThread ? (
          <>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="font-body text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs sora-semibold shrink-0">
                  {initials(selectedThread.fullName)}
                </div>
                <div className="flex flex-col">
                  <span>{selectedThread.fullName}</span>
                  <span className="font-body text-xs text-muted-foreground font-normal">
                    {selectedThread.email} · {selectedThread.roles.join(", ") || "no role"}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const fromAdmin = m.sender_id === BSC_COORDINATOR_ID;
                return (
                  <div key={m.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%] flex flex-col">
                      <div
                        className={`rounded-lg px-4 py-2 font-body text-sm whitespace-pre-line ${
                          fromAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span
                        className={`font-body text-[10px] text-muted-foreground mt-1 ${
                          fromAdmin ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </CardContent>
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !sending && sendReply()}
                placeholder="Reply as BSC Admin..."
                className="font-body"
                disabled={sending}
              />
              <Button size="icon" onClick={sendReply} disabled={sending || !reply.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="font-body text-muted-foreground">
                Select a conversation to view and reply.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminInbox;