import { useActivation } from "@/hooks/useActivation";
import { useAuth } from "@/hooks/useAuth";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import DiscountCodeModal from "@/components/DiscountCodeModal";

const ActivationBanner = () => {
  const { roles } = useAuth();
  const { isActivated, loading } = useActivation();
  const [showModal, setShowModal] = useState(false);

  const isMentee = roles.includes("mentee");

  if (!isMentee || loading || isActivated) return null;

  return (
    <>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
        <Ticket className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-foreground">
            <span className="font-semibold">Unlock full mentee access</span> — enter your discount code to pair with mentors, book sessions, and message them directly.
          </p>
        </div>
        <Button size="sm" variant="outline" className="font-body shrink-0" onClick={() => setShowModal(true)}>
          Enter Code
        </Button>
      </div>

      <DiscountCodeModal
        open={showModal}
        onOpenChange={setShowModal}
        onActivated={() => window.location.reload()}
      />
    </>
  );
};

export default ActivationBanner;
