/**
 * Purpose: Admin drill-down view for a single pairing — sessions, goals, and feedback.
 * DB tables: bookings, session_logs, goals, feedback_responses, feedback_questions
 */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Target, MessageSquare, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pairingId: string | null;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
}

interface BookingRow {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface SessionLogRow {
  id: string;
  session_date: string;
  duration_minutes: number | null;
  notes: string | null;
  logged_by: string;
}

interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  target_date: string | null;
  completed_at: string | null;
}

interface FeedbackEntry {
  period_month: string;
  role: string;
  user_id: string;
  user_name: string;
  answers: Array<{ question: string; answer: string }>;
}

const AdminPairingDetailsDialog = ({
  open,
  onOpenChange,
  pairingId,
  mentorId,
  menteeId,
  mentorName,
  menteeName,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLogRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    if (!open || !pairingId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [bRes, lRes, gRes, qRes, fRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, booking_date, start_time, end_time, status, notes")
          .eq("mentor_id", mentorId)
          .eq("booker_id", menteeId)
          .order("booking_date", { ascending: false }),
        supabase
          .from("session_logs")
          .select("id, session_date, duration_minutes, notes, logged_by")
          .eq("pairing_id", pairingId)
          .order("session_date", { ascending: false }),
        supabase
          .from("goals")
          .select("id, title, description, completed, target_date, completed_at")
          .eq("pairing_id", pairingId)
          .order("created_at", { ascending: false }),
        supabase
          .from("feedback_questions")
          .select("id, question, scope"),
        supabase
          .from("feedback_responses")
          .select("period_month, role, user_id, answers")
          .in("user_id", [mentorId, menteeId])
          .order("period_month", { ascending: false }),
      ]);

      if (cancelled) return;

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", [mentorId, menteeId]);
      const nameMap = new Map(profs?.map((p) => [p.user_id, p.full_name]) || []);

      const qMap = new Map((qRes.data || []).map((q: any) => [q.id, q]));

      const fb: FeedbackEntry[] = (fRes.data || []).map((r: any) => {
        const answers: Array<{ question: string; answer: string }> = [];
        const raw = r.answers || {};
        for (const [qid, val] of Object.entries(raw)) {
          const q = qMap.get(qid);
          if (!q) continue;
          // Per-pairing answers are nested by pairing id
          let display = "";
          if (val && typeof val === "object" && !Array.isArray(val)) {
            const scoped = (val as any)[pairingId];
            if (scoped === undefined) continue;
            display = Array.isArray(scoped) ? scoped.join(", ") : String(scoped);
          } else {
            display = Array.isArray(val) ? val.join(", ") : String(val);
          }
          if (!display) continue;
          answers.push({ question: (q as any).question, answer: display });
        }
        return {
          period_month: r.period_month,
          role: r.role,
          user_id: r.user_id,
          user_name: nameMap.get(r.user_id) || "Unknown",
          answers,
        };
      }).filter((e) => e.answers.length > 0);

      setBookings((bRes.data as BookingRow[]) || []);
      setSessionLogs((lRes.data as SessionLogRow[]) || []);
      setGoals((gRes.data as GoalRow[]) || []);
      setFeedback(fb);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, pairingId, mentorId, menteeId]);

  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = bookings.filter((b) => b.booking_date >= today && b.status === "confirmed");
  const past = bookings.filter((b) => b.booking_date < today);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mentorName} <span className="text-muted-foreground">&times;</span> {menteeName}
          </DialogTitle>
          <DialogDescription className="font-body">
            Full pairing activity — sessions, goals, and feedback.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="sessions" className="mt-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="sessions" className="font-body">
                <Calendar className="h-4 w-4 mr-1" /> Sessions
              </TabsTrigger>
              <TabsTrigger value="goals" className="font-body">
                <Target className="h-4 w-4 mr-1" /> Goals
              </TabsTrigger>
              <TabsTrigger value="feedback" className="font-body">
                <MessageSquare className="h-4 w-4 mr-1" /> Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4 pt-4">
              <section>
                <h4 className="font-body sora-semibold text-sm mb-2">
                  Upcoming ({upcoming.length})
                </h4>
                {upcoming.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">No upcoming sessions.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map((b) => (
                      <li key={b.id} className="rounded-md border p-3 font-body text-sm">
                        <div className="sora-semibold">
                          {format(parseISO(b.booking_date), "EEE, MMM d, yyyy")}
                        </div>
                        <div className="text-muted-foreground">
                          {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                        </div>
                        {b.notes && <p className="mt-1 text-muted-foreground">{b.notes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4 className="font-body sora-semibold text-sm mb-2">
                  Past sessions ({past.length})
                </h4>
                {past.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">No past sessions yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {past.map((b) => (
                      <li key={b.id} className="rounded-md border p-3 font-body text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="sora-semibold">
                              {format(parseISO(b.booking_date), "EEE, MMM d, yyyy")}
                            </div>
                            <div className="text-muted-foreground">
                              {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                            </div>
                          </div>
                          <Badge variant="outline" className="font-body">
                            {b.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4 className="font-body sora-semibold text-sm mb-2">
                  Logged notes ({sessionLogs.length})
                </h4>
                {sessionLogs.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">
                    No session logs recorded.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {sessionLogs.map((l) => (
                      <li key={l.id} className="rounded-md border p-3 font-body text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="sora-semibold">
                            {format(parseISO(l.session_date), "MMM d, yyyy")}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            by {l.logged_by === mentorId ? mentorName : menteeName}
                            {l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}
                          </span>
                        </div>
                        {l.notes && (
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {l.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </TabsContent>

            <TabsContent value="goals" className="space-y-2 pt-4">
              {goals.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">No goals set yet.</p>
              ) : (
                <ul className="space-y-2">
                  {goals.map((g) => (
                    <li key={g.id} className="rounded-md border p-3 font-body text-sm">
                      <div className="flex items-start gap-2">
                        {g.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="sora-semibold">{g.title}</div>
                          {g.description && (
                            <p className="text-muted-foreground mt-0.5">{g.description}</p>
                          )}
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {g.target_date && (
                              <span>
                                Target: {format(parseISO(g.target_date), "MMM d, yyyy")}
                              </span>
                            )}
                            {g.completed_at && (
                              <span>
                                Done: {format(parseISO(g.completed_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="space-y-3 pt-4">
              {feedback.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">
                  No feedback submitted for this pairing yet.
                </p>
              ) : (
                feedback.map((f, idx) => (
                  <div key={idx} className="rounded-md border p-3 font-body text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="sora-semibold">
                        {f.user_name}{" "}
                        <Badge variant="secondary" className="ml-1 font-body text-xs">
                          {f.role}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {format(parseISO(f.period_month), "MMM yyyy")}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {f.answers.map((a, i) => (
                        <li key={i}>
                          <div className="text-muted-foreground text-xs">{a.question}</div>
                          <div>{a.answer}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPairingDetailsDialog;