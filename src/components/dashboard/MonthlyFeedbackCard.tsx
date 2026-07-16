import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const labelFor = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const MonthlyFeedbackCard = () => {
  const { user, roles } = useAuth();
  const [pending, setPending] = useState<string[]>([]);

  const role: "mentor" | "mentee" | null = roles.includes("mentor")
    ? "mentor"
    : roles.includes("mentee")
      ? "mentee"
      : null;

  useEffect(() => {
    if (!user || !role) return;
    (async () => {
      const current = monthStart();
      const [qRes, rRes, pRes] = await Promise.all([
        supabase
          .from("feedback_questions" as any)
          .select("period_month, target_role, is_active")
          .eq("is_active", true),
        supabase
          .from("feedback_responses" as any)
          .select("period_month")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      const qs = ((qRes.data as any[]) || []).filter(
        (q) => q.target_role === "both" || q.target_role === role,
      );
      const submitted = new Set(
        ((rRes.data as any[]) || []).map((r) => r.period_month as string),
      );
      const periodSet = new Set<string>();
      let hasEvergreen = false;
      qs.forEach((q) => {
        if (!q.period_month) {
          hasEvergreen = true;
        } else if (q.period_month <= current) {
          periodSet.add(q.period_month);
        }
      });
      if (hasEvergreen) {
        // Backfill every month from signup (or up to 6 months back) through current.
        const signup = (pRes.data as any)?.created_at
          ? new Date((pRes.data as any).created_at)
          : new Date();
        const startYear = signup.getUTCFullYear();
        const startMonth = signup.getUTCMonth();
        const now = new Date();
        const endYear = now.getUTCFullYear();
        const endMonth = now.getUTCMonth();
        // Only show the immediately previous month (if user existed then) + current.
        const totalFromSignup =
          (endYear - startYear) * 12 + (endMonth - startMonth);
        const maxBack = Math.min(totalFromSignup, 1);
        for (let i = maxBack; i >= 0; i--) {
          const d = new Date(Date.UTC(endYear, endMonth - i, 1));
          periodSet.add(d.toISOString().slice(0, 10));
        }
      }
      const list = Array.from(periodSet)
        .filter((p) => !submitted.has(p))
        .sort();
      setPending(list);
    })();
  }, [user, role]);

  if (!user || !role || pending.length === 0) return null;

  const current = monthStart();

  return (
    <div className="space-y-3">
      {pending.map((period) => {
        const isCurrent = period === current;
        return (
          <Card
            key={period}
            className="shadow-card border-accent/20 bg-gradient-to-br from-card to-muted/30"
          >
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 h-10 w-10 rounded-md bg-accent/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-accent">
                    {labelFor(period)} feedback
                    {!isCurrent && (
                      <span className="ml-2 font-body text-xs font-normal text-muted-foreground">
                        (still open)
                      </span>
                    )}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {isCurrent
                      ? "Help us improve Ascendency — share your thoughts on this month."
                      : `You haven't submitted feedback for ${labelFor(period)} yet.`}
                  </p>
                </div>
              </div>
              <Button asChild className="font-body shrink-0">
                <Link to={`/dashboard/feedback?period=${period}`}>Give feedback</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MonthlyFeedbackCard;