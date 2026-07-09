import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowLeft, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import DiscountCodeModal from "@/components/DiscountCodeModal";
import { useActivation } from "@/hooks/useActivation";

const plans = [
  {
    level: "curious",
    title: "Curious",
    subtitle: "Foundation Builder",
    price: "$1",
    period: "/month",
    description: "Start your growth journey with vetted mentors, masterclasses, workshops, and AI-powered career tools.",
    features: [
      "Access to our list of vetted mentors",
      "On-Demand Masterclasses",
      "Monthly Technical Workshops",
      "Community forum access",
      "Access to Ascendency AI",
      "Freelance marketplace profile",
    ],
  },
  {
    level: "mentee",
    title: "Mentee",
    subtitle: "Acceleration",
    price: "$10",
    period: "/month",
    description: "Go further with dedicated mentorship, leadership workshops, and structured career support.",
    features: [
      "All of the above, plus",
      "Monthly meetings with your personal mentor",
      "Monthly leadership workshops",
      "Featured marketplace listing",
      "Monthly career building group",
    ],
    highlighted: true,
  },
  {
    level: "apprentsis",
    title: "ApprentSis",
    subtitle: "Career Launchpad",
    price: "$25",
    period: "/month",
    description: "For mentees who have completed our three-month programme. We help you find a placement to take you to the next step.",
    features: [
      "Everything in Mentee",
      "Access to Bloom & Build Brunches",
      "Networking opportunities",
    ],
  },
];

const Subscribe = () => {
  const { user, profile, roles, loading, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const [subscribing, setSubscribing] = useState(false);
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const isMentor = roles.includes("mentor");
  const { isActivated, activatedAt, codeUsed } = useActivation();

  // Calculate 6-month expiry
  const getCodeExpiry = () => {
    if (!activatedAt) return null;
    const expiry = new Date(activatedAt);
    expiry.setMonth(expiry.getMonth() + 6);
    return expiry;
  };
  const codeExpiry = getCodeExpiry();
  const isCodeExpired = codeExpiry ? new Date() > codeExpiry : false;
  const daysRemaining = codeExpiry ? Math.max(0, Math.ceil((codeExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const isLockedToMentee = isActivated && !isCodeExpired;

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;
  if (isMentor) return <Navigate to="/dashboard/explore" replace />;

  const currentLevel = profile?.pathway_level || "none";
  const hasActiveSubscription = currentLevel !== "none";

  const handleSubscribe = async (level: string) => {
    setSubscribing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ pathway_level: level })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      toast.success(`You're now on the ${level.charAt(0).toUpperCase() + level.slice(1)} pathway! (Mock — no payment charged)`);
      await refreshProfile();
      // Show discount code modal after subscribing
      setShowDiscountModal(true);
    }
    setSubscribing(false);
  };

  const handleCancel = async () => {
    setSubscribing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ pathway_level: "none" })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      toast.success("Your subscription has been cancelled. (Mock — no real cancellation)");
      await refreshProfile();
    }
    setShowCancelConfirm(false);
    setSubscribing(false);
  };

  const handleOneOff = () => {
    navigate("/dashboard/explore");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Button variant="ghost" size="sm" className="font-body mb-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Choose Your Pathway</h1>
          <p className="font-body text-muted-foreground mt-1">
            Subscribe to unlock mentorship sessions, learning resources, and community features.
          </p>
          {currentLevel && currentLevel !== "none" && (
            <Badge variant="outline" className="font-body mt-2">
              Current: {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
            </Badge>
          )}
        </div>

        {/* Access Code Status */}
        {isActivated && !isCodeExpired && (
          <Card className="shadow-card border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-accent">Access Code Active</h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    You used your one-time access code <span className="font-mono font-semibold text-foreground">{codeUsed}</span> on{" "}
                    {new Date(activatedAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
                    This grants you full platform access on the <strong>Mentee</strong> pathway for <strong>6 months</strong>.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-body text-sm text-muted-foreground">
                      Expires {codeExpiry!.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · <strong className="text-foreground">{daysRemaining} days remaining</strong>
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    Your pathway is locked to Mentee while your code is active. You can cancel anytime, but you'll need a paid plan to regain access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isActivated && isCodeExpired && (
          <Card className="shadow-card border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-destructive">Access Code Expired</h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Your one-time access code <span className="font-mono font-semibold text-foreground">{codeUsed}</span> expired on{" "}
                    {codeExpiry!.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
                    Please subscribe to a paid plan below to continue accessing mentorship features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {plans.map((plan) => {
            const isActive = currentLevel === plan.level;
            const isLockedOther = isLockedToMentee && plan.level !== "mentee";
            return (
              <Card
                key={plan.level}
                className={`relative transition-all ${
                  plan.highlighted
                    ? "border-primary shadow-elevated"
                    : "shadow-card"
                } ${isActive ? "ring-2 ring-primary" : ""} ${
                  selectedPlan === plan.level ? "border-primary" : ""
                } ${isLockedOther ? "opacity-50" : ""}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-body font-semibold px-3 py-1 rounded-bl-md">
                    <Sparkles className="h-3 w-3 inline mr-1" /> Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-display text-xl font-bold text-accent">{plan.title}</h3>
                        {plan.subtitle && (
                          <span className="font-body text-sm text-primary">{plan.subtitle}</span>
                        )}
                        {isActive && <Badge className="font-body text-xs">Active</Badge>}
                      </div>
                      <p className="font-body text-sm text-muted-foreground mt-1">{plan.description}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 font-body text-sm text-foreground">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="mb-3">
                        <span className="font-bold text-3xl text-accent">{plan.price}</span>
                        <span className="font-body text-muted-foreground">{plan.period}</span>
                      </div>
                      <Button
                        variant={plan.highlighted ? "default" : "secondary"}
                        className="font-body w-full sm:w-auto"
                        disabled={subscribing || isActive || isLockedOther}
                        onClick={() => handleSubscribe(plan.level)}
                      >
                        {isActive ? "Current Plan" : isLockedOther ? "Locked" : "Subscribe"}
                      </Button>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {isLockedOther ? "Locked while access code is active" : "Cancel anytime"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* One-off option */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-accent">Prefer a One-Off Session?</h3>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Book a single mentorship session with any mentor for a flat fee.
                </p>
              </div>
              <Button variant="outline" className="font-body shrink-0" onClick={handleOneOff}>
                Browse Mentors — from $35
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancel subscription */}
        {hasActiveSubscription && (
          <Card className="shadow-card border-destructive/30">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-destructive">Cancel Subscription</h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    You'll lose access to your {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} pathway benefits at the end of your billing period.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="font-body shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel your subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body space-y-2">
              <p>
                You're about to cancel the <strong>{currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}</strong> pathway. You'll lose access to mentor sessions, courses, and community features at the end of your current billing period.
              </p>
              {isActivated && !isCodeExpired && (
                <p className="text-destructive font-semibold">
                  ⚠️ Your access code still has {daysRemaining} days remaining. If you cancel now, your code cannot be reused and you'll need to subscribe to a paid plan to regain access.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={subscribing}
              onClick={handleCancel}
            >
              {subscribing ? "Cancelling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiscountCodeModal
        open={showDiscountModal}
        onOpenChange={setShowDiscountModal}
        onActivated={() => window.location.reload()}
        onSkip={() => setShowDiscountModal(false)}
      />
    </DashboardLayout>
  );
};

export default Subscribe;
