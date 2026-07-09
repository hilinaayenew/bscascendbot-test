import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Users, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    // When the user arrives via a recovery link, the URL hash contains the
    // access token. Supabase processes it automatically and fires
    // PASSWORD_RECOVERY. We confirm a session exists before showing the form.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setHasRecoverySession(true);
          setVerifying(false);
        }
      },
    );

    // Also check for an existing session in case the event already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
      setVerifying(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully. Redirecting…");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-primary opacity-90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-accent-foreground">
          <Link to="/" className="font-body text-2xl sora-bold tracking-tight">
            Ascendency
          </Link>

          <div className="space-y-6 max-w-md">
            <h1 className="font-body text-4xl sora-bold leading-tight">Set a new password.</h1>
            <p className="font-body text-lg sora-light opacity-90 leading-relaxed">
              Choose something memorable but secure. You'll use it to sign back into your Ascendency account.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body sora-semibold text-sm">Stay secure</p>
                  <p className="font-body sora-light text-sm opacity-80">
                    Use at least 8 characters with a mix of letters and numbers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body sora-semibold text-sm">One step away</p>
                  <p className="font-body sora-light text-sm opacity-80">
                    Once updated, you'll be signed in and taken to your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="font-body text-xs sora-light opacity-60">
            © {new Date().getFullYear()} Because She Can. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <Link to="/" className="font-body text-2xl sora-bold text-accent tracking-tight">
              Ascendency
            </Link>
          </div>

          <div>
            <h2 className="font-body text-2xl sora-bold text-foreground">Set new password</h2>
            <p className="font-body text-sm text-muted-foreground mt-1.5">
              Enter your new password below to complete the reset.
            </p>
          </div>

          {verifying ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="font-body text-sm text-muted-foreground">Verifying reset link…</p>
            </div>
          ) : !hasRecoverySession ? (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="font-body text-sm text-foreground">
                This reset link is invalid or has expired. Please request a new password reset email.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="w-full h-11 font-body sora-semibold"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="font-body h-11"
                  autoFocus
                />
              </div>
              <div>
                <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="font-body h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-body sora-semibold group"
                disabled={loading}
              >
                {loading ? "Updating…" : "Update Password"}
                {!loading && (
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </form>
          )}

          <button
            onClick={() => navigate("/auth")}
            className="w-full font-body text-xs sora-medium text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
