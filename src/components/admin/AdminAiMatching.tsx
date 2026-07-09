/**
 * Purpose: AI-powered mentor↔mentee matching for admins. Generates suggestions
 * via the `ai-match` edge function and lets the admin give final approval
 * (creates an active pairing) or reject each suggestion.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Sparkles, X, ArrowLeftRight, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/utils";
import { toast } from "sonner";

interface AiSuggestion {
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  score: number;
  reason: string;
}

interface ProfileLite {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  pathway_level: string | null;
  interests: string[] | null;
  expertise: string[] | null;
  country: string | null;
}

const scoreVariant = (score: number) => {
  if (score >= 85) return "default";
  if (score >= 70) return "secondary";
  return "outline";
};

const scoreLabel = (score: number) => {
  if (score >= 85) return "Strong match";
  if (score >= 70) return "Good match";
  return "Possible match";
};

const AdminAiMatching = () => {
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

  const fetchProfiles = async (userIds: string[]) => {
    if (!userIds.length) return;
    const missing = userIds.filter((id) => !profiles[id]);
    if (!missing.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, bio, pathway_level, interests, expertise, country")
      .in("user_id", missing);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as ProfileLite[]) next[p.user_id] = p;
        return next;
      });
    }
  };

  const runAiMatching = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-match", {});
      if (error) throw error;
      const list: AiSuggestion[] = data?.suggestions || [];
      // Sort highest score first
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      setSuggestions(list);
      setLastRunAt(new Date());
      const ids = Array.from(new Set(list.flatMap((s) => [s.mentor_id, s.mentee_id])));
      await fetchProfiles(ids);
      if (data?.message) toast.info(data.message);
      else toast.success(`${list.length} AI match suggestion${list.length === 1 ? "" : "s"} generated.`);
    } catch (e: any) {
      toast.error(e?.message || "AI matching failed.");
    } finally {
      setLoading(false);
    }
  };

  // Do not auto-run on mount — admin must click "Run AI" explicitly.

  const suggestionKey = (s: AiSuggestion) => `${s.mentor_id}:${s.mentee_id}`;

  const approve = async (s: AiSuggestion) => {
    const key = suggestionKey(s);
    setActingId(key);
    const { error } = await supabase.from("pairings").insert({
      mentor_id: s.mentor_id,
      mentee_id: s.mentee_id,
      status: "active",
      matched_by: "ai",
      ai_match_score: s.score,
      ai_match_reason: s.reason,
      admin_approved: true,
    });
    setActingId(null);
    if (error) {
      if ((error as any).code === "23505") toast.info("This pairing already exists.");
      else toast.error("Failed to approve pairing.");
      return;
    }
    toast.success(`Approved: ${s.mentee_name} ↔ ${s.mentor_name}`);
    setSuggestions((prev) => prev.filter((x) => suggestionKey(x) !== key));
  };

  const reject = (s: AiSuggestion) => {
    const key = suggestionKey(s);
    setSuggestions((prev) => prev.filter((x) => suggestionKey(x) !== key));
    toast("Suggestion dismissed.");
  };

  const stats = useMemo(() => {
    if (!suggestions.length) return null;
    const avg = Math.round(suggestions.reduce((s, x) => s + (x.score || 0), 0) / suggestions.length);
    const strong = suggestions.filter((s) => s.score >= 85).length;
    return { avg, strong };
  }, [suggestions]);

  const renderSide = (id: string, fallbackName: string, label: "Mentee" | "Mentor") => {
    const p = profiles[id];
    const initials = (p?.full_name || fallbackName || "?")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("");
    const tags = label === "Mentor" ? p?.expertise || [] : p?.interests || [];
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={resolveAvatarUrl(p?.avatar_url || undefined)} alt={p?.full_name || fallbackName} />
            <AvatarFallback className="font-body text-xs">{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-body font-semibold truncate">{p?.full_name || fallbackName}</p>
            <p className="font-body text-xs text-muted-foreground truncate">
              {p?.country ? `📍 ${p.country}` : ""}
              {p?.country && p?.pathway_level ? " · " : ""}
              {p?.pathway_level ? `Pathway: ${p.pathway_level}` : ""}
            </p>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((t) => (
              <Badge key={t} variant="secondary" className="font-body text-[10px] px-1.5 py-0">
                {t}
              </Badge>
            ))}
            {tags.length > 5 && (
              <span className="font-body text-[10px] text-muted-foreground">+{tags.length - 5}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Mentor Matching
            </CardTitle>
            <p className="font-body text-sm text-muted-foreground max-w-prose">
              Suggestions are generated by AI based on expertise, interests and pathway level. Nothing happens until
              you give final approval — approving creates an active pairing immediately.
            </p>
            {lastRunAt && (
              <p className="font-body text-xs text-muted-foreground">
                Last run: {lastRunAt.toLocaleTimeString()} · {suggestions.length} suggestion
                {suggestions.length === 1 ? "" : "s"}
                {stats ? ` · avg score ${stats.avg}% · ${stats.strong} strong` : ""}
              </p>
            )}
          </div>
          <Button onClick={runAiMatching} disabled={loading} size="sm" className="font-body shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {loading ? "Running…" : lastRunAt ? "Re-run AI" : "Run AI matching"}
          </Button>
        </CardHeader>
      </Card>

      {loading && suggestions.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">Asking the AI to find good matches…</p>
          </CardContent>
        </Card>
      )}

      {!loading && suggestions.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-body sora-semibold">
                {lastRunAt ? "No suggestions right now" : "Ready when you are"}
              </p>
              <p className="font-body text-sm text-muted-foreground max-w-md">
                {lastRunAt
                  ? "Either there aren't enough mentors and mentees on the platform yet, or every possible pair has already been matched. Try again after new sign-ups."
                  : "Click below to ask the AI to suggest mentor↔mentee pairings. Nothing happens until you approve a suggestion."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={runAiMatching} className="font-body">
              <Sparkles className="h-4 w-4 mr-1" /> {lastRunAt ? "Re-run AI" : "Run AI matching"}
            </Button>
          </CardContent>
        </Card>
      )}

      {suggestions.map((s) => {
        const key = suggestionKey(s);
        const acting = actingId === key;
        return (
          <Card key={key} className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant={scoreVariant(s.score) as any} className="font-body">
                    {s.score}% · {scoreLabel(s.score)}
                  </Badge>
                </div>
                <div className="w-full sm:w-48">
                  <Progress value={Math.min(100, Math.max(0, s.score))} className="h-1.5" />
                </div>
              </div>

              <div className="flex items-stretch gap-3 flex-col sm:flex-row">
                {renderSide(s.mentee_id, s.mentee_name, "Mentee")}
                <div className="hidden sm:flex items-center text-muted-foreground">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                {renderSide(s.mentor_id, s.mentor_name, "Mentor")}
              </div>

              <Separator />

              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="font-body text-sm text-muted-foreground">{s.reason}</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(s)}
                  disabled={acting}
                  className="font-body"
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button size="sm" onClick={() => approve(s)} disabled={acting} className="font-body">
                  {acting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Approve & pair
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminAiMatching;