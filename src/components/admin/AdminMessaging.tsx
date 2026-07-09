import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Users, User, Megaphone, Loader2, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminMessagingProps {
  allUsers: Array<{
    user_id: string;
    full_name: string;
    email: string | null;
    roles: string[];
  }>;
}

const AdminMessaging = ({ allUsers }: AdminMessagingProps) => {
  const [mode, setMode] = useState<"direct" | "broadcast">("direct");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "mentors" | "mentees">("all");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentLog, setSentLog] = useState<Array<{ to: string; time: string }>>([]);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = allUsers.find((u) => u.user_id === selectedUserId);

  const getTargetUsers = () => {
    switch (broadcastTarget) {
      case "mentors":
        return allUsers.filter((u) => u.roles.includes("mentor"));
      case "mentees":
        return allUsers.filter((u) => u.roles.includes("mentee"));
      default:
        return allUsers.filter((u) => !u.roles.includes("admin"));
    }
  };

  const sendDirectMessage = async () => {
    if (!message.trim() || !selectedUserId) return;
    setSending(true);

    try {
      const { error } = await supabase.rpc("send_system_message", {
        p_receiver_id: selectedUserId,
        p_content: message.trim(),
      });

      if (error) throw error;

      toast.success(`Message sent to ${selectedUser?.full_name || "user"}`);
      setSentLog((prev) => [
        { to: selectedUser?.full_name || selectedUserId, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!message.trim()) return;
    const targets = getTargetUsers();
    if (targets.length === 0) {
      toast.error("No users match the selected audience.");
      return;
    }

    setSending(true);

    try {
      let sent = 0;
      let failed = 0;

      // Send in batches of 10 to avoid overloading
      for (let i = 0; i < targets.length; i += 10) {
        const batch = targets.slice(i, i + 10);
        const results = await Promise.allSettled(
          batch.map((u) =>
            supabase.rpc("send_system_message", {
              p_receiver_id: u.user_id,
              p_content: message.trim(),
            })
          )
        );
        results.forEach((r) => {
          if (r.status === "fulfilled" && !r.value.error) sent++;
          else failed++;
        });
      }

      const label =
        broadcastTarget === "all"
          ? "all users"
          : broadcastTarget === "mentors"
          ? "all mentors"
          : "all mentees";

      if (failed === 0) {
        toast.success(`Broadcast sent to ${sent} ${label}.`);
      } else {
        toast.warning(`Sent to ${sent} users, ${failed} failed.`);
      }

      setSentLog((prev) => [
        { to: `Broadcast to ${label} (${sent} users)`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Broadcast failed.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (mode === "direct") sendDirectMessage();
    else sendBroadcast();
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === "direct" ? "default" : "outline"}
          size="sm"
          className="font-body"
          onClick={() => setMode("direct")}
        >
          <User className="h-4 w-4 mr-1" /> Direct Message
        </Button>
        <Button
          variant={mode === "broadcast" ? "default" : "outline"}
          size="sm"
          className="font-body"
          onClick={() => setMode("broadcast")}
        >
          <Megaphone className="h-4 w-4 mr-1" /> Broadcast
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        {/* Left: compose */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-body text-base flex items-center gap-2">
              {mode === "direct" ? (
                <>
                  <User className="h-4 w-4" /> Send to User
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4" /> Broadcast Message
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "direct" ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="font-body pl-9"
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-40 overflow-y-auto border border-border rounded-md">
                    {filteredUsers.slice(0, 10).map((u) => (
                      <button
                        key={u.user_id}
                        className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between cursor-pointer ${
                          selectedUserId === u.user_id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(u.user_id);
                          setSearchQuery("");
                        }}
                      >
                        <div>
                          <p className="font-body text-sm font-medium">{u.full_name || "No name"}</p>
                          <p className="font-body text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="font-body text-[10px]">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="font-body text-xs text-muted-foreground text-center py-3">No users found.</p>
                    )}
                  </div>
                )}
                {selectedUser && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-xs font-semibold shrink-0">
                      {selectedUser.full_name
                        ?.split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium">{selectedUser.full_name}</p>
                      <p className="font-body text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {selectedUser.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="font-body text-[10px]">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="font-body text-sm font-medium">Audience</label>
                <Select value={broadcastTarget} onValueChange={(v) => setBroadcastTarget(v as any)}>
                  <SelectTrigger className="font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (excl. admins)</SelectItem>
                    <SelectItem value="mentors">All Mentors</SelectItem>
                    <SelectItem value="mentees">All Mentees</SelectItem>
                  </SelectContent>
                </Select>
                <p className="font-body text-xs text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  {getTargetUsers().length} users will receive this message
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-body text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your message... (sent as BSC Coordinator)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-body min-h-[120px] resize-none"
              />
              <p className="font-body text-xs text-muted-foreground">
                Messages are sent from the BSC Coordinator system account and appear in users' Messages tab.
              </p>
            </div>

            <Button
              className="w-full font-body"
              disabled={
                sending ||
                !message.trim() ||
                (mode === "direct" && !selectedUserId) ||
                (mode === "broadcast" && getTargetUsers().length === 0)
              }
              onClick={handleSend}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "direct" ? "Sending..." : "Broadcasting..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {mode === "direct" ? "Send Message" : `Broadcast to ${getTargetUsers().length} users`}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: sent log */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-body text-base flex items-center gap-2">
              <Check className="h-4 w-4" /> Sent This Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentLog.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-8">
                No messages sent yet this session.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sentLog.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <p className="font-body text-sm">{entry.to}</p>
                    <span className="font-body text-xs text-muted-foreground">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMessaging;
