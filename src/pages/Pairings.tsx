/**
 * Purpose: Pairings page — mentor sees mentees with stats, mentee sees their assigned mentor.
 * DB tables: pairings, profiles, bookings, course_progress
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MentorPairingCard, { type MentorPairingViewModel } from "@/components/pairings/MentorPairingCard";
import MenteePairingCard, { type MenteePairingViewModel } from "@/components/pairings/MenteePairingCard";
import { formatNextSession, getMenteeCourseProgressPct, getPairSessionStats } from "@/lib/pairingsData";

const Pairings = () => {
  const { user, roles, loading } = useAuth();
  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");

  const [mentorPairings, setMentorPairings] = useState<MentorPairingViewModel[]>([]);
  const [menteePairing, setMenteePairing] = useState<MenteePairingViewModel | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setDataReady(false);

      if (isMentor) {
        const { data: rows } = await supabase
          .from("pairings")
          .select("id, mentor_id, mentee_id, status")
          .eq("mentor_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (!rows?.length) {
          if (!cancelled) {
            setMentorPairings([]);
            setDataReady(true);
          }
          return;
        }

        const menteeIds = rows.map((r) => r.mentee_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", menteeIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        const enriched = await Promise.all(
          rows.map(async (r) => {
            const [stats, progress] = await Promise.all([
              getPairSessionStats(r.mentor_id, r.mentee_id),
              getMenteeCourseProgressPct(r.mentee_id),
            ]);
            const profile = profileMap.get(r.mentee_id);
            return {
              id: r.id,
              menteeId: r.mentee_id,
              menteeName: profile?.full_name || "Unknown mentee",
              menteeAvatar: profile?.avatar_url ?? null,
              status: r.status,
              sessionsCompleted: stats.sessionsCompleted,
              nextSessionLabel: formatNextSession(stats.nextSession),
              hasNextSession: !!stats.nextSession,
              courseProgressPct: progress,
            } satisfies MentorPairingViewModel;
          }),
        );
        if (!cancelled) {
          setMentorPairings(enriched);
          setDataReady(true);
        }
        return;
      }

      if (isMentee) {
        const { data: active } = await supabase
          .from("pairings")
          .select("id, mentor_id, mentee_id, status")
          .eq("mentee_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (active) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, bio")
            .eq("user_id", active.mentor_id)
            .maybeSingle();
          const stats = await getPairSessionStats(active.mentor_id, active.mentee_id);
          if (!cancelled) {
            setMenteePairing({
              id: active.id,
              mentorId: active.mentor_id,
              mentorName: profile?.full_name || "Your mentor",
              mentorBio: profile?.bio ?? null,
              mentorAvatar: profile?.avatar_url ?? null,
              status: active.status,
              sessionsCompleted: stats.sessionsCompleted,
              nextSessionLabel: formatNextSession(stats.nextSession),
              hasNextSession: !!stats.nextSession,
            });
            setHasPendingRequest(false);
            setDataReady(true);
          }
          return;
        }

        // No active pairing — check for pending request.
        const { data: pending } = await supabase
          .from("pairings")
          .select("id")
          .eq("mentee_id", user.id)
          .eq("status", "pending")
          .limit(1);
        if (!cancelled) {
          setMenteePairing(null);
          setHasPendingRequest((pending?.length || 0) > 0);
          setDataReady(true);
        }
        return;
      }

      if (!cancelled) setDataReady(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isMentor, isMentee]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">My Pairings</h1>
          {isMentor && mentorPairings.length > 0 && (
            <p className="font-body text-sm text-muted-foreground">
              {mentorPairings.length} active mentee{mentorPairings.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {!dataReady ? (
          <p className="font-body text-sm text-muted-foreground">Loading pairings...</p>
        ) : isMentor ? (
          mentorPairings.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-body text-muted-foreground">You have no active mentees yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentorPairings.map((p) => (
                <MentorPairingCard key={p.id} pairing={p} />
              ))}
            </div>
          )
        ) : isMentee ? (
          menteePairing ? (
            <div className="max-w-2xl">
              <MenteePairingCard pairing={menteePairing} />
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center space-y-2">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="font-body text-muted-foreground">
                  {hasPendingRequest
                    ? "You haven't been paired with a mentor yet. A pairing request has been submitted for admin review."
                    : "You have no active mentor pairing."}
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <p className="font-body text-muted-foreground">Pairings are available to mentors and mentees.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pairings;