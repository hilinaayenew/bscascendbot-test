import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Star, Copy } from "lucide-react";

const SelectAggregate = ({ counts, total }: { counts: Record<string, number>; total: number }) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="font-body text-sm text-muted-foreground">No answers yet.</p>;
  }
  const max = Math.max(...entries.map(([, c]) => c));
  return (
    <div className="space-y-2">
      {entries.map(([opt, c]) => (
        <div key={opt}>
          <div className="flex justify-between text-sm font-body mb-1">
            <span>{opt}</span>
            <span className="text-muted-foreground">
              {c} ({total > 0 ? Math.round((c / total) * 100) : 0}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${(c / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

type QuestionType = "text" | "rating" | "single_select" | "multi_select";

type Question = {
  id: string;
  question: string;
  question_type: QuestionType;
  target_role: "mentor" | "mentee" | "both";
  sort_order: number;
  is_active: boolean;
  options: string[];
  allow_other: boolean;
  scope: "general" | "per_pairing";
  period_month: string | null;
};

type Response = {
  id: string;
  user_id: string;
  role: string;
  period_month: string;
  answers: Record<string, any>;
  created_at: string;
  full_name?: string;
  email?: string;
};

const currentMonthISO = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const AdminFeedback = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [month, setMonth] = useState<string>(currentMonthISO());
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Question | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySource, setCopySource] = useState<Question | null>(null);
  const [copyTarget, setCopyTarget] = useState<string>("");
  const [draft, setDraft] = useState<Partial<Question>>({
    question: "",
    question_type: "text",
    target_role: "both",
    sort_order: 0,
    is_active: true,
    options: [],
    allow_other: false,
    scope: "general",
    period_month: null,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [qRes, rRes] = await Promise.all([
      supabase.from("feedback_questions" as any).select("*").order("sort_order"),
      supabase.from("feedback_responses" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setQuestions(
      ((qRes.data as any[]) || []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        allow_other: !!q.allow_other,
        scope: q.scope === "per_pairing" ? "per_pairing" : "general",
        period_month: q.period_month ?? null,
      })),
    );
    const list = (rRes.data as any[]) || [];
    if (list.length > 0) {
      const ids = Array.from(new Set(list.map((r: any) => r.user_id)));
      const [profilesRes, contactsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
        supabase.rpc("admin_get_profile_contacts", { _user_ids: ids as any }),
      ]);
      const pMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const cMap = new Map(((contactsRes.data as any[]) || []).map((c: any) => [c.user_id, c]));
      setResponses(
        list.map((r: any) => ({
          ...r,
          full_name: pMap.get(r.user_id)?.full_name,
          email: cMap.get(r.user_id)?.email,
        })),
      );
    } else {
      setResponses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const months = useMemo(() => {
    const set = new Set(responses.map((r) => r.period_month));
    questions.forEach((q) => {
      if (q.period_month) set.add(q.period_month);
    });
    set.add(currentMonthISO());
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [responses, questions]);

  const filteredResponses = responses.filter(
    (r) => r.period_month === month && (roleFilter === "all" || r.role === roleFilter),
  );

  const qById = new Map(questions.map((q) => [q.id, q]));

  // Questions that apply to the selected month (no period set = always-on)
  const questionsForMonth = useMemo(
    () => questions.filter((q) => !q.period_month || q.period_month === month),
    [questions, month],
  );

  // Aggregates: ratings averaged, text answers listed
  const aggregates = useMemo(() => {
    const result: {
      question: Question;
      ratings: number[];
      texts: { name?: string; value: string }[];
      counts: Record<string, number>;
      total: number;
    }[] = [];
    const relevant = questionsForMonth.filter(
      (q) => roleFilter === "all" || q.target_role === "both" || q.target_role === roleFilter,
    );
    for (const q of relevant) {
      const ratings: number[] = [];
      const texts: { name?: string; value: string }[] = [];
      const counts: Record<string, number> = {};
      let total = 0;
      for (const r of filteredResponses) {
        const raw = r.answers?.[q.id];
        if (raw === undefined || raw === null || raw === "") continue;
        // Per-pairing answers are stored as { pairingId: value }
        const values: any[] =
          q.scope === "per_pairing" && typeof raw === "object" && !Array.isArray(raw)
            ? Object.values(raw)
            : [raw];
        for (const v of values) {
          if (v === undefined || v === null || v === "") continue;
          if (q.question_type === "rating") {
            const n = Number(v);
            if (!isNaN(n)) ratings.push(n);
          } else if (q.question_type === "single_select") {
            const s = String(v);
            counts[s] = (counts[s] || 0) + 1;
            total++;
          } else if (q.question_type === "multi_select") {
            const arr = Array.isArray(v) ? v : [];
            arr.forEach((s) => {
              counts[String(s)] = (counts[String(s)] || 0) + 1;
            });
            if (arr.length) total++;
          } else {
            texts.push({ name: r.full_name, value: String(v) });
          }
        }
      }
      result.push({ question: q, ratings, texts, counts, total });
    }
    return result;
  }, [questionsForMonth, filteredResponses, roleFilter]);

  const openNew = () => {
    setEditing(null);
    setDraft({
      question: "",
      question_type: "text",
      target_role: "both",
      sort_order: questions.length,
      is_active: true,
      options: [],
      allow_other: false,
      scope: "general",
      period_month: month || null,
    });
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setDraft(q);
    setDialogOpen(true);
  };

  const saveQuestion = async () => {
    if (!draft.question?.trim()) {
      toast.error("Question text is required.");
      return;
    }
    const isSelect = draft.question_type === "single_select" || draft.question_type === "multi_select";
    const cleanOptions = isSelect
      ? (draft.options || []).map((o) => o.trim()).filter(Boolean)
      : [];
    if (isSelect && cleanOptions.length < 2) {
      toast.error("Add at least two options for select questions.");
      return;
    }
    const payload: any = {
      question: draft.question?.trim(),
      question_type: draft.question_type,
      target_role: draft.target_role,
      sort_order: draft.sort_order ?? 0,
      is_active: draft.is_active ?? true,
      options: cleanOptions,
      allow_other: isSelect ? !!draft.allow_other : false,
      scope: draft.scope === "per_pairing" ? "per_pairing" : "general",
      period_month: draft.period_month || null,
    };
    if (editing) {
      const { error } = await supabase.from("feedback_questions" as any).update(payload).eq("id", editing.id);
      if (error) return toast.error("Save failed.");
    } else {
      const { error } = await supabase.from("feedback_questions" as any).insert(payload);
      if (error) return toast.error("Save failed.");
    }
    toast.success("Saved.");
    setEditing(null);
    setDraft({});
    setDialogOpen(false);
    fetchAll();
  };

  const removeQuestion = async (id: string) => {
    if (!confirm("Delete this question? Existing answers will remain in the database but won't show.")) return;
    const { error } = await supabase.from("feedback_questions" as any).delete().eq("id", id);
    if (error) return toast.error("Delete failed.");
    fetchAll();
  };

  const addMonths = (iso: string, n: number) => {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
  };

  const cloneQuestionsToMonth = async (sources: Question[], targetMonth: string) => {
    if (sources.length === 0) {
      toast.error("No questions to duplicate.");
      return;
    }
    const payloads = sources.map((q) => ({
      question: q.question,
      question_type: q.question_type,
      target_role: q.target_role,
      sort_order: q.sort_order,
      is_active: q.is_active,
      options: q.options || [],
      allow_other: q.allow_other,
      scope: q.scope,
      period_month: targetMonth,
    }));
    const { error } = await supabase.from("feedback_questions" as any).insert(payloads);
    if (error) return toast.error("Duplicate failed.");
    toast.success(
      `Duplicated ${sources.length} question${sources.length === 1 ? "" : "s"} to ${new Date(targetMonth + "T00:00:00Z").toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}.`,
    );
    setMonth(targetMonth);
    fetchAll();
  };

  const duplicateAllToNextMonth = async () => {
    const target = addMonths(month, 1);
    const targetLabel = new Date(target + "T00:00:00Z").toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    const sources = questionsForMonth;
    if (!confirm(`Duplicate ${sources.length} question${sources.length === 1 ? "" : "s"} to ${targetLabel}? Always-on questions will be copied as month-specific to ${targetLabel}.`)) return;
    await cloneQuestionsToMonth(sources, target);
  };

  const openCopySingle = (q: Question) => {
    setCopySource(q);
    setCopyTarget(addMonths(q.period_month || month, 1));
    setCopyDialogOpen(true);
  };

  const confirmCopySingle = async () => {
    if (!copySource || !copyTarget) return;
    await cloneQuestionsToMonth([copySource], copyTarget);
    setCopyDialogOpen(false);
    setCopySource(null);
  };

  return (
    <Tabs defaultValue="responses">
      <TabsList>
        <TabsTrigger value="responses">Responses</TabsTrigger>
        <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="responses" className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-48 font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="font-body">
                    {new Date(m + "T00:00:00Z").toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-body">All</SelectItem>
                <SelectItem value="mentor" className="font-body">Mentors</SelectItem>
                <SelectItem value="mentee" className="font-body">Mentees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="font-body ml-auto">
            {filteredResponses.length} response{filteredResponses.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {loading ? (
          <p className="font-body text-muted-foreground text-center py-8">Loading...</p>
        ) : filteredResponses.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">No responses for this month.</p>
        ) : (
          <div className="space-y-4">
            {aggregates.map(({ question, ratings, texts }) => {
              const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
              return (
                <Card key={question.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-body text-base font-medium flex items-start justify-between gap-3">
                      <span>{question.question}</span>
                      <Badge variant="outline" className="font-body text-xs capitalize shrink-0">
                        {question.target_role}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {question.question_type === "rating" ? (
                      <div>
                        {avg !== null ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-5 w-5 fill-primary text-primary" />
                              <span className="font-display text-2xl font-bold">{avg.toFixed(1)}</span>
                              <span className="font-body text-sm text-muted-foreground">/ 5</span>
                            </div>
                            <span className="font-body text-sm text-muted-foreground">
                              from {ratings.length} response{ratings.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        ) : (
                          <p className="font-body text-sm text-muted-foreground">No ratings yet.</p>
                        )}
                      </div>
                    ) : question.question_type === "single_select" || question.question_type === "multi_select" ? (
                      <SelectAggregate counts={aggregates.find((a) => a.question.id === question.id)?.counts || {}} total={aggregates.find((a) => a.question.id === question.id)?.total || 0} />
                    ) : (
                      <div className="space-y-2">
                        {texts.length === 0 ? (
                          <p className="font-body text-sm text-muted-foreground">No written answers yet.</p>
                        ) : (
                          texts.map((t, i) => (
                            <div key={i} className="border-l-2 border-primary/20 pl-3 py-1">
                              <p className="font-body text-sm">{t.value}</p>
                              {t.name && (
                                <p className="font-body text-xs text-muted-foreground mt-1">— {t.name}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <details className="rounded-md border border-border p-3">
              <summary className="font-body text-sm cursor-pointer">
                Individual responses ({filteredResponses.length})
              </summary>
              <div className="mt-3 space-y-3">
                {filteredResponses.map((r) => (
                  <Card key={r.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body font-semibold">
                          {r.full_name || "Unknown"}{" "}
                          <Badge variant="secondary" className="font-body text-xs ml-1 capitalize">{r.role}</Badge>
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(r.answers || {}).map(([qid, v]) => {
                          const q = qById.get(qid);
                          if (!q) return null;
                          return (
                            <div key={qid}>
                              <p className="font-body text-xs text-muted-foreground">{q.question}</p>
                              <p className="font-body text-sm">
                                {q.question_type === "rating"
                                  ? `${v} / 5`
                                  : Array.isArray(v)
                                    ? (v as any[]).join(", ")
                                    : String(v)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          </div>
        )}
      </TabsContent>

      <TabsContent value="questions" className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-end justify-between">
          <div>
            <label className="font-body text-xs text-muted-foreground block mb-1">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-48 font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="font-body">
                    {new Date(m + "T00:00:00Z").toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Showing questions for this month plus always-on questions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={duplicateAllToNextMonth}
              disabled={questionsForMonth.length === 0}
              className="font-body"
            >
              <Copy className="h-4 w-4 mr-1" /> Copy to next month
            </Button>
            <Button onClick={openNew} className="font-body">
              <Plus className="h-4 w-4 mr-1" /> New question
            </Button>
          </div>
        </div>
        {questionsForMonth.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">No questions yet.</p>
        ) : (
          questionsForMonth.map((q) => (
            <Card key={q.id} className="shadow-card">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-body font-medium">{q.question}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="font-body text-xs capitalize">{q.target_role}</Badge>
                    <Badge variant="outline" className="font-body text-xs">{q.question_type.replace("_", " ")}</Badge>
                    <Badge variant="outline" className="font-body text-xs">
                      {q.scope === "per_pairing" ? "Per pairing" : "General"}
                    </Badge>
                    <Badge variant="outline" className="font-body text-xs">
                      {q.period_month
                        ? new Date(q.period_month + "T00:00:00Z").toLocaleString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })
                        : "Always on"}
                    </Badge>
                    <Badge variant={q.is_active ? "default" : "secondary"} className="font-body text-xs">
                      {q.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-body text-xs text-muted-foreground">order {q.sort_order}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openCopySingle(q)} title="Duplicate to another month">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(q)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) {
              setDraft({});
              setEditing(null);
            }
          }}
        >
          <DialogContent
            className="max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                {editing ? "Edit question" : "New question"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={draft.question || ""}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                placeholder="Question text..."
                rows={3}
                className="font-body"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">Type</label>
                  <Select
                    value={draft.question_type || "text"}
                    onValueChange={(v) => setDraft({ ...draft, question_type: v as any })}
                  >
                    <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text" className="font-body">Text</SelectItem>
                      <SelectItem value="rating" className="font-body">Rating (1–5)</SelectItem>
                      <SelectItem value="single_select" className="font-body">Dropdown (single choice)</SelectItem>
                      <SelectItem value="multi_select" className="font-body">Checkboxes (multiple choice)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">Target role</label>
                  <Select
                    value={draft.target_role || "both"}
                    onValueChange={(v) => setDraft({ ...draft, target_role: v as any })}
                  >
                    <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both" className="font-body">Both</SelectItem>
                      <SelectItem value="mentor" className="font-body">Mentors</SelectItem>
                      <SelectItem value="mentee" className="font-body">Mentees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">Sort order</label>
                  <Input
                    type="number"
                    value={draft.sort_order ?? 0}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                    className="font-body"
                  />
                </div>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={draft.is_active ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                  />
                  <span className="font-body text-sm">Active</span>
                </div>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Scope</label>
                <Select
                  value={draft.scope || "general"}
                  onValueChange={(v) => setDraft({ ...draft, scope: v as any })}
                >
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general" className="font-body">General — one answer per person</SelectItem>
                    <SelectItem value="per_pairing" className="font-body">Per pairing — one answer for each active pairing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Per-pairing questions repeat for each of the user's accepted pairings, labelled with the partner's name.
                </p>
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Period</label>
                <Select
                  value={draft.period_month ? draft.period_month : "__always__"}
                  onValueChange={(v) => setDraft({ ...draft, period_month: v === "__always__" ? null : v })}
                >
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__always__" className="font-body">Always on (every month)</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m} className="font-body">
                        {new Date(m + "T00:00:00Z").toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Pick a month to only show this question to users during that month, or keep "Always on" to ask it every month.
                </p>
              </div>
              {(draft.question_type === "single_select" || draft.question_type === "multi_select") && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <label className="font-body text-xs text-muted-foreground block">Options</label>
                  {(draft.options || []).map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const next = [...(draft.options || [])];
                          next[i] = e.target.value;
                          setDraft({ ...draft, options: next });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="font-body"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDraft({ ...draft, options: (draft.options || []).filter((_, j) => j !== i) })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDraft({ ...draft, options: [...(draft.options || []), ""] })}
                    className="font-body"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add option
                  </Button>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={!!draft.allow_other}
                      onCheckedChange={(v) => setDraft({ ...draft, allow_other: v })}
                    />
                    <span className="font-body text-sm">Include "Other" with free text</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDraft({}); setEditing(null); setDialogOpen(false); }} className="font-body">
                Cancel
              </Button>
              <Button onClick={saveQuestion} className="font-body">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Duplicate question</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {copySource && (
                <p className="font-body text-sm text-muted-foreground">
                  Duplicating: <span className="text-foreground">{copySource.question}</span>
                </p>
              )}
              <div>
                <label className="font-body text-xs text-muted-foreground block mb-1">Copy to month</label>
                <Input
                  type="month"
                  value={copyTarget ? copyTarget.slice(0, 7) : ""}
                  onChange={(e) => setCopyTarget(e.target.value ? `${e.target.value}-01` : "")}
                  className="font-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCopyDialogOpen(false)} className="font-body">
                Cancel
              </Button>
              <Button onClick={confirmCopySingle} disabled={!copyTarget} className="font-body">
                Duplicate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
};

export default AdminFeedback;