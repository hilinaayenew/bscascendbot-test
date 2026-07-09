import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ChevronLeft, Clock, Globe, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BlockedDate {
  blocked_date: string;
}

interface ExistingBooking {
  booking_date: string;
  start_time: string;
  end_time: string;
}

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Convert a UTC time string (HH:MM) on a given date to user's local time
function utcTimeToLocal(date: Date, utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

// Convert local time selection back to UTC for storage
function localTimeToUtc(date: Date, localTime: string): string {
  // localTime is in HH:MM (24h) format from slot generation
  const [h, m] = localTime.split(":").map(Number);
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
  return `${String(localDate.getUTCHours()).padStart(2, "0")}:${String(localDate.getUTCMinutes()).padStart(2, "0")}`;
}

// Generate 30-min time slots between start and end
function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + 30 <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += 30;
  }
  return slots;
}

const BookingCalendarDialog = ({ open, onOpenChange, mentorId, mentorName }: BookingCalendarDialogProps) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"calendar" | "time" | "confirm">("calendar");

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const [{ data: avail }, { data: blocked }, { data: bookings }] = await Promise.all([
        supabase.from("mentor_availability").select("day_of_week, start_time, end_time").eq("mentor_id", mentorId),
        supabase.from("mentor_blocked_dates").select("blocked_date").eq("mentor_id", mentorId),
        supabase.from("bookings").select("booking_date, start_time, end_time").eq("mentor_id", mentorId).eq("status", "confirmed"),
      ]);
      setAvailability((avail as AvailabilitySlot[]) || []);
      setBlockedDates((blocked as BlockedDate[]) || []);
      setExistingBookings((bookings as ExistingBooking[]) || []);
    };
    fetch();
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setNotes("");
    setStep("calendar");
  }, [open, mentorId]);

  // Realtime subscription on bookings was removed for security; existing bookings
  // are refetched each time the dialog opens.

  const availableDaysOfWeek = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);
  const blockedDateSet = useMemo(() => new Set(blockedDates.map(b => b.blocked_date)), [blockedDates]);

  const isDateAvailable = (date: Date) => {
    if (date < startOfDay(new Date())) return false;
    const dayOfWeek = date.getDay();
    if (!availableDaysOfWeek.has(dayOfWeek)) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    if (blockedDateSet.has(dateStr)) return false;
    return true;
  };

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const daySlots = availability.filter(a => a.day_of_week === dayOfWeek);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const bookedOnDate = existingBookings.filter(b => b.booking_date === dateStr);

    const allSlots: string[] = [];
    daySlots.forEach(ds => {
      const slots = generateSlots(ds.start_time.slice(0, 5), ds.end_time.slice(0, 5));
      allSlots.push(...slots);
    });

    // Filter out booked slots
    return allSlots.filter(slot => {
      const slotMinutes = parseInt(slot.split(":")[0]) * 60 + parseInt(slot.split(":")[1]);
      const slotEnd = slotMinutes + 30;
      return !bookedOnDate.some(b => {
        const bStart = parseInt(b.start_time.split(":")[0]) * 60 + parseInt(b.start_time.split(":")[1]);
        const bEnd = parseInt(b.end_time.split(":")[0]) * 60 + parseInt(b.end_time.split(":")[1]);
        return slotMinutes < bEnd && slotEnd > bStart;
      });
    });
  }, [selectedDate, availability, existingBookings]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("time");
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      setSubmitting(false);
      return;
    }

    // Verify access
    const [{ data: mentorCheck }, { data: codeCheck }] = await Promise.all([
      supabase.from("mentor_details").select("id").eq("user_id", user.id).eq("approval_status", "approved").maybeSingle(),
      supabase.from("discount_codes").select("id").eq("redeemed_by", user.id).limit(1).maybeSingle(),
    ]);

    if (!mentorCheck && !codeCheck) {
      toast.error("You don't have access to book sessions.");
      setSubmitting(false);
      return;
    }

    const bookingDate = format(selectedDate, "yyyy-MM-dd");
    const [sh, sm] = selectedSlot.split(":").map(Number);
    const endMinutes = sh * 60 + sm + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const bookingId = crypto.randomUUID();
    const { error } = await supabase.from("bookings").insert({
      id: bookingId,
      mentor_id: mentorId,
      booker_id: user.id,
      booking_date: bookingDate,
      start_time: selectedSlot,
      end_time: endTime,
      notes: notes || null,
      timezone: userTimezone,
    });

    if (error) {
      toast.error("Failed to book session. Please try again.");
      setSubmitting(false);
      return;
    }

    // Server-side: validates participation, resolves recipients, sends both emails.
    await supabase.functions.invoke("dispatch-booking-emails", {
      body: { bookingId, flow: "confirm" },
    });

    toast.success(`Session booked with ${mentorName}!`);
    setSubmitting(false);
    onOpenChange(false);
  };

  const hasAvailability = availability.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-5 w-5 text-primary" />
            <DialogTitle className="font-display text-lg">Book a Session</DialogTitle>
          </div>
          <DialogDescription className="font-body">
            {hasAvailability
              ? `Schedule a one-on-one session with ${mentorName}.`
              : `${mentorName} hasn't set their availability yet. Check back later.`}
          </DialogDescription>
        </DialogHeader>

        {!hasAvailability ? (
          <div className="py-8 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">No available times right now.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
              <span className={cn(step === "calendar" && "text-primary font-medium")}>1. Date</span>
              <span>→</span>
              <span className={cn(step === "time" && "text-primary font-medium")}>2. Time</span>
              <span>→</span>
              <span className={cn(step === "confirm" && "text-primary font-medium")}>3. Confirm</span>
            </div>

            {step === "calendar" && (
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => !isDateAvailable(date)}
                  className={cn("p-3 pointer-events-auto mx-auto")}
                  modifiers={{ available: (date) => isDateAvailable(date) }}
                  modifiersClassNames={{ available: "!bg-primary/10 !text-primary font-semibold hover:!bg-primary/20" }}
                />
                <div className="flex items-center gap-1 mt-2 font-body text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  Times shown in {userTimezone}
                </div>
              </div>
            )}

            {step === "time" && selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep("calendar")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-body text-sm font-medium">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground text-center py-4">
                    No available slots on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        size="sm"
                        className="font-body text-sm"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {utcTimeToLocal(selectedDate, slot)}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {userTimezone}
                </div>
              </div>
            )}

            {step === "confirm" && selectedDate && selectedSlot && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setStep("time")}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-body font-semibold text-sm">Booking Summary</h3>
                  <div className="space-y-2 font-body text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Mentor:</span>
                      <span className="font-medium">{mentorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{utcTimeToLocal(selectedDate, selectedSlot)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Timezone:</span>
                      <span className="font-medium">{userTimezone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-body text-xs">One-on-one</Badge>
                    </div>
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

                <Button className="font-body w-full" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingCalendarDialog;
