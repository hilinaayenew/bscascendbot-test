import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star, CheckCircle2 } from "lucide-react";

type Question = {
  id: string;
  question: string;
  question_type: "text" | "rating" | "single_select" | "multi_select";
  target_role: "mentor" | "mentee" | "both";
  sort_order: number;
  options?: string[];
  allow_other?: boolean;
  scope: "general" | "per_pairing";
  period_month?: string | null;
};

type Pairing = { id: string; partner_id: string; partner_name: string };

const monthStartISO = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const isValidPeriod = (s: string | null): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

const RatingInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="p-1"
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          className={`h-7 w-7 transition-colors ${
            n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"
          }`}
        />
      </button>
    ))}
  </div>
);

const OTHER = "__other__";

const QuestionInput = ({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: any;
  onChange: (v: any) => void;
}) => {
  if (q.question_type === "rating") {
    return <RatingInput value={Number(value) || 0} onChange={onChange} />;
  }

  if (q.question_type === "single_select") {
    const opts = q.options || [];
    const isOther = q.allow_other && typeof value === "string" && value && !opts.includes(value);
    const selectValue = isOther ? OTHER : (value as string) || "";
    return (
      <div className="space-y-2">
        <Select
          value={selectValue}
          onValueChange={(v) => onChange(v === OTHER ? "" : v)}
        >
          <SelectTrigger className="font-body">
            <SelectValue placeholder="Select an answer..." />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o} value={o} className="font-body">
                {o}
              </SelectItem>
            ))}
            {q.allow_other && (
              <SelectItem value={OTHER} className="font-body">
                Other
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {q.allow_other && (selectValue === OTHER || isOther) && (
          <Input
            value={isOther ? (value as string) : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Please specify..."
            className="font-body"
            maxLength={300}
          />
        )}
      </div>
    );
  }

  if (q.question_type === "multi_select") {
    const opts = q.options || [];
    const arr: string[] = Array.isArray(value) ? value : [];
    const otherValue = arr.find((a) => !opts.includes(a)) || "";
    const otherChecked = q.allow_other && otherValue !== "";
    const toggle = (opt: string, checked: boolean) => {
      const next = checked ? [...arr.filter((a) => a !== opt), opt] : arr.filter((a) => a !== opt);
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {opts.map((o) => (
          <label key={o} className="flex items-center gap-2 font-body text-sm cursor-pointer">
            <Checkbox checked={arr.includes(o)} onCheckedChange={(c) => toggle(o, !!c)} />
            {o}
          </label>
        ))}
        {q.allow_other && (
          <div className="space-y-1">
            <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
              <Checkbox
                checked={otherChecked}
                onCheckedChange={(c) => {
                  const cleaned = arr.filter((a) => opts.includes(a));
                  onChange(c ? [...cleaned, ""] : cleaned);
                }}
              />
              Other
            </label>
            {otherChecked && (
              <Input
                value={otherValue}
                onChange={(e) => {
                  const cleaned = arr.filter((a) => opts.includes(a));
                  onChange([...cleaned, e.target.value]);
                }}
                placeholder="Please specify..."
                className="font-body ml-6 w-[calc(100%-1.5rem)]"
                maxLength={300}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Textarea
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer..."
      rows={4}
      maxLength={1500}
      className="font-body"
    />
  );
};

const Feedback = () => {
  const { user, roles, loading, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get("period");
  const period = isValidPeriod(periodParam) ? periodParam : monthStartISO();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [existing, setExisting] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [periodOptions, setPeriodOptions] = useState<
    { period: string; submitted: boolean }[]
  >([]);

  const role: "mentor" | "mentee" | null = roles.includes("mentor")
    ? "mentor"
    : roles.includes("mentee")
      ? "mentee"
      : null;

  const monthLabel = useMemo(
    () =>
      new Date(period + "T00:00:00Z").toLocaleString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [period],
  );

  // Build the list of selectable periods: every month from signup → current.
  useEffect(() => {
    if (!user || !role) return;
    (async () => {
      const [rRes, pRes] = await Promise.all([
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
      const submitted = new Set(
        ((rRes.data as any[]) || []).map((r) => r.period_month as string),
      );
      const current = monthStartISO();
      const signup = (pRes.data as any)?.created_at
        ? new Date((pRes.data as any).created_at)
        : new Date();
      const now = new Date();
      const startYear = signup.getUTCFullYear();
      const startMonth = signup.getUTCMonth();
      const endYear = now.getUTCFullYear();
      const endMonth = now.getUTCMonth();
      const months = new Set<string>();
      submitted.forEach((s) => months.add(s));
      // Only show current month + immediately previous month (if user existed then).
      const total = Math.max(
        0,
        (endYear - startYear) * 12 + (endMonth - startMonth),
      );
      const maxBack = Math.min(total, 1);
      for (let i = maxBack; i >= 0; i--) {
        const d = new Date(Date.UTC(endYear, endMonth - i, 1));
        months.add(d.toISOString().slice(0, 10));
      }
      months.add(current);
      const list = Array.from(months)
        .sort((a, b) => b.localeCompare(a))
        .map((p) => ({ period: p, submitted: submitted.has(p) }));
      setPeriodOptions(list);
    })();
  }, [user, role]);

  useEffect(() => {
    if (!user || !role) return;
    setLoadingData(true);
    setAnswers({});
    setExisting(null);
    (async () => {
      const [qRes, rRes, pRes] = await Promise.all([
        supabase
          .from("feedback_questions" as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("feedback_responses" as any)
          .select("*")
          .eq("user_id", user.id)
          .eq("period_month", period)
          .maybeSingle(),
        supabase
          .from("pairings")
          .select("id, mentor_id, mentee_id, status, admin_approved")
          .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
      ]);
      const qs = ((qRes.data as any[]) || [])
        .filter((q) => q.target_role === "both" || q.target_role === role)
        .filter((q) => !q.period_month || q.period_month === period)
        .map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
          allow_other: !!q.allow_other,
          scope: q.scope === "per_pairing" ? "per_pairing" : "general",
        })) as Question[];
      setQuestions(qs);
      if (rRes.data) {
        setExisting(rRes.data);
        setAnswers(((rRes.data as any).answers as Record<string, any>) || {});
      }
      const accepted = ((pRes.data as any[]) || []).filter(
        (p) => p.admin_approved && (p.status === "accepted" || p.status === "active"),
      );
      const partnerIds = accepted.map((p) =>
        p.mentor_id === user.id ? p.mentee_id : p.mentor_id,
      );
      let nameMap = new Map<string, string>();
      if (partnerIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", partnerIds);
        nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || "Partner"]));
      }
      setPairings(
        accepted.map((p) => {
          const partner_id = p.mentor_id === user.id ? p.mentee_id : p.mentor_id;
          return {
            id: p.id,
            partner_id,
            partner_name: nameMap.get(partner_id) || "Partner",
          };
        }),
      );
      setLoadingData(false);
    })();
  }, [user, role, period]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;
  if (!role) return <Navigate to="/dashboard" replace />;

  const submit = async () => {
    // Require at least one non-empty answer (across general + per-pairing)
    const isFilled = (v: any) =>
      typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : Boolean(v);
    const hasAny = Object.values(answers).some((v) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        return Object.values(v).some(isFilled);
      }
      return isFilled(v);
    });
    if (!hasAny) {
      toast.error("Please answer at least one question.");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      role,
      period_month: period,
      answers,
    };
    const { error } = existing
      ? await supabase
          .from("feedback_responses" as any)
          .update({ answers })
          .eq("id", existing.id)
      : await supabase.from("feedback_responses" as any).insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Could not save feedback.");
      return;
    }
    toast.success("Thank you for your feedback!");
    setExisting({ ...(existing || {}), ...payload });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-accent">Monthly Feedback</h1>
          <p className="font-body text-muted-foreground mt-1">
            {monthLabel} · Your responses go directly to the Ascendency team.
          </p>
        </div>

        {periodOptions.length > 1 && (
          <div className="space-y-1">
            <Label className="font-body text-xs text-muted-foreground">Period</Label>
            <Select
              value={period}
              onValueChange={(v) => {
                const next = new URLSearchParams(searchParams);
                next.set("period", v);
                setSearchParams(next, { replace: true });
              }}
            >
              <SelectTrigger className="font-body w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((o) => (
                  <SelectItem key={o.period} value={o.period} className="font-body">
                    {new Date(o.period + "T00:00:00Z").toLocaleString(undefined, {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    {o.submitted ? "· Submitted" : "· Pending"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {existing && (
          <div className="rounded-md border border-primary/20 bg-crimson-light/40 p-4 flex gap-2 items-start">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <p className="font-body text-sm">
              You've already submitted feedback for {monthLabel}. You can update your answers below.
            </p>
          </div>
        )}

        {loadingData ? (
          <p className="font-body text-muted-foreground">Loading questions...</p>
        ) : questions.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <p className="font-body text-muted-foreground">
                No feedback questions are available right now. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              if (q.scope === "per_pairing") {
                if (pairings.length === 0) return null;
                const perPairing =
                  answers[q.id] && typeof answers[q.id] === "object" && !Array.isArray(answers[q.id])
                    ? (answers[q.id] as Record<string, any>)
                    : {};
                return (
                  <Card key={q.id} className="shadow-card">
                    <CardHeader>
                      <CardTitle className="font-body text-base font-medium leading-snug">
                        {q.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pairings.map((p) => (
                        <div key={p.id} className="space-y-2">
                          <Label className="font-body text-sm text-muted-foreground">
                            {role === "mentor" ? "Mentee" : "Mentor"}: {p.partner_name}
                          </Label>
                          <QuestionInput
                            q={q}
                            value={perPairing[p.id]}
                            onChange={(v) =>
                              setAnswers({
                                ...answers,
                                [q.id]: { ...perPairing, [p.id]: v },
                              })
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card key={q.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-body text-base font-medium leading-snug">
                      {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionInput
                      q={q}
                      value={answers[q.id]}
                      onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    />
                  </CardContent>
                </Card>
              );
            })}
            <Button onClick={submit} disabled={saving} className="font-body w-full" size="lg">
              {saving ? "Saving..." : existing ? "Update feedback" : "Submit feedback"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feedback;