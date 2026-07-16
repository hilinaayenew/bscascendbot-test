import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const monthStartUTC = (offsetMonths = 0) => {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offsetMonths, 1),
  )
    .toISOString()
    .slice(0, 10);
};

const labelFor = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const daysUntilEndOfMonth = () => {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Forces mentors/mentees to complete monthly feedback when:
 *  - The previous month is still unfilled (any time of month), OR
 *  - The current month is unfilled AND we are within the last 5 days of it.
 * The user cannot dismiss the dialog and is sent to the feedback page.
 */
const FeedbackGate = () => {
  const { user, roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requiredPeriod, setRequiredPeriod] = useState<string | null>(null);

  const role: "mentor" | "mentee" | null = roles.includes("mentor")
    ? "mentor"
    : roles.includes("mentee")
      ? "mentee"
      : null;

  useEffect(() => {
    if (!user || !role) {
      setRequiredPeriod(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [qRes, rRes, pRes] = await Promise.all([
        supabase
          .from("feedback_questions" as any)
          .select("target_role, period_month, is_active")
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
      if (cancelled) return;

      const qs = ((qRes.data as any[]) || []).filter(
        (q) => q.target_role === "both" || q.target_role === role,
      );
      // If there are no applicable questions at all, don't gate.
      if (qs.length === 0) {
        setRequiredPeriod(null);
        return;
      }

      const submitted = new Set(
        ((rRes.data as any[]) || []).map((r) => r.period_month as string),
      );
      const current = monthStartUTC(0);
      const prev = monthStartUTC(-1);

      // Only consider the previous month if the user existed before it started.
      const createdAt = (pRes.data as any)?.created_at
        ? new Date((pRes.data as any).created_at)
        : null;
      const prevExisted =
        !!createdAt && createdAt < new Date(prev + "T00:00:00Z");

      if (prevExisted && !submitted.has(prev)) {
        setRequiredPeriod(prev);
        return;
      }

      if (!submitted.has(current) && daysUntilEndOfMonth() <= 5) {
        setRequiredPeriod(current);
        return;
      }

      setRequiredPeriod(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, role, location.pathname]);

  if (!requiredPeriod) return null;

  // Allow access to the feedback page itself for the required period.
  const onFeedbackPage = location.pathname.startsWith("/dashboard/feedback");
  const onCorrectPeriod = searchParams.get("period") === requiredPeriod
    || (!searchParams.get("period") && requiredPeriod === monthStartUTC(0));
  if (onFeedbackPage && onCorrectPeriod) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="font-display text-center">
            {labelFor(requiredPeriod)} feedback required
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body text-center">
            Before continuing, please share your feedback for{" "}
            {labelFor(requiredPeriod)}. This only takes a couple of minutes and
            helps the Ascendency team support you better.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            className="font-body"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/dashboard/feedback?period=${requiredPeriod}`);
            }}
          >
            Fill feedback now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FeedbackGate;