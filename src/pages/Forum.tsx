/**
 * Forum – community channels for mentors and mentees.
 * General channel is open to all; other channels require admin approval.
 * DB tables: forum_channels, forum_channel_members, forum_posts
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartAvatarImage } from "@/components/SmartAvatarImage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Hash, Lock, Send, Clock, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_general: boolean;
};

type Membership = {
  channel_id: string;
  status: "pending" | "approved" | "rejected";
};

type Post = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type AuthorMap = Record<string, { full_name: string | null; avatar_url: string | null }>;

const Forum = () => {
  const { user, roles, loading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<AuthorMap>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");
  const isAdmin = roles.includes("admin");
  const canParticipate = isMentor || isMentee || isAdmin;

  // Load channels + memberships
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: chans }, { data: mems }] = await Promise.all([
        supabase.from("forum_channels").select("*").order("is_general", { ascending: false }).order("name"),
        supabase.from("forum_channel_members").select("channel_id, status").eq("user_id", user.id),
      ]);
      setChannels((chans as Channel[]) || []);
      setMemberships((mems as Membership[]) || []);
      if (chans && chans.length && !activeId) {
        const general = chans.find((c: any) => c.is_general) || chans[0];
        setActiveId(general.id);
      }
    })();
  }, [user]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeId) || null,
    [channels, activeId],
  );

  const membershipFor = (channelId: string) =>
    memberships.find((m) => m.channel_id === channelId)?.status;

  const hasAccess = (c: Channel | null) => {
    if (!c) return false;
    if (c.is_general) return canParticipate;
    if (isAdmin) return true;
    return membershipFor(c.id) === "approved";
  };

  // Load posts + authors when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    if (!hasAccess(activeChannel)) {
      setPosts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setPostsLoading(true);
      const { data, error } = await supabase
        .from("forum_posts")
        .select("id, channel_id, user_id, content, created_at")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        setPosts([]);
      } else {
        const list = (data as Post[]) || [];
        setPosts(list);
        await hydrateAuthors(list.map((p) => p.user_id));
      }
      setPostsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel?.id, memberships]);

  // Lightweight polling for new posts. We removed forum_posts from the Realtime
  // publication to prevent leaking channel events to non-members, so we refetch
  // any rows newer than the latest post we have every few seconds.
  useEffect(() => {
    if (!activeChannel || !hasAccess(activeChannel)) return;
    const channelId = activeChannel.id;
    const tick = async () => {
      const latest = posts.length ? posts[posts.length - 1].created_at : null;
      let q = supabase
        .from("forum_posts")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (latest) q = q.gt("created_at", latest);
      const { data } = await q;
      if (!data?.length) return;
      const fresh = data as Post[];
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const np of fresh) if (!seen.has(np.id)) merged.push(np);
        return merged;
      });
      await hydrateAuthors(fresh.map((p) => p.user_id));
    };
    const interval = window.setInterval(tick, 5000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel?.id, memberships, posts]);

  // Auto-scroll on new posts
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [posts.length, activeChannel?.id]);

  const hydrateAuthors = async (userIds: string[]) => {
    const missing = Array.from(new Set(userIds)).filter((id) => !authors[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", missing);
    if (data) {
      setAuthors((prev) => {
        const next = { ...prev };
        for (const p of data as any[]) {
          next[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        }
        return next;
      });
    }
  };

  const requestAccess = async (channelId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("forum_channel_members")
      .insert({ channel_id: channelId, user_id: user.id, status: "pending" });
    if (error) {
      if (error.code === "23505") {
        toast.info("You've already requested access.");
      } else {
        toast.error("Could not send request.");
      }
      return;
    }
    toast.success("Request sent — an admin will review it.");
    setMemberships((prev) => [...prev, { channel_id: channelId, status: "pending" }]);
  };

  const sendPost = async () => {
    if (!user || !activeChannel) return;
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    const { error } = await supabase
      .from("forum_posts")
      .insert({ channel_id: activeChannel.id, user_id: user.id, content });
    setSending(false);
    if (error) {
      toast.error("Failed to post. Make sure you have access to this channel.");
      return;
    }
    setDraft("");
    // Realtime will append; ensure author present
    await hydrateAuthors([user.id]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <MessagesSquare className="h-6 w-6 text-primary" />
            Community Forum
          </h1>
          <p className="font-body text-sm text-muted-foreground sora-regular">
            Channels where mentors and mentees connect. Some channels require admin approval.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Channel list */}
          <Card className="shadow-card h-fit">
            <CardContent className="p-3">
              <p className="font-body text-xs uppercase tracking-wide text-muted-foreground px-2 pt-1 pb-2 sora-semibold">
                Channels
              </p>
              <div className="space-y-1">
                {channels.map((c) => {
                  const status = membershipFor(c.id);
                  const access = hasAccess(c);
                  const active = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-md font-body text-sm transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      {c.is_general || access ? (
                        <Hash className="h-4 w-4 shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate flex-1">{c.name}</span>
                      {status === "pending" && !active && (
                        <Badge variant="secondary" className="font-body text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </button>
                  );
                })}
                {channels.length === 0 && (
                  <p className="font-body text-xs text-muted-foreground px-2 py-3">
                    No channels yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active channel */}
          <Card className="shadow-card flex flex-col min-h-[60vh]">
            {!activeChannel ? (
              <CardContent className="p-6 text-center text-muted-foreground font-body text-sm">
                Select a channel to start.
              </CardContent>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    {hasAccess(activeChannel) ? (
                      <Hash className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h2 className="font-display text-lg font-semibold text-accent">
                      {activeChannel.name}
                    </h2>
                    {activeChannel.is_general && (
                      <Badge variant="secondary" className="font-body text-[10px]">
                        Open to all
                      </Badge>
                    )}
                  </div>
                  {activeChannel.description && (
                    <p className="font-body text-xs text-muted-foreground mt-1 sora-regular">
                      {activeChannel.description}
                    </p>
                  )}
                </div>

                {/* Locked state */}
                {!hasAccess(activeChannel) ? (
                  <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                    <div className="w-12 h-12 rounded-full bg-crimson-light flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-accent">
                      This channel is invite-only
                    </h3>
                    <p className="font-body text-sm text-muted-foreground max-w-md sora-regular">
                      You need to be approved by an admin to view and post here.
                    </p>
                    {membershipFor(activeChannel.id) === "pending" ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted font-body text-sm text-foreground/70">
                        <Clock className="h-4 w-4" />
                        Request pending review
                      </div>
                    ) : membershipFor(activeChannel.id) === "rejected" ? (
                      <p className="font-body text-sm text-destructive">
                        Your previous request wasn't approved.
                      </p>
                    ) : canParticipate ? (
                      <Button onClick={() => requestAccess(activeChannel.id)} className="font-body sora-semibold">
                        Request access
                      </Button>
                    ) : (
                      <p className="font-body text-sm text-muted-foreground">
                        Only mentors and mentees can join channels.
                      </p>
                    )}
                  </CardContent>
                ) : (
                  <>
                    {/* Feed */}
                    <div ref={feedRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                      {postsLoading ? (
                        <p className="font-body text-sm text-muted-foreground text-center">Loading…</p>
                      ) : posts.length === 0 ? (
                        <p className="font-body text-sm text-muted-foreground text-center py-8">
                          No messages yet. Be the first to say something.
                        </p>
                      ) : (
                        posts.map((p) => {
                          const a = authors[p.user_id];
                          const name = a?.full_name || "Member";
                          return (
                            <div key={p.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <SmartAvatarImage avatarUrl={a?.avatar_url} />
                                <AvatarFallback className="font-body text-xs">
                                  {name[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-body text-sm sora-semibold text-foreground">
                                    {name}
                                  </span>
                                  <span className="font-body text-[11px] text-muted-foreground">
                                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="font-body text-sm text-foreground/90 whitespace-pre-wrap break-words sora-regular">
                                  {p.content}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Composer */}
                    {canParticipate ? (
                      <div className="border-t border-border p-3 flex gap-2 items-end">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendPost();
                            }
                          }}
                          placeholder={`Message #${activeChannel.name}`}
                          rows={2}
                          maxLength={2000}
                          className="font-body resize-none"
                        />
                        <Button
                          onClick={sendPost}
                          disabled={sending || !draft.trim()}
                          size="icon"
                          className="shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-t border-border p-4 text-center">
                        <p className="font-body text-sm text-muted-foreground">
                          Only mentors and mentees can post.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Forum;