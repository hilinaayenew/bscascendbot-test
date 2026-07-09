import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "mentor" ? "mentor" : "mentee";
  const [view, setView] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mentee" | "mentor">(initialRole);
  const [loading, setLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const navigate = useNavigate();

  const getRedirectUrl = (path: string = "/auth") => {
    const origin = window.location.origin;
    // If we're on a Lovable preview/sandbox domain, send users to the
    // published production site so the reset/confirm link works for everyone
    // (preview URLs require Lovable login and will 404 for end users).
    const isPreview =
      origin.includes("id-preview--") ||
      origin.includes("lovableproject.com") ||
      origin.includes("gpt-engineer.lovable.app");
    if (isPreview) {
      return `https://bscascend.lovable.app${path}`;
    }
    return `${origin}${path}`;
  };

  useEffect(() => {
    // Listen for password recovery event. If it fires here (instead of on the
    // dedicated /reset-password page), forward the user there with the hash intact.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate(`/reset-password${window.location.hash}`, { replace: true });
      } else if (event === "SIGNED_IN") {
        const isRecovery = window.location.hash.includes("type=recovery");
        if (!isRecovery) {
          const next = searchParams.get("next") || "/dashboard";
          navigate(next);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear any admin session flag
    sessionStorage.removeItem("admin_session");

    try {
      if (view === "signup") {
        // Check if email is blocked
        const { data: isBlocked } = await supabase.rpc("is_email_blocked", { check_email: email });
        if (isBlocked) {
          toast.error(
            "We are unable to create an account with this email address. Please contact mentorship@becauseshecan.tech if you believe this is a mistake.",
          );
          setLoading(false);
          return;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: getRedirectUrl(),
          },
        });
        if (error) throw error;

        // Supabase returns a "fake" user with empty identities when signing
        // up an email that already exists (anti-enumeration). The signup
        // confirmation email is NOT sent in that case. This is what imported
        // mentors hit — their auth user was pre-created (email_confirm=true,
        // no password), so a regular signup silently no-ops.
        // To keep the "signup → check your email" flow working for them,
        // fall back to a password reset email so they still receive a link
        // they can use to set a password and sign in.
        const identities = signUpData?.user?.identities ?? [];
        if (signUpData?.user && identities.length === 0) {
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl("/reset-password"),
          });
        }

        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (view === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            toast.error("Invalid email or password.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        const next = searchParams.get("next") || "/dashboard";
        navigate(next);
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getRedirectUrl("/reset-password"),
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setView("signin");
      } else if (view === "reset") {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        toast.success("Password updated successfully.");
        const next = searchParams.get("next") || "/dashboard";
        navigate(next);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
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
            <h1 className="font-body text-4xl sora-bold leading-tight">Your mentorship journey starts here.</h1>
            <p className="font-body text-lg sora-light opacity-90 leading-relaxed">
              Join a community of mentors and mentees building the future together through Because She Can.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body sora-semibold text-sm">For Mentors</p>
                  <p className="font-body sora-light text-sm opacity-80">
                    Share your expertise, set your rates, and guide the next generation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body sora-semibold text-sm">For Mentees</p>
                  <p className="font-body sora-light text-sm opacity-80">
                    Find your perfect mentor, track your growth, and accelerate your path.
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
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link to="/" className="font-body text-2xl sora-bold text-accent tracking-tight">
              Ascendency
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body sora-semibold ${
                  role === "mentor" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                }`}
              >
                {role === "mentor" ? <Sparkles className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {role === "mentor" ? "Mentor" : "Mentee"}
              </div>
            </div>
            <h2 className="font-body text-2xl sora-bold text-foreground">
              {view === "signup"
                ? "Create your account"
                : view === "forgot"
                  ? "Reset password"
                  : view === "reset"
                    ? "Set new password"
                    : "Welcome back"}
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1.5">
              {view === "signup"
                ? `Join as a ${role} to get started.`
                : view === "forgot"
                  ? "Enter your email to receive a reset link."
                  : view === "reset"
                    ? "Enter your new password below."
                    : `Sign in to continue as a ${role}.`}
            </p>
          </div>

          {/* Role selector — sign up only */}
          {view === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("mentee")}
                className={`p-4 rounded-lg border-2 text-left transition-all font-body ${
                  role === "mentee"
                    ? "border-primary bg-crimson-light"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Users className={`h-5 w-5 mb-2 ${role === "mentee" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="sora-semibold text-sm text-foreground">Mentee</p>
                <p className="text-xs text-muted-foreground mt-0.5">Find a mentor</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("mentor")}
                className={`p-4 rounded-lg border-2 text-left transition-all font-body ${
                  role === "mentor"
                    ? "border-primary bg-crimson-light"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Sparkles className={`h-5 w-5 mb-2 ${role === "mentor" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="sora-semibold text-sm text-foreground">Mentor</p>
                <p className="text-xs text-muted-foreground mt-0.5">Guide others</p>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div>
                <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">Full Name</label>
                <Input
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="font-body h-11"
                />
              </div>
            )}
            {(view === "signup" || view === "signin" || view === "forgot") && (
              <div>
                <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="font-body h-11"
                />
              </div>
            )}
            {(view === "signup" || view === "signin") && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-body text-xs sora-medium text-foreground/70 block">Password</label>
                  {view === "signin" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs text-primary hover:text-primary/80 transition-colors sora-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="font-body h-11"
                />
              </div>
            )}
            {view === "reset" && (
              <div>
                <label className="font-body text-xs sora-medium text-foreground/70 mb-1.5 block">New Password</label>
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
            )}
            {view === "signup" && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  By creating an account, you agree that we may collect and securely store your name, email address, and
                  profile information to provide you with the mentorship experience. We will{" "}
                  <strong>never sell or share your data with third parties</strong>. Your data is stored securely and
                  used only to operate this platform.
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Read our full{" "}
                  <a href="/privacy" className="underline text-primary hover:text-primary/80">
                    Privacy Policy
                  </a>{" "}
                  for more details.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="privacy-consent"
                    checked={privacyConsent}
                    onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="privacy-consent"
                    className="font-body text-xs text-foreground cursor-pointer leading-relaxed"
                  >
                    I have read and agree to the data handling practices described above.
                  </label>
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 font-body sora-semibold group"
              disabled={loading || (view === "signup" && !privacyConsent)}
            >
              {loading
                ? "Loading..."
                : view === "signup"
                  ? "Create Account"
                  : view === "forgot"
                    ? "Send Reset Link"
                    : view === "reset"
                      ? "Update Password"
                      : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 font-body text-xs text-muted-foreground">
                {view === "signup"
                  ? "Already have an account?"
                  : view === "forgot" || view === "reset"
                    ? "Remember your password?"
                    : "New to Ascendency?"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (view === "signup" || view === "forgot" || view === "reset") {
                setView("signin");
              } else {
                setView("signup");
              }
            }}
            className="w-full h-11 border border-border rounded-md font-body text-sm sora-medium text-foreground hover:bg-muted transition-colors"
          >
            {view === "signup"
              ? "Sign in instead"
              : view === "forgot" || view === "reset"
                ? "Back to Sign In"
                : "Create an account"}
          </button>

          {view !== "forgot" && view !== "reset" && (
            <button
              onClick={() => setRole(role === "mentee" ? "mentor" : "mentee")}
              className="w-full font-body text-xs sora-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {role === "mentee" ? "Switch to Mentor →" : "Switch to Mentee →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
