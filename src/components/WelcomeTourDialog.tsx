/**
 * Purpose: First-run walkthrough modal + persistent "Tour" launcher.
 * Shows role-appropriate onboarding steps for mentee/mentor/employer.
 * Auto-opens once per user (tracked in localStorage); reopenable anytime
 * via the floating launcher rendered by <TourLauncher />.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import {
  WALKTHROUGHS,
  WALKTHROUGH_STORAGE_PREFIX,
  WalkthroughRole,
  getRoleForUser,
} from "@/lib/walkthroughContent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: WalkthroughRole;
};

export const WalkthroughDialog = ({ open, onOpenChange, role }: Props) => {
  const guide = WALKTHROUGHS[role];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, role]);

  const step = guide.steps[index];
  const Icon = step.icon;
  const isLast = index === guide.steps.length - 1;
  const progress = ((index + 1) / guide.steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-wide">
              Getting started · {guide.label}
            </span>
          </div>
          <DialogTitle className="font-display text-2xl">
            {index === 0 ? `Welcome to Ascendency` : step.title}
          </DialogTitle>
          <DialogDescription className="font-body">
            {index === 0 ? guide.intro : `Step ${index + 1} of ${guide.steps.length}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <p className="font-body font-semibold">{step.title}</p>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {step.body}
              </p>
              {step.href && step.cta && (
                <Link
                  to={step.href}
                  onClick={() => onOpenChange(false)}
                  className="font-body text-sm text-primary underline hover:no-underline inline-block mt-1"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="font-body"
          >
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="font-body"
            >
              Back
            </Button>
            {isLast ? (
              <Button size="sm" onClick={() => onOpenChange(false)} className="font-body">
                Finish
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIndex((i) => Math.min(guide.steps.length - 1, i + 1))}
                className="font-body"
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TourLauncher = ({ role: roleOverride }: { role?: WalkthroughRole } = {}) => {
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const role = useMemo<WalkthroughRole>(
    () => roleOverride ?? getRoleForUser(roles),
    [roleOverride, roles],
  );

  // First-run auto open
  useEffect(() => {
    if (!user) return;
    const key = `${WALKTHROUGH_STORAGE_PREFIX}${role}_${user.id}`;
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(key)) {
      setOpen(true);
      window.localStorage.setItem(key, new Date().toISOString());
    }
  }, [user, role]);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity px-4 py-2.5 font-body text-sm"
        aria-label="Open getting-started tour"
      >
        <Sparkles className="h-4 w-4" />
        Tour
      </button>
      <WalkthroughDialog open={open} onOpenChange={setOpen} role={role} />
    </>
  );
};

export default TourLauncher;