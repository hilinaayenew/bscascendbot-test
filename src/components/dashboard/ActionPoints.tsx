/**
 * Purpose: Prioritized "Action Points" list at top of /dashboard surfacing overdue/missed items.
 * Each item is dismissible per-user via localStorage (24h TTL).
 * Pure-frontend reads from existing tables; no schema changes.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActivation } from "@/hooks/useActivation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X, BookOpen, CreditCard, ClipboardList, UserCircle2, CalendarCheck } from "lucide-react";
import { COURSES } from "@/lib/courseData";
import { differenceInDays, format, startOfMonth } from "date-fns";

type Severity = "high" | "medium" | "low";
type Action = {
  key: string;
  severity: Severity;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail?: string;
  ctaLabel: string;
  ctaHref: string;
};

const DISMISS_KEY = "ap_dismissed_v1";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVATION_VALID_DAYS = 183; // ~6 months

function getDismissed(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const cleaned: Record<string, number> = {};
    for (const [k, t] of Object.entries(parsed)) {
      if (now - t < DISMISS_TTL_MS) cleaned[k] = t;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveDismissed(d: Record<string, number>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}

function profileCompletenessPct(p: any): number {
  if (!p) return 0;
  const checks = [
    !!p.full_name,
    !!p.bio && p.bio.length > 20,
    !!p.country,
    !!p.avatar_url,
    !!p.linkedin_url || !!p.portfolio_url,
    Array.isArray(p.expertise) && p.expertise.length > 0,
    Array.isArray(p.interests) && p.interests.length > 0,
    !!p.username,
  ];
  const pass = checks.filter(Boolean).length;
  return Math.round((pass / checks.length) * 100);
}

const ActionPoints = () => {
  const { user, profile, roles } = useAuth();
  const { isActivated, activatedAt } = useActivation();
  const [actions, setActions] = useState<Action[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, number>>(getDismissed);

  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const compute = async () => {
      const items: Action[] = [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Course started but no progress in 7 days
      const { data: progress } = await supabase
        .from("course_progress")
        .select("course_id, completed_modules, updated_at")
        .eq("user_id", user.id)
        .lt("updated_at", sevenDaysAgo);
      for (const row of progress || []) {
        const meta = COURSES.find((c) => c.id === (row as any).course_id);
        if (!meta) continue;
        const done = ((row as any).completed_modules || []).length;
        if (done === 0 || done >= meta.modules.length) continue;
        items.push({
          key: `course:${(row as any).course_id}`,
          severity: "medium",
          icon: BookOpen,
          title: `Resume ${meta.title}`,
          detail: `You've completed ${done} of ${meta.modules.length} modules. Last activity ${format(new Date((row as any).updated_at), "MMM d")}.`,
          ctaLabel: "Resume course",
          ctaHref: `/dashboard/courses`,
        });
      }

      // 2. Activation expiring in ≤14 days (mentees)
      if (isMentee && isActivated && activatedAt) {
        const expiry = new Date(new Date(activatedAt).getTime() + ACTIVATION_VALID_DAYS * 24 * 60 * 60 * 1000);
        const daysLeft = differenceInDays(expiry, new Date());
        if (daysLeft <= 14 && daysLeft >= 0) {
          items.push({
            key: `activation:${activatedAt}`,
            severity: daysLeft <= 3 ? "high" : "medium",
            icon: CreditCard,
            title: "Your access is about to expire",
            detail: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${format(expiry, "MMM d, yyyy")}).`,
            ctaLabel: "Renew access",
            ctaHref: "/dashboard/subscribe",
          });
        }
      }

      // 3. Monthly feedback not submitted
      if (isMentor || isMentee) {
        const month = format(startOfMonth(new Date()), "yyyy-MM-dd");
        const { data: fb } = await supabase
          .from("feedback_responses")
          .select("id")
          .eq("user_id", user.id)
          .eq("period_month", month)
          .maybeSingle();
        if (!fb) {
          items.push({
            key: `feedback:${month}`,
            severity: "low",
            icon: ClipboardList,
            title: "Share this month's feedback",
            detail: "Your monthly check-in helps us improve your mentorship experience.",
            ctaLabel: "Open feedback",
            ctaHref: "/dashboard/feedback",
          });
        }
      }

      // 4. Profile completeness <60%
      const pct = profileCompletenessPct(profile);
      if (pct > 0 && pct < 60) {
        items.push({
          key: `profile:lt60`,
          severity: "medium",
          icon: UserCircle2,
          title: "Finish your profile",
          detail: `Your profile is ${pct}% complete. A stronger profile boosts AI matching.`,
          ctaLabel: "Complete profile",
          ctaHref: "/dashboard/settings",
        });
      }

      // 5. Past confirmed session not logged
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const pairingCol = isMentor ? "mentor_id" : "mentee_id";
      const otherCol = isMentor ? "booker_id" : "mentor_id";
      const { data: pastBookings } = await supabase
        .from("bookings")
        .select("id, booking_date, mentor_id, booker_id, title")
        .eq("status", "confirmed")
        .lt("booking_date", todayStr)
        .order("booking_date", { ascending: false })
        .limit(10);
      if (pastBookings && pastBookings.length) {
        // Find pairing(s) for this user
        const { data: pairings } = await supabase
          .from("pairings")
          .select("id, mentor_id, mentee_id")
          .eq(pairingCol, user.id);
        const pairingIds = (pairings || []).map((p: any) => p.id);
        let logsByDate: Record<string, true> = {};
        if (pairingIds.length) {
          const { data: logs } = await supabase
            .from("session_logs")
            .select("session_date, pairing_id")
            .in("pairing_id", pairingIds);
          for (const l of logs || []) logsByDate[(l as any).session_date] = true;
        }
        for (const b of pastBookings as any[]) {
          // booking must involve this user
          if (b.mentor_id !== user.id && b.booker_id !== user.id) continue;
          if (logsByDate[b.booking_date]) continue;
          items.push({
            key: `unlogged:${b.id}`,
            severity: "high",
            icon: CalendarCheck,
            title: "Log session outcome",
            detail: `Session on ${format(new Date(b.booking_date), "MMM d")} hasn't been logged yet.`,
            ctaLabel: "Log session",
            ctaHref: "/dashboard/sessions",
          });
          if (items.filter((i) => i.key.startsWith("unlogged:")).length >= 3) break;
        }
      }

      // Sort: high > medium > low; stable
      const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => order[a.severity] - order[b.severity]);

      if (!cancelled) setActions(items);
    };

    compute();
    return () => {
      cancelled = true;
    };
  }, [user, profile, roles, isMentee, isMentor, isActivated, activatedAt]);

  const visible = useMemo(() => actions.filter((a) => !dismissed[a.key]).slice(0, 5), [actions, dismissed]);

  if (!user || visible.length === 0) return null;

  const dismiss = (key: string) => {
    const next = { ...dismissed, [key]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  };

  const sevStyle: Record<Severity, string> = {
    high: "border-l-destructive bg-destructive/5",
    medium: "border-l-primary bg-primary/5",
    low: "border-l-muted-foreground/40 bg-muted/40",
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Action Points</h2>
          <span className="ml-auto font-body text-xs text-muted-foreground">
            {visible.length} item{visible.length === 1 ? "" : "s"} need your attention
          </span>
        </div>
        <ul className="space-y-2">
          {visible.map((a) => {
            const Icon = a.icon;
            return (
              <li
                key={a.key}
                className={`flex items-start gap-3 p-3 rounded-md border-l-4 ${sevStyle[a.severity]}`}
              >
                <Icon className="h-4 w-4 mt-0.5 text-foreground/80 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground">{a.title}</p>
                  {a.detail && <p className="font-body text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button asChild size="sm" variant="default" className="font-body h-8 text-xs">
                    <Link to={a.ctaHref}>{a.ctaLabel}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => dismiss(a.key)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ActionPoints;