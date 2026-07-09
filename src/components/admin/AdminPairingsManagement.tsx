/**
 * Purpose: Admin tab for managing active pairings — view table, create new, remove existing.
 * DB tables: pairings, profiles, mentor_details, user_roles, bookings, course_progress
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatNextSession, getMenteeCourseProgressPct, getPairSessionStats } from "@/lib/pairingsData";

interface ActivePairingRow {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  created_at: string;
  sessions_completed: number;
  next_session_label: string;
  has_next_session: boolean;
  course_progress: number;
}

interface UserOption {
  user_id: string;
  full_name: string;
}

interface AdminPairingsManagementProps {
  /** Re-uses the admin's already-loaded user list. */
  allUsers: Array<{ user_id: string; full_name: string; roles: string[] }>;
}

const AdminPairingsManagement = ({ allUsers }: AdminPairingsManagementProps) => {
  const [activePairings, setActivePairings] = useState<ActivePairingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [selectedMentee, setSelectedMentee] = useState<string>("");

  const mentors: UserOption[] = useMemo(
    () =>
      allUsers
        .filter((u) => u.roles.includes("mentor"))
        .map((u) => ({ user_id: u.user_id, full_name: u.full_name || "Unknown" }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [allUsers],
  );

  const mentees: UserOption[] = useMemo(
    () =>
      allUsers
        .filter((u) => u.roles.includes("mentee"))
        .map((u) => ({ user_id: u.user_id, full_name: u.full_name || "Unknown" }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [allUsers],
  );

  const fetchActive = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("pairings")
      .select("id, mentor_id, mentee_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!rows?.length) {
      setActivePairings([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(rows.flatMap((r) => [r.mentor_id, r.mentee_id])));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const [stats, progress] = await Promise.all([
          getPairSessionStats(r.mentor_id, r.mentee_id),
          getMenteeCourseProgressPct(r.mentee_id),
        ]);
        return {
          id: r.id,
          mentor_id: r.mentor_id,
          mentee_id: r.mentee_id,
          mentor_name: profileMap.get(r.mentor_id) || "Unknown",
          mentee_name: profileMap.get(r.mentee_id) || "Unknown",
          created_at: r.created_at,
          sessions_completed: stats.sessionsCompleted,
          next_session_label: formatNextSession(stats.nextSession),
          has_next_session: !!stats.nextSession,
          course_progress: progress,
        } satisfies ActivePairingRow;
      }),
    );

    setActivePairings(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPairing = async () => {
    if (!selectedMentor || !selectedMentee) {
      toast.error("Pick a mentor and a mentee.");
      return;
    }
    setCreating(true);

    // A previous pairing for this (mentor, mentee) may still exist with status
 // 'cancelled' — the unique constraint on (mentor_id, mentee_id) blocks a
    // fresh insert, so reactivate it instead.
    const { data: existing } = await supabase
      .from("pairings")
      .select("id, status")
      .eq("mentor_id", selectedMentor)
      .eq("mentee_id", selectedMentee)
      .maybeSingle();

    let error = null as { code?: string } | null;
    if (existing) {
      if (existing.status === "active") {
        setCreating(false);
        toast.info("This pairing already exists and is active.");
        return;
      }
      const res = await supabase
        .from("pairings")
        .update({
          status: "active",
          matched_by: "admin",
          admin_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase.from("pairings").insert({
        mentor_id: selectedMentor,
        mentee_id: selectedMentee,
        status: "active",
        matched_by: "admin",
        admin_approved: true,
      });
      error = res.error;
    }

    setCreating(false);
    if (error) {
      toast.error("Failed to create pairing.");
      return;
    }
    toast.success("Pairing created and activated.");
    setCreateOpen(false);
    setSelectedMentor("");
    setSelectedMentee("");
    fetchActive();
  };

  const removePairing = async (id: string) => {
    if (!confirm("Remove this pairing? This will mark it cancelled.")) return;
    setRemovingId(id);
    const { error } = await supabase.from("pairings").update({ status: "cancelled" }).eq("id", id);
    setRemovingId(null);
    if (error) {
      toast.error("Failed to remove pairing.");
      return;
    }
    toast.success("Pairing removed.");
    setActivePairings((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Active Pairings ({activePairings.length})
          </CardTitle>
          <Button size="sm" className="font-body" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Pairing
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activePairings.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">
              No active pairings yet. Create one to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Mentor</TableHead>
                    <TableHead className="font-body">Mentee</TableHead>
                    <TableHead className="font-body text-center">Sessions</TableHead>
                    <TableHead className="font-body">Next session</TableHead>
                    <TableHead className="font-body text-center">Progress</TableHead>
                    <TableHead className="font-body">Started</TableHead>
                    <TableHead className="font-body text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePairings.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-body font-medium">{p.mentor_name}</TableCell>
                      <TableCell className="font-body">{p.mentee_name}</TableCell>
                      <TableCell className="font-body text-center">{p.sessions_completed}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {p.has_next_session ? p.next_session_label : "—"}
                      </TableCell>
                      <TableCell className="font-body text-center">
                        <Badge variant="secondary" className="font-body">
                          {p.course_progress}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {format(new Date(p.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removePairing(p.id)}
                          disabled={removingId === p.id}
                        >
                          {removingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create a pairing</DialogTitle>
            <DialogDescription className="font-body">
              Pair any mentor with any mentee. The pairing is activated immediately and skips the request flow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="font-body text-sm sora-semibold">Mentor</label>
              <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mentors.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id} className="font-body">
                      {m.full_name}
                    </SelectItem>
                  ))}
                  {mentors.length === 0 && (
                    <div className="px-2 py-1.5 font-body text-sm text-muted-foreground">No mentors found.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-sm sora-semibold">Mentee</label>
              <Select value={selectedMentee} onValueChange={setSelectedMentee}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select a mentee" />
                </SelectTrigger>
                <SelectContent>
                  {mentees.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id} className="font-body">
                      {m.full_name}
                    </SelectItem>
                  ))}
                  {mentees.length === 0 && (
                    <div className="px-2 py-1.5 font-body text-sm text-muted-foreground">No mentees found.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="font-body" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="font-body" onClick={createPairing} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create pairing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPairingsManagement;