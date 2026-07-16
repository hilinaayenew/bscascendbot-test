import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquareQuote, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TestimonialManager = () => {
  const { user, roles } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [display, setDisplay] = useState(true);
  const [saving, setSaving] = useState(false);

  const role: "mentor" | "mentee" | null = roles.includes("mentor")
    ? "mentor"
    : roles.includes("mentee")
      ? "mentee"
      : null;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("testimonials" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setExisting(data || null);
      setContent((data as any)?.content || "");
      setDisplay((data as any)?.display_on_homepage ?? true);
      setLoaded(true);
    })();
  }, [user]);

  if (!user || !role) return null;

  const save = async () => {
    if (content.trim().length < 20) {
      toast.error("Please share at least a couple of sentences.");
      return;
    }
    if (content.length > 800) {
      toast.error("Please keep it under 800 characters.");
      return;
    }
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      role,
      content: content.trim(),
      display_on_homepage: display,
      consent_promotional: true,
    };
    const { error } = existing?.id
      ? await supabase.from("testimonials" as any).update(payload).eq("id", existing.id)
      : await supabase.from("testimonials" as any).insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Could not save testimonial.");
      return;
    }
    toast.success("Testimonial saved.");
    const { data } = await supabase
      .from("testimonials" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setExisting(data || null);
  };

  const remove = async () => {
    if (!existing?.id) return;
    if (!confirm("Delete your testimonial?")) return;
    const { error } = await supabase.from("testimonials" as any).delete().eq("id", existing.id);
    if (error) {
      toast.error("Could not delete testimonial.");
      return;
    }
    setExisting(null);
    setContent("");
    setDisplay(true);
    toast.success("Testimonial deleted.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-lg flex items-center gap-2">
          <MessageSquareQuote className="h-5 w-5 text-primary" /> Your Testimonial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-body text-sm text-muted-foreground">
          Share your Ascendency experience. By submitting, you acknowledge it may be used for promotional purposes in the future.
        </p>
        {!loaded ? (
          <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What has Ascendency meant for you?"
              rows={5}
              maxLength={800}
              className="font-body"
            />
            <p className="font-body text-xs text-muted-foreground text-right">{content.length}/800</p>
            <div className="flex items-start gap-2 rounded-md border border-border p-3 bg-muted/30">
              <Checkbox id="t-display" checked={display} onCheckedChange={(v) => setDisplay(Boolean(v))} />
              <Label htmlFor="t-display" className="font-body text-sm leading-snug cursor-pointer">
                Display this on the Ascendency homepage. You can update or remove it any time.
              </Label>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {existing?.id && (
                <Button variant="outline" size="sm" onClick={remove} className="font-body text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button onClick={save} disabled={saving} className="font-body">
                {saving ? "Saving..." : existing?.id ? "Update testimonial" : "Submit testimonial"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestimonialManager;