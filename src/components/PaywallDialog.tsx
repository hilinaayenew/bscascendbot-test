import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  type?: "pathway" | "session";
  mentorOnly?: boolean;
}

const pathways = [
  {
    level: "curious",
    title: "Curious",
    subtitle: "Foundation Builder",
    price: "$1/mo",
    features: ["Vetted mentor directory", "On-demand masterclasses", "Monthly technical workshops"],
  },
  {
    level: "mentee",
    title: "Mentee",
    subtitle: "Acceleration",
    price: "$10/mo",
    features: ["Monthly 1:1 mentor meetings", "Leadership workshops", "Featured marketplace listing"],
    highlighted: true,
  },
  {
    level: "apprentsis",
    title: "ApprentSis",
    subtitle: "Career Launchpad",
    price: "$25/mo",
    features: ["Bloom & Build Brunches", "Networking opportunities", "Placement support"],
  },
];

const PaywallDialog = ({ open, onOpenChange, feature = "this feature", type = "pathway", mentorOnly = false }: PaywallDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-5 w-5 text-primary" />
            <DialogTitle className="font-display text-xl">
              {mentorOnly ? "Book a Session" : "Upgrade to Access"}
            </DialogTitle>
          </div>
          <DialogDescription className="font-body">
            {mentorOnly
              ? "Book a one-off mentorship session with this mentor."
              : type === "session"
                ? "Book a one-off mentorship session or subscribe to a pathway for better value."
                : `A subscription is required to access ${feature}. Choose a pathway that fits your journey.`}
          </DialogDescription>
        </DialogHeader>

        {!mentorOnly && (
          <div className="space-y-3 mt-2">
            {pathways.map((p) => (
              <div
                key={p.level}
                className={`relative rounded-lg border p-4 transition-all ${
                  p.highlighted
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border bg-card"
                }`}
              >
                {p.highlighted && (
                  <Badge className="absolute -top-2.5 right-3 font-body text-xs">
                    <Sparkles className="h-3 w-3 mr-1" /> Most Popular
                  </Badge>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-foreground">{p.title}</h4>
                      <span className="font-body text-xs text-primary">{p.subtitle}</span>
                    </div>
                    <span className="font-body text-sm font-semibold text-primary">{p.price}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={p.highlighted ? "default" : "outline"}
                    className="font-body"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/dashboard/subscribe?plan=${p.level}`);
                    }}
                  >
                    Choose
                  </Button>
                </div>
                <ul className="mt-2 space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(type === "session" || mentorOnly) && (
          <div className={`${mentorOnly ? "mt-2" : "mt-3"} rounded-lg border border-border p-4 bg-card`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-foreground">One-Off Session</h4>
                <span className="font-body text-sm text-muted-foreground">From $35 per session</span>
              </div>
              <Button
                size="sm"
                variant={mentorOnly ? "default" : "secondary"}
                className="font-body"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/dashboard/subscribe?plan=one-off");
                }}
              >
                Book
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaywallDialog;
