import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, X } from "lucide-react";
import { toast } from "sonner";
import { AI_COACH_ID, AI_COACH_NAME } from "@/lib/constants";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean | null;
}

function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const AICoachWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<"botema" | "chataki" | null>(() => {
    const saved = sessionStorage.getItem("selectedBot");
    return saved === "botema" || saved === "chataki" ? saved : null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pickBot = (bot: "botema" | "chataki") => {
    sessionStorage.setItem("selectedBot", bot);
    setSelectedBot(bot);
    setBotMenuOpen(false);
  };

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${AI_COACH_ID}),and(sender_id.eq.${AI_COACH_ID},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(500);
    setMessages(data || []);
  }, [user]);

  const markRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", AI_COACH_ID)
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnread(0);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", AI_COACH_ID)
      .eq("receiver_id", user.id)
      .eq("read", false)
      .then(({ count }) => setUnread(count || 0));

    const channel = supabase
      .channel(`${user.id}-ai-coach-widget`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== AI_COACH_ID) return;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (open) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          } else {
            setUnread((u) => u + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, open]);

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      markRead();
    }
  }, [open, user, fetchMessages, markRead]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Auto-grow the textarea with content, up to a max height, then scroll internally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    const msgText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender_id: user.id, receiver_id: AI_COACH_ID, content: msgText, created_at: new Date().toISOString(), read: false },
    ]);

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: AI_COACH_ID,
      content: msgText,
    });

    if (error) {
      toast.error("Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSending(false);
      return;
    }

    supabase.functions
      .invoke("ai-career-coach", { body: { message: msgText, sender_id: user.id, bot: selectedBot ?? "chataki" } })
      .then(() => fetchMessages())
      .catch((err) => {
        console.error("AI Coach Error:", err);
        toast.error("AI Coach is unavailable right now.");
      })
      .finally(() => setSending(false));
  };

  if (!user) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] h-[32rem] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center gap-2 bg-primary text-primary-foreground">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-body text-sm font-semibold flex-1 truncate">
              {selectedBot === "botema" ? "Botema" : selectedBot === "chataki" ? "Chataki" : AI_COACH_NAME}
            </span>

            <div className="relative">
              <button
                onClick={() => setBotMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-body px-2 py-1 rounded-md border border-primary-foreground/30 hover:bg-primary-foreground/10 transition-colors"
              >
                {selectedBot === "botema" ? "🤖 Botema" : selectedBot === "chataki" ? "🤖 Chataki" : "Select coach"}
              </button>
              {botMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 text-popover-foreground">
                  <button
                    onClick={() => pickBot("botema")}
                    className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded-t-lg ${selectedBot === "botema" ? "bg-muted" : ""}`}
                  >
                    <p className="font-body text-sm font-semibold">🤖 Botema</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Direct, personal, African tech context</p>
                  </button>
                  <button
                    onClick={() => pickBot("chataki")}
                    className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded-b-lg ${selectedBot === "chataki" ? "bg-muted" : ""}`}
                  >
                    <p className="font-body text-sm font-semibold">🤖 Chataki</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Warm, thorough, research-backed</p>
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/10 rounded-md transition-colors" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="font-body text-xs text-muted-foreground text-center py-6">
                Ask me anything about your tech career — getting started, CVs, interviews, mentorship, or working through a tough moment.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] flex flex-col">
                  <div
                    className={`rounded-lg px-3 py-2 font-body text-sm whitespace-pre-line ${
                      m.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className={`font-body text-[10px] text-muted-foreground mt-1 ${m.sender_id === user.id ? "text-right" : "text-left"}`}>
                    {formatMessageTime(m.created_at)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask your AI Career Coach..."
              rows={1}
              className="font-body min-h-[40px] max-h-[120px] resize-none py-2"
            />
            <Button size="icon" onClick={sendMessage} disabled={sending} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating icon */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        title="AI Career Coach"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-body">
            {unread}
          </span>
        )}
      </button>
    </>
  );
};

export default AICoachWidget;
