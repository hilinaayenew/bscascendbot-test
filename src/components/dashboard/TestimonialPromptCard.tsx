import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TestimonialPromptCard = () => {
  const { user, roles } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [display, setDisplay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
    setDismissed(localStorage.getItem("testimonial_prompt_dismissed") === "true");
  }, [user]);

  if (!user || !role || !loaded) return null;
  if (existing || dismissed) return null;

  const submit = async () => {
    if (content.trim().length < 20) {
      toast.error("Please share at least a couple of sentences.");
      return;
    }
    if (content.length > 800) {
      toast.error("Please keep it under 800 characters.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("testimonials" as any).insert({
      user_id: user.id,
      role,
      content: content.trim(),
      display_on_homepage: display,
      consent_promotional: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save testimonial.");
      return;
    }
    toast.success(display ? "Thank you — your testimonial may appear on our homepage." : "Thank you for your testimonial.");
    setExisting({});
    setOpen(false);
  };

  const dismiss = () => {
    localStorage.setItem("testimonial_prompt_dismissed", "true");
    setDismissed(true);
  };

  return (
    <>
      <Card className="shadow-card bg-gradient-to-br from-crimson-light/40 to-card border-primary/20 relative">
        <button
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex gap-3 items-start">
            <div className="shrink-0 h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-accent">
                Share your Ascendency story
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-1">
                A few sentences about your experience helps others take the leap. You can also manage your testimonial any time in Settings.
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} className="font-body shrink-0">
            Write a testimonial
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Share your testimonial</DialogTitle>
            <DialogDescription className="font-body">
              Tell us about your time on Ascendency. By submitting, you acknowledge that your testimonial may be used for promotional purposes in the future.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What has Ascendency meant for you?"
              rows={6}
              maxLength={800}
              className="font-body"
            />
            <p className="font-body text-xs text-muted-foreground text-right">{content.length}/800</p>
            <div className="flex items-start gap-2 rounded-md border border-border p-3 bg-muted/30">
              <Checkbox id="display" checked={display} onCheckedChange={(v) => setDisplay(Boolean(v))} />
              <Label htmlFor="display" className="font-body text-sm leading-snug cursor-pointer">
                Display this on the Ascendency homepage. You can ask us to remove it any time.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-body">
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="font-body">
              {saving ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TestimonialPromptCard;