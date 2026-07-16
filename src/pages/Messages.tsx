import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, MessageSquare, Compass, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BSC_COORDINATOR_ID, BSC_COORDINATOR_NAME, AI_COACH_ID } from "@/lib/constants";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean | null;
}

interface Contact {
  user_id: string;
  full_name: string;
  lastMessage?: string;
  unread: number;
  isSystem?: boolean;
}

interface PairableUser {
  user_id: string;
  full_name: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

const BSCAvatar = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const dims = size === "md" ? "w-8 h-8" : "w-8 h-8";
  return (
    <div className={`${dims} rounded-full bg-accent flex items-center justify-center shrink-0`}>
      <ShieldCheck className={`${size === "md" ? "h-4 w-4" : "h-4 w-4"} text-accent-foreground`} />
    </div>
  );
};

const Messages = () => {
  const { user, roles, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(searchParams.get("to"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNameLoading, setContactNameLoading] = useState(false);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [pairableUsers, setPairableUsers] = useState<PairableUser[]>([]);
  const [hasPairings, setHasPairings] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMentor = roles.includes("mentor");
  const isSystemContact = selectedContact === BSC_COORDINATOR_ID;

  // Fetch contacts (people user has messaged or received from)
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, read, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(500);

    const contactMap = new Map<string, { lastMessage: string; unread: number }>();
    (msgs || []).forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!contactMap.has(otherId)) {
        contactMap.set(otherId, { lastMessage: m.content, unread: 0 });
      }
      if (m.receiver_id === user.id && !m.read) {
        const entry = contactMap.get(otherId)!;
        entry.unread++;
      }
    });

    // Add the "to" param contact if not in list
    const toId = searchParams.get("to");
    if (toId && !contactMap.has(toId)) {
      contactMap.set(toId, { lastMessage: "", unread: 0 });
    }

    const userIds = Array.from(contactMap.keys()).filter(id => id !== BSC_COORDINATOR_ID && id !== AI_COACH_ID);
    const hasBSC = contactMap.has(BSC_COORDINATOR_ID);

    // Build contact list — BSC Admin is always pinned first
    const contactList: Contact[] = [];
    if (hasBSC) {
      contactList.push({
        user_id: BSC_COORDINATOR_ID,
        full_name: BSC_COORDINATOR_NAME,
        lastMessage: contactMap.get(BSC_COORDINATOR_ID)?.lastMessage,
        unread: contactMap.get(BSC_COORDINATOR_ID)?.unread || 0,
        isSystem: true,
      });
    }

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      (profiles || []).forEach((p) => {
        contactList.push({
          user_id: p.user_id,
          full_name: p.full_name || "Unknown",
          lastMessage: contactMap.get(p.user_id)?.lastMessage,
          unread: contactMap.get(p.user_id)?.unread || 0,
        });
      });
    }

    setContacts(contactList);
  }, [user, searchParams]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Fetch pairable users for "new conversation"
  useEffect(() => {
    if (!user) return;
    const fetchPairableUsers = async () => {
      const { data: pairingsAsMentor } = await supabase
        .from("pairings")
        .select("mentee_id")
        .eq("mentor_id", user.id)
        .eq("status", "active");

      const { data: pairingsAsMentee } = await supabase
        .from("pairings")
        .select("mentor_id")
        .eq("mentee_id", user.id)
        .eq("status", "active");

      const pairedIds = new Set<string>();
      (pairingsAsMentor || []).forEach((p) => pairedIds.add(p.mentee_id));
      (pairingsAsMentee || []).forEach((p) => pairedIds.add(p.mentor_id));

      setHasPairings(pairedIds.size > 0);

      if (pairedIds.size === 0) {
        setPairableUsers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(pairedIds));

      setPairableUsers(
        (profiles || []).map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name || "Unknown",
        }))
      );
    };
    fetchPairableUsers();
  }, [user]);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedContact) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact}),and(sender_id.eq.${selectedContact},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(500);

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", selectedContact)
      .eq("receiver_id", user.id)
      .eq("read", false);
  }, [user, selectedContact]);

  useEffect(() => {
    if (!user || !selectedContact) return;

    setContactNameLoading(true);

    // Load contact name
    if (selectedContact === BSC_COORDINATOR_ID) {
      setContactName(BSC_COORDINATOR_NAME);
      setContactNameLoading(false);
    } else {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", selectedContact)
        .single()
        .then(({ data: profile }) => {
          setContactName(profile?.full_name || "");
          setContactNameLoading(false);
        });
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`${user.id}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedContact) {
            setMessages((prev) => [...prev, msg]);
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;

    const msgText = newMessage.trim();
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: selectedContact,
        content: msgText,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to send message.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: inserted?.id ?? crypto.randomUUID(),
        sender_id: user.id,
        receiver_id: selectedContact,
        content: msgText,
        created_at: new Date().toISOString(),
        read: false,
      },
    ]);
    setNewMessage("");
    fetchContacts();

    if (inserted?.id) {
      // Fire-and-forget instant email notification (recipient preference checked server-side)
      supabase.functions
        .invoke("notify-new-message", { body: { messageId: inserted.id } })
        .catch((err) => console.error("notify-new-message failed", err));
    }
  };

  const startConversation = (userId: string) => {
    setSelectedContact(userId);
    setShowNewConvo(false);
  };

  const displayName = contactNameLoading
    ? selectedContact
      ? isSystemContact
        ? BSC_COORDINATOR_NAME
        : getInitials(contacts.find((c) => c.user_id === selectedContact)?.full_name || "??")
      : ""
    : contactName || "Unknown";

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-body">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/mentee-auth" replace />;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Contacts list */}
        <Card className="w-72 shrink-0 hidden md:flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Messages</CardTitle>
              {hasPairings && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewConvo(!showNewConvo)}
                  title="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {/* New conversation dropdown */}
            {showNewConvo && (
              <div className="border-b border-border bg-muted/50 p-3 space-y-1">
                <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Start a conversation
                </p>
                {pairableUsers
                  .filter((pu) => !contacts.some((c) => c.user_id === pu.user_id))
                  .map((pu) => (
                    <button
                      key={pu.user_id}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                      onClick={() => startConversation(pu.user_id)}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs sora-semibold shrink-0">
                        {getInitials(pu.full_name)}
                      </div>
                      <span className="font-body text-sm truncate">{pu.full_name}</span>
                    </button>
                  ))}
                {pairableUsers.filter((pu) => !contacts.some((c) => c.user_id === pu.user_id)).length === 0 && (
                  <p className="font-body text-xs text-muted-foreground text-center py-2">
                    You already have conversations with all your paired connections.
                  </p>
                )}
              </div>
            )}

            {contacts.map((c) => (
              <div
                key={c.user_id}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors cursor-pointer ${
                  selectedContact === c.user_id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedContact(c.user_id)}
              >
                <div className="flex items-center gap-2">
                  {c.isSystem ? (
                    <BSCAvatar />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs sora-semibold shrink-0">
                      {getInitials(c.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-body text-sm truncate ${c.isSystem ? "sora-semibold" : "font-medium"}`}>
                        {c.full_name}
                      </p>
                      {c.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-body shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {contacts.length === 0 && !showNewConvo && (
              <div className="py-8 px-4 text-center space-y-3">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
                {hasPairings === false ? (
                  <>
                    <p className="font-body text-sm text-muted-foreground">
                      You're not paired with anyone yet. Find a {isMentor ? "mentee" : "mentor"} to connect with!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-body"
                      onClick={() => navigate("/dashboard/explore")}
                    >
                      <Compass className="h-4 w-4 mr-2" />
                      Explore
                    </Button>
                  </>
                ) : hasPairings ? (
                  <>
                    <p className="font-body text-sm text-muted-foreground">
                      No conversations yet. Start one with your paired connections!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-body"
                      onClick={() => setShowNewConvo(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New conversation
                    </Button>
                  </>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle
                  className={`font-body text-base flex items-center gap-2 ${
                    isSystemContact ? "" : "hover:text-primary transition-colors cursor-pointer"
                  }`}
                  onClick={() => !isSystemContact && navigate(`/dashboard/profile/${selectedContact}`)}
                >
                  {isSystemContact ? (
                    <BSCAvatar size="md" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs sora-semibold shrink-0">
                      {getInitials(contactName || contacts.find((c) => c.user_id === selectedContact)?.full_name || "??")}
                    </div>
                  )}
                  {displayName}
                  {isSystemContact && (
                    <span className="text-xs font-body text-muted-foreground font-normal ml-1">
                      · Platform support
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[70%] flex flex-col">
                      <div
                        className={`rounded-lg px-4 py-2 font-body text-sm whitespace-pre-line ${
                          m.sender_id === user.id
                            ? "bg-primary text-primary-foreground"
                            : m.sender_id === BSC_COORDINATOR_ID
                            ? "bg-accent/10 text-foreground border border-accent/20"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span
                        className={`font-body text-[10px] text-muted-foreground mt-1 ${
                          m.sender_id === user.id ? "text-right" : "text-left"
                        }`}
                      >
                        {formatMessageTime(m.created_at)}
                        {m.sender_id === user.id && (
                          <span className="ml-1">
                            {m.read ? "· Read" : "· Sent"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
              {/* Input area */}
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={isSystemContact ? "Message BSC Admin..." : "Type a message..."}
                  className="font-body"
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="font-body text-muted-foreground">
                  {contacts.length > 0
                    ? "Select a conversation to start messaging."
                    : hasPairings === false
                    ? "You're not paired with anyone yet."
                    : "Start a new conversation from the sidebar."}
                </p>
                {hasPairings === false && (
                  <Button
                    variant="outline"
                    className="font-body"
                    onClick={() => navigate("/dashboard/explore")}
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    Find connections on Explore
                  </Button>
                )}

                {/* Mobile: show contacts inline */}
                <div className="md:hidden space-y-2 mt-4">
                  {/* BSC Admin on mobile */}
                  {contacts.filter(c => c.isSystem).map((c) => (
                    <button
                      key={c.user_id}
                      className="w-full text-left px-4 py-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedContact(c.user_id)}
                    >
                      <BSCAvatar />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-body text-sm sora-semibold truncate">{c.full_name}</span>
                          {c.unread > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-body shrink-0">
                              {c.unread}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                      </div>
                    </button>
                  ))}

                  {hasPairings && pairableUsers.length > 0 && (
                    <>
                      <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider">
                        Start a conversation
                      </p>
                      {pairableUsers.map((pu) => (
                        <button
                          key={pu.user_id}
                          className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center gap-3 cursor-pointer"
                          onClick={() => startConversation(pu.user_id)}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-sm sora-semibold shrink-0">
                            {getInitials(pu.full_name)}
                          </div>
                          <span className="font-body text-sm font-medium">{pu.full_name}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {contacts.filter(c => !c.isSystem).length > 0 && (
                    <>
                      <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider mt-4">
                        Recent conversations
                      </p>
                      {contacts.filter(c => !c.isSystem).map((c) => (
                        <button
                          key={c.user_id}
                          className="w-full text-left px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedContact(c.user_id)}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-sm sora-semibold shrink-0">
                            {getInitials(c.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-body text-sm font-medium truncate">{c.full_name}</span>
                              {c.unread > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-body shrink-0">
                                  {c.unread}
                                </span>
                              )}
                            </div>
                            <p className="font-body text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
