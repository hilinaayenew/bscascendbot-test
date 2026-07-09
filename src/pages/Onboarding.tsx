import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, KeyRound, Sparkles } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // If they aren't authenticated (no magic-link session), bounce them to sign in.
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password set. Please sign in to continue.");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth", { replace: true }), 1200);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body sora-semibold bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Mentor onboarding
          </div>
          <h1 className="font-body text-2xl sora-bold text-foreground">
            Welcome to Ascendency
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Set a password to secure your account. You'll use this to sign in from now on.
          </p>
        </div>

        {done ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <p className="font-body sora-semibold text-foreground">All set!</p>
            <p className="font-body text-sm text-muted-foreground">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
              <KeyRound className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-sm sora-semibold text-foreground">
                  Step 1 of 1 — Create your password
                </p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  After this, you'll sign in with your email and new password.
                </p>
              </div>
            </div>

            <div>
              <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">
                New password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="font-body h-11"
                autoFocus
              />
            </div>

            <div>
              <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">
                Confirm password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="font-body h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-body sora-semibold group"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save password & continue"}
              {!submitting && (
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;