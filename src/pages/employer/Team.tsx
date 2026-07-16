import { useEffect, useState } from "react";
import EmployerLayout from "@/components/employer/EmployerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMyEmployer } from "@/hooks/useEmployer";
import { Loader2, Plus, Users, Copy, X, Mail } from "lucide-react";

interface Invite {
  id: string;
  email: string;
  token: string;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  accepted_user_id: string | null;
}

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  full_name?: string | null;
  email?: string | null;
}

const inviteUrl = (token: string) =>
  `${window.location.origin}/auth?role=mentee&invite=${token}`;

const EmployerTeam = () => {
  const { employer } = useMyEmployer();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!employer) return;
    setLoading(true);
    const [invitesRes, membersRes] = await Promise.all([
      supabase
        .from("employer_team_invites")
        .select("id, email, token, invited_at, accepted_at, revoked_at, accepted_user_id")
        .eq("employer_id", employer.id)
        .order("invited_at", { ascending: false }),
      supabase
        .from("employer_team_members")
        .select("id, user_id, joined_at")
        .eq("employer_id", employer.id)
        .order("joined_at", { ascending: false }),
    ]);
    const memberRows = (membersRes.data ?? []) as Member[];
    if (memberRows.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", memberRows.map((m) => m.user_id));
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name]));
      memberRows.forEach((m) => (m.full_name = map.get(m.user_id) ?? null));
    }
    setInvites((invitesRes.data ?? []) as Invite[]);
    setMembers(memberRows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer?.id]);

  const seatLimit = employer?.seat_limit ?? 10;
  const activeInvites = invites.filter((i) => !i.accepted_at && !i.revoked_at);
  const seatsUsed = members.length + activeInvites.length;
  const seatsRemaining = Math.max(0, seatLimit - seatsUsed);

  const sendInvite = async () => {
    if (!employer) return;
    const clean = email.trim().toLowerCase();
    if (!clean || !/^\S+@\S+\.\S+$/.test(clean)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    if (seatsRemaining <= 0) {
      toast({ title: "No seats remaining", description: "Upgrade your plan to invite more team members.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("employer_team_invites")
      .insert({ employer_id: employer.id, email: clean })
      .select("id, token")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Could not send invite", description: error.message, variant: "destructive" });
      return;
    }
    const url = inviteUrl((data as any).token);
    await navigator.clipboard.writeText(url).catch(() => undefined);
    toast({
      title: "Invite created",
      description: "Share the invite link with them — it was copied to your clipboard.",
    });
    setEmail("");
    setOpen(false);
    void load();
  };

  const revoke = async (i: Invite) => {
    const { error } = await supabase
      .from("employer_team_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", i.id);
    if (error) {
      toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
      return;
    }
    void load();
  };

  const copyLink = async (i: Invite) => {
    await navigator.clipboard.writeText(inviteUrl(i.token));
    toast({ title: "Invite link copied" });
  };

  const removeMember = async (m: Member) => {
    if (!confirm("Remove this team member? They will lose access to your private courses.")) return;
    const { error } = await supabase.from("employer_team_members").delete().eq("id", m.id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    void load();
  };

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Team</h1>
            <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
              {seatsUsed} of {seatLimit} seats used · {seatsRemaining} remaining.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-body sora-semibold" disabled={seatsRemaining <= 0}>
                <Plus className="h-4 w-4 mr-2" /> Invite by email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Invite team member</DialogTitle>
                <DialogDescription className="font-body">
                  We'll generate a signup link they can use to join your team. The link is copied to your clipboard so you can send it to them.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label className="font-body">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={sendInvite} disabled={saving} className="font-body sora-semibold">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="p-5 border-b border-border">
                  <p className="font-display text-base font-semibold text-accent flex items-center gap-2">
                    <Users className="h-4 w-4" /> Members ({members.length})
                  </p>
                </div>
                {members.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground font-body">No team members yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {members.map((m) => (
                      <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-body sora-semibold text-sm">{m.full_name || "Team member"}</p>
                          <p className="font-body text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeMember(m)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="p-5 border-b border-border">
                  <p className="font-display text-base font-semibold text-accent flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Pending invites ({activeInvites.length})
                  </p>
                </div>
                {activeInvites.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground font-body">No pending invites.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {activeInvites.map((i) => (
                      <div key={i.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-body sora-semibold text-sm truncate">{i.email}</p>
                          <p className="font-body text-xs text-muted-foreground">
                            Invited {new Date(i.invited_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="font-body" onClick={() => copyLink(i)}>
                            <Copy className="h-4 w-4 mr-1" /> Copy link
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => revoke(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {invites.some((i) => i.accepted_at || i.revoked_at) && (
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="font-body text-xs text-muted-foreground mb-3 sora-semibold uppercase tracking-wide">Past invites</p>
                  <div className="space-y-2">
                    {invites.filter((i) => i.accepted_at || i.revoked_at).map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-sm font-body">
                        <span className="truncate">{i.email}</span>
                        <Badge variant="outline" className="font-body text-[11px]">
                          {i.accepted_at ? "Accepted" : "Revoked"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerTeam;