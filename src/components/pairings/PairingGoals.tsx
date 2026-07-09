/**
 * Purpose: Co-authored goals for a single pairing. Mentor + mentee can add, complete, and remove goals.
 * DB tables: goals
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Target, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean | null;
  completed_at: string | null;
}

const PairingGoals = ({ pairingId, compact = false }: { pairingId: string; compact?: boolean }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("goals")
      .select("id, title, description, target_date, completed, completed_at")
      .eq("pairing_id", pairingId)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });
    setGoals((data as Goal[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairingId]);

  const completedCount = goals.filter((g) => g.completed).length;
  const pct = goals.length === 0 ? 0 : Math.round((completedCount / goals.length) * 100);

  const handleAdd = async () => {
    if (!title.trim()) {
      toast({ title: "Goal needs a title", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("goals").insert({
      pairing_id: pairingId,
      title: title.trim(),
      description: description.trim() || null,
      target_date: targetDate || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't add goal", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setDescription("");
    setTargetDate("");
    setAdding(false);
    load();
  };

  const toggleComplete = async (g: Goal) => {
    const next = !g.completed;
    const { error } = await supabase
      .from("goals")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", g.id);
    if (error) {
      toast({ title: "Couldn't update goal", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete goal", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <p className="font-body text-sm sora-semibold">Goals</p>
          {goals.length > 0 && (
            <span className="font-body text-xs text-muted-foreground">
              {completedCount}/{goals.length}
            </span>
          )}
        </div>
        {!adding && (
          <Button size="sm" variant="ghost" className="font-body h-7 px-2" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        )}
      </div>

      {goals.length > 0 && <Progress value={pct} className="h-1.5" />}

      {adding && (
        <div className="space-y-2 p-3 rounded-md bg-muted">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider">New goal</p>
            <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input
            placeholder="e.g. Land first PM interview"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="font-body text-sm"
          />
          <Textarea
            placeholder="Optional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="font-body text-sm"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-body text-sm"
            />
            <Button size="sm" onClick={handleAdd} disabled={saving} className="font-body shrink-0">
              {saving ? "Saving..." : "Save goal"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-body text-xs text-muted-foreground">Loading goals...</p>
      ) : goals.length === 0 && !adding ? (
        <p className="font-body text-xs text-muted-foreground italic">
          No goals yet. Add one to track what you're working towards together.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {goals.slice(0, compact ? 3 : undefined).map((g) => (
            <li
              key={g.id}
              className="group flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Checkbox
                checked={!!g.completed}
                onCheckedChange={() => toggleComplete(g)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-body text-sm leading-snug ${
                    g.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {g.title}
                </p>
                {g.description && (
                  <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.description}</p>
                )}
                {g.target_date && (
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                    Target: {format(parseISO(g.target_date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(g.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                aria-label="Delete goal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {compact && goals.length > 3 && (
            <li className="font-body text-xs text-muted-foreground pl-2">+{goals.length - 3} more</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default PairingGoals;