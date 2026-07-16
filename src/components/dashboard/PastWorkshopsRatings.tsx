import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CalendarDays, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TYPE_LABEL, type Workshop } from "@/lib/workshopsData";
import { cn } from "@/lib/utils";

interface RatingRow {
  workshop_id: string;
  rating: number;
  comment: string | null;
}

interface Props {
  variant?: "card" | "section";
  limit?: number;
}

const PastWorkshopsRatings = ({ variant = "card", limit = 10 }: Props) => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingRow>>({});
  const [drafts, setDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const dismissKey = user ? `dismissed_workshop_ratings_${user.id}` : "";
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!dismissKey) return;
    try {
      const raw = localStorage.getItem(dismissKey);
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {}
  }, [dismissKey]);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(dismissKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data: ws } = await supabase
        .from("workshops_sessions" as any)
        .select("*")
        .lt("starts_at", nowIso)
        .order("starts_at", { ascending: false })
        .limit(limit);
      const list = (ws || []) as unknown as Workshop[];
      if (!alive) return;
      setWorkshops(list);

      if (list.length) {
        const { data: r } = await supabase
          .from("workshop_ratings" as any)
          .select("workshop_id, rating, comment")
          .eq("user_id", user.id)
          .in("workshop_id", list.map((w) => w.id));
        if (!alive) return;
        const map: Record<string, RatingRow> = {};
        (r || []).forEach((row: any) => (map[row.workshop_id] = row));
        setRatings(map);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user, limit]);

  const setDraft = (id: string, patch: Partial<{ rating: number; comment: string }>) => {
    setDrafts((d) => ({
      ...d,
      [id]: {
        rating: patch.rating ?? d[id]?.rating ?? ratings[id]?.rating ?? 0,
        comment: patch.comment ?? d[id]?.comment ?? ratings[id]?.comment ?? "",
      },
    }));
  };

  const submit = async (workshopId: string) => {
    if (!user) return;
    const draft = drafts[workshopId] || {
      rating: ratings[workshopId]?.rating || 0,
      comment: ratings[workshopId]?.comment || "",
    };
    if (!draft.rating) {
      toast.error("Please select a star rating.");
      return;
    }
    setSaving(workshopId);
    const { error } = await supabase
      .from("workshop_ratings" as any)
      .upsert(
        {
          workshop_id: workshopId,
          user_id: user.id,
          rating: draft.rating,
          comment: draft.comment?.trim() || null,
        },
        { onConflict: "workshop_id,user_id" },
      );
    setSaving(null);
    if (error) {
      toast.error("Failed to save rating.");
      return;
    }
    toast.success("Thanks for your feedback!");
    setRatings((r) => ({
      ...r,
      [workshopId]: { workshop_id: workshopId, rating: draft.rating, comment: draft.comment?.trim() || null },
    }));
    setExpanded((e) => ({ ...e, [workshopId]: false }));
  };

  const visibleWorkshops = workshops.filter((w) => !dismissed.has(w.id));

  const content = (
    <div className="space-y-3">
      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : visibleWorkshops.length === 0 ? (
        <div className="text-center py-6">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">No past workshops yet.</p>
        </div>
      ) : (
        visibleWorkshops.map((w) => {
          const existing = ratings[w.id];
          const draft = drafts[w.id] || { rating: existing?.rating || 0, comment: existing?.comment || "" };
          const isOpen = expanded[w.id] || !existing;
          const start = new Date(w.starts_at);
          return (
            <div key={w.id} className="border border-border rounded-md p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm sora-semibold text-foreground">{w.title}</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABEL[w.type]} ·{" "}
                    {start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {existing && !isOpen && (
                    <>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "h-3.5 w-3.5",
                          n <= existing.rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                        )}
                      />
                    ))}
                    <Check className="h-3.5 w-3.5 text-primary ml-1" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(w.id)}
                    aria-label="Dismiss"
                    className="ml-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {existing && !isOpen ? (
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [w.id]: true }))}
                  className="font-body text-xs text-primary hover:underline"
                >
                  Edit your rating
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDraft(w.id, { rating: n })}
                        className="p-0.5 hover:scale-110 transition-transform"
                        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            n <= draft.rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="A short note on how it went..."
                    value={draft.comment}
                    onChange={(e) => setDraft(w.id, { comment: e.target.value.slice(0, 500) })}
                    className="font-body text-sm min-h-[60px]"
                  />
                  <div className="flex justify-end gap-2">
                    {existing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="font-body h-7 text-xs"
                        onClick={() => setExpanded((e) => ({ ...e, [w.id]: false }))}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="font-body h-7 text-xs"
                      onClick={() => submit(w.id)}
                      disabled={saving === w.id}
                    >
                      {saving === w.id ? "Saving..." : existing ? "Update" : "Submit"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  if (variant === "section") {
    return (
      <div className="space-y-3">
        <h2 className="font-body text-lg sora-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Rate Past Workshops
        </h2>
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Rate Past Workshops
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default PastWorkshopsRatings;