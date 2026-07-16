/**
 * Persistent nudge on the dashboard showing profile completion progress.
 * Hides once the profile hits 100%.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UserCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { profileChecks, profileStrength } from "@/lib/profileStrength";

export default function ProfileStrengthCard() {
  const { profile } = useAuth();
  if (!profile) return null;
  const strength = profileStrength(profile as any);
  if (strength >= 100) return null;
  const missing = profileChecks(profile as any).filter((c) => !c.done).slice(0, 3);

  return (
    <Card className="shadow-card border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-10 w-10 rounded-full bg-primary/10 items-center justify-center shrink-0">
            <UserCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <p className="font-body text-sm font-semibold text-foreground">
                Complete your profile
              </p>
              <span className="font-body text-xs font-bold text-primary">{strength}%</span>
            </div>
            <Progress value={strength} className="h-2" />
            {missing.length > 0 && (
              <p className="font-body text-xs text-muted-foreground mt-2">
                Next up: {missing.map((m) => m.label.toLowerCase()).join(" • ")}
              </p>
            )}
            <div className="mt-3">
              <Button asChild size="sm" variant="outline" className="font-body">
                <Link to="/dashboard/settings">
                  Continue setup <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}