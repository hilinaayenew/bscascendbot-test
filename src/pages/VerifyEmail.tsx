import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const maskEmail = (email: string): string => {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visibleStart = local.slice(0, 2);
  const visibleEnd = local.length > 3 ? local.slice(-1) : "";
  const masked = visibleStart + "•••" + visibleEnd;
  const [domainName, tld] = domain.split(".");
  const maskedDomain = domainName.slice(0, 2) + "•••" + (tld ? "." + tld : "");
  return masked + "@" + maskedDomain;
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const maskedEmail = maskEmail(email);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  // Poll for verification by listening to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          navigate("/dashboard", { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("Verification email resent. Check your inbox.");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="font-body text-2xl sora-bold text-foreground">
            Check your email
          </h1>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            We've sent a verification link to{" "}
            {maskedEmail ? (
              <span className="font-semibold text-foreground">{maskedEmail}</span>
            ) : (
              "your email address"
            )}
            . Click the link in the email to verify your account and get started.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-3 text-left">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="font-body text-sm text-muted-foreground">
              Can't find the email? Check your <strong className="text-foreground">spam or junk folder</strong> — it sometimes ends up there.
            </p>
          </div>
        </div>

        <Button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          variant="outline"
          className="w-full h-11 font-body sora-semibold"
        >
          {resending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend verification email
            </>
          )}
        </Button>

        <p className="font-body text-xs text-muted-foreground">
          Wrong email?{" "}
          <Link to="/auth" className="text-primary hover:text-primary/80 underline">
            Go back and try again
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
