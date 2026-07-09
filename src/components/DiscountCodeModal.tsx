import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, Check, X, Loader2 } from "lucide-react";

interface DiscountCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated?: () => void;
  onSkip?: () => void;
}

const DiscountCodeModal = ({ open, onOpenChange, onActivated, onSkip }: DiscountCodeModalProps) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid" | "claimed" | "exhausted">("idle");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!code.trim()) {
      setStatus("idle");
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(async () => {
      await validateAndRedeem(code.trim().toUpperCase());
    }, 600);

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [code]);

  const validateAndRedeem = async (inputCode: string) => {
    if (!user) return;
    setStatus("checking");

    const { data, error } = await supabase.rpc("redeem_discount_code", { p_code: inputCode });

    if (error) {
      setStatus("invalid");
      return;
    }

    const result = data as { status: string };
    switch (result?.status) {
      case "valid":
      case "already_active":
        setStatus("valid");
        setTimeout(() => {
          onActivated?.();
          onOpenChange(false);
        }, 1200);
        break;
      case "claimed":
        setStatus("claimed");
        break;
      case "exhausted":
        setStatus("exhausted");
        break;
      default:
        setStatus("invalid");
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onOpenChange(false);
  };

  const statusMessage = () => {
    switch (status) {
      case "checking":
        return (
          <div className="flex items-center gap-2 text-muted-foreground font-body text-sm mt-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking code…
          </div>
        );
      case "valid":
        return (
          <div className="flex items-center gap-2 text-primary font-body text-sm mt-2">
            <Check className="h-4 w-4" /> Code accepted! Full access unlocked.
          </div>
        );
      case "invalid":
        return (
          <div className="flex items-center gap-2 text-destructive font-body text-sm mt-2">
            <X className="h-4 w-4" /> Invalid code. Please check and try again.
          </div>
        );
      case "claimed":
        return (
          <div className="flex items-center gap-2 text-destructive font-body text-sm mt-2">
            <X className="h-4 w-4" /> This code has already been used.
          </div>
        );
      case "exhausted":
        return (
          <div className="flex items-center gap-2 text-destructive font-body text-sm mt-2">
            <X className="h-4 w-4" /> All access codes have been claimed.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="h-5 w-5 text-primary" />
            <DialogTitle className="font-display text-xl">Enter Access Code</DialogTitle>
          </div>
          <DialogDescription className="font-body">
            A discount code is required to unlock full mentorship access — including pairing with mentors, booking sessions, and direct messaging. A limited number of codes are available for this launch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ASCEND-2025-ABC"
            className="font-body text-center tracking-widest text-lg"
            maxLength={30}
            autoFocus
          />
          {statusMessage()}

          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full font-body text-muted-foreground"
              onClick={handleSkip}
            >
              Continue without a code — you can enter one later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountCodeModal;
