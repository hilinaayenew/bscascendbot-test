/**
 * Purpose: '?' icon trigger that opens a side sheet with the same help content as /dashboard/help.
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import HelpContent from "./HelpContent";

const HelpSheet = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open help" className="text-foreground/70 hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Help Center</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <HelpContent compact />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HelpSheet;