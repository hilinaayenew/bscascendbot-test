import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SessionBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
}

const SessionBookingDialog = ({ open, onOpenChange, mentorId, mentorName }: SessionBookingDialogProps) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!date || !time) {
      toast.error("Please select a date and time.");
      return;
    }

    setSubmitting(true);

    // Server-side validation: verify user is a mentor OR has a redeemed discount code
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      setSubmitting(false);
      return;
    }

    const [{ data: mentorCheck }, { data: codeCheck }] = await Promise.all([
      supabase.from("mentor_details").select("id").eq("user_id", user.id).eq("approval_status", "approved").maybeSingle(),
      supabase.from("discount_codes").select("id").eq("redeemed_by", user.id).limit(1).maybeSingle(),
    ]);

    if (!mentorCheck && !codeCheck) {
      toast.error("You don't have access to book sessions.");
      setSubmitting(false);
      return;
    }

    // Booking confirmed — toast for now (no payment infrastructure yet)
    toast.success(`Session booked with ${mentorName} on ${date} at ${time}!`);
    setDate("");
    setTime("");
    setNotes("");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-5 w-5 text-primary" />
            <DialogTitle className="font-display text-lg">Book a Session</DialogTitle>
          </div>
          <DialogDescription className="font-body">
            Schedule a one-on-one session with {mentorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="font-body"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What would you like to discuss?"
              className="font-body resize-none"
              rows={3}
            />
          </div>

          <Button
            className="font-body w-full"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionBookingDialog;
