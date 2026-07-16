/**
 * AdminForum – admin tab to create channels and approve membership requests.
 * DB tables: forum_channels, forum_channel_members, profiles
 */
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Hash, Lock, Plus, Check, X, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_general: boolean;
};

type PendingRow = {
  id: string;
  channel_id: string;
  user_id: string;
  status: string;
  requested_at: string;
  channel_name?: string;
  user_name?: string;
  user_email?: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminForum = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: chans }, { data: members }] = await Promise.all([
      supabase.from("forum_channels").select("*").order("is_general", { ascending: false }).order("name"),
      supabase.from("forum_channel_members").select("*").eq("status", "pending").order("requested_at"),
    ]);
    const channelList = (chans as Channel[]) || [];
    setChannels(channelList);

    const memberList = (members as any[]) || [];
    const userIds = Array.from(new Set(memberList.map((m) => m.user_id)));
    let profileMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      profileMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      // Emails are not exposed via direct profile reads; fetch via admin RPC.
      const { data: contacts } = await supabase.rpc("admin_get_profile_contacts", {
        _user_ids: userIds,
      });
      for (const c of (contacts as any[]) || []) {
        const existing = profileMap.get(c.user_id) || { user_id: c.user_id };
        profileMap.set(c.user_id, { ...existing, email: c.email });
      }
    }
    const channelMap = new Map(channelList.map((c) => [c.id, c]));
    setPending(
      memberList.map((m) => ({
        ...m,
        channel_name: channelMap.get(m.channel_id)?.name || "—",
        user_name: profileMap.get(m.user_id)?.full_name || "Unknown",
        user_email: profileMap.get(m.user_id)?.email || "",
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const createChannel = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    if (!slug) {
      toast.error("Choose a valid name.");
      return;
    }
    setCreating(true);
    const { error } = await supabase
      .from("forum_channels")
      .insert({ name: trimmed, slug, description: description.trim() || null });
    setCreating(false);
    if (error) {
      if (error.code === "23505") toast.error("A channel with that name already exists.");
      else toast.error("Failed to create channel.");
      return;
    }
    toast.success("Channel created.");
    setName("");
    setDescription("");
    load();
  };

  const deleteChannel = async (c: Channel) => {
    if (c.is_general) {
      toast.error("The General channel cannot be deleted.");
      return;
    }
    if (!confirm(`Delete #${c.name} and all its posts?`)) return;
    const { error } = await supabase.from("forum_channels").delete().eq("id", c.id);
    if (error) {
      toast.error("Failed to delete channel.");
      return;
    }
    toast.success("Channel deleted.");
    load();
  };

  const openEdit = (c: Channel) => {
    setEditing(c);
    setEditName(c.name);
    setEditDescription(c.description || "");
    setEditSlug(c.slug);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmedName = editName.trim();
    const trimmedSlug = slugify(editSlug || trimmedName);
    if (!trimmedName || !trimmedSlug) {
      toast.error("Name and slug are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("forum_channels")
      .update({
        name: trimmedName,
        slug: trimmedSlug,
        description: editDescription.trim() || null,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("A channel with that name/slug already exists.");
      else toast.error("Failed to update channel.");
      return;
    }
    toast.success("Channel updated.");
    setEditing(null);
    load();
  };

  const decide = async (row: PendingRow, approve: boolean) => {
    const { error } = await supabase
      .from("forum_channel_members")
      .update({
        status: approve ? "approved" : "rejected",
        approved_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    if (error) {
      toast.error("Failed to update request.");
      return;
    }
    toast.success(approve ? "Member approved." : "Request rejected.");
    setPending((prev) => prev.filter((p) => p.id !== row.id));
  };

  return (
    <div className="space-y-6">
      {/* Create channel */}
      <Card className="shadow-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-accent flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create channel
          </h3>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name (e.g. Tech Founders)"
            className="font-body"
            maxLength={60}
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            maxLength={280}
            className="font-body"
          />
          <Button onClick={createChannel} disabled={creating || !name.trim()} className="font-body sora-semibold">
            Create channel
          </Button>
        </CardContent>
      </Card>

      {/* Channels list */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <h3 className="font-display text-base font-semibold text-accent mb-3">Channels</h3>
          <div className="space-y-2">
            {channels.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md border border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.is_general ? <Hash className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold truncate">{c.name}</p>
                    {c.description && (
                      <p className="font-body text-xs text-muted-foreground truncate">{c.description}</p>
                    )}
                  </div>
                  {c.is_general && (
                    <Badge variant="secondary" className="font-body text-[10px]">Open</Badge>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="font-body">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!c.is_general && (
                    <Button size="sm" variant="outline" onClick={() => deleteChannel(c)} className="font-body">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {channels.length === 0 && (
              <p className="font-body text-sm text-muted-foreground">No channels yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending requests */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <h3 className="font-display text-base font-semibold text-accent mb-3">
            Pending access requests ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-md border border-border">
                <div className="min-w-0">
                  <p className="font-body text-sm">
                    <span className="font-semibold">{r.user_name}</span>
                    <span className="text-muted-foreground"> wants to join </span>
                    <span className="font-semibold">#{r.channel_name}</span>
                  </p>
                  <p className="font-body text-xs text-muted-foreground">{r.user_email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => decide(r, true)} className="font-body">
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(r, false)} className="font-body">
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="font-body text-sm text-muted-foreground">No pending requests.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit channel dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-body text-xs text-muted-foreground">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                className="font-body"
              />
            </div>
            <div className="space-y-1">
              <label className="font-body text-xs text-muted-foreground">Slug</label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(slugify(e.target.value))}
                maxLength={60}
                className="font-body"
                disabled={!!editing?.is_general}
              />
              {editing?.is_general && (
                <p className="font-body text-[11px] text-muted-foreground">
                  Slug locked for the General channel.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="font-body text-xs text-muted-foreground">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                maxLength={280}
                className="font-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="font-body">
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving || !editName.trim()} className="font-body sora-semibold">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminForum;