import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Ticket } from "lucide-react";
import { useState } from "react";
import DiscountCodeModal from "@/components/DiscountCodeModal";

interface LockedFeaturePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const LockedFeaturePrompt = ({ open, onOpenChange, feature = "this feature" }: LockedFeaturePromptProps) => {
  const [showCodeModal, setShowCodeModal] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="font-display text-lg">Access Code Required</DialogTitle>
            </div>
            <DialogDescription className="font-body">
              To {feature}, you need a valid discount code. Only 100 codes are available for this launch — enter yours to unlock full mentor access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              className="font-body w-full"
              onClick={() => {
                onOpenChange(false);
                setShowCodeModal(true);
              }}
            >
              <Ticket className="h-4 w-4 mr-2" />
              Enter Access Code
            </Button>
            <Button variant="ghost" className="font-body w-full" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DiscountCodeModal
        open={showCodeModal}
        onOpenChange={setShowCodeModal}
        onActivated={() => window.location.reload()}
      />
    </>
  );
};

export default LockedFeaturePrompt;
