/**
 * Purpose: Public booking page at /book/:username — Calendly-style two-panel layout
 * DB tables: profiles, mentor_availability, mentor_booking_settings, mentor_blocked_dates, bookings, booking_slots
 * Emails: booking-confirmation-mentor, booking-confirmation-booker (via send-transactional-email)
 */
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format, startOfDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Globe, ChevronLeft, CalendarClock, User, Check, Loader2 } from "lucide-react";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function utcTimeToLocal(date: Date, utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

function generateSlots(startTime: string, endTime: string, durationMin: number, bufferMin: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + durationMin <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += durationMin + bufferMin;
  }
  return slots;
}

interface MentorData {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const BookMentor = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [existingBookings, setExistingBookings] = useState<{ booking_date: string; start_time: string; end_time: string }[]>([]);
  const [bookingSettings, setBookingSettings] = useState({ session_duration: 30, buffer_minutes: 0, max_bookings_per_day: 4, minimum_notice: "1 day" });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [step, setStep] = useState<"calendar" | "time" | "confirm" | "done">("calendar");
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Gate: visitors must sign in/up first, then we send them to the
      // mentor's profile page (booking happens from the profile flow).
      if (!user) {
        navigate(`/auth?next=/book/${username}`, { replace: true });
        return;
      }

      // Find mentor by username
      // @ts-ignore - username column added via migration
      const profileResult = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, bio")
        .eq("username", username)
        .maybeSingle();
      const profileData = profileResult.data as any;

      if (!profileData) {
        setNotFound(true);
        setPageLoading(false);
        return;
      }

      // Signed-in visitors are sent straight to the mentor's profile page.
      navigate(`/dashboard/profile/${profileData.user_id}`, { replace: true });
    };
    load();
  }, [username, navigate]);

  const getMinDate = () => {
    const now = new Date();
    switch (bookingSettings.minimum_notice) {
      case "same day": return startOfDay(now);
      case "1 day": return startOfDay(addDays(now, 1));
      case "2 days": return startOfDay(addDays(now, 2));
      case "1 week": return startOfDay(addDays(now, 7));
      default: return startOfDay(addDays(now, 1));
    }
  };

  const availableDaysOfWeek = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  const isDateAvailable = (date: Date) => {
    if (date < getMinDate()) return false;
    if (!availableDaysOfWeek.has(date.getDay())) return false;
    if (blockedDates.has(format(date, "yyyy-MM-dd"))) return false;
    // Check max bookings per day
    const dateStr = format(date, "yyyy-MM-dd");
    const bookingsOnDate = existingBookings.filter(b => b.booking_date === dateStr).length;
    if (bookingsOnDate >= bookingSettings.max_bookings_per_day) return false;
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
      const slots = generateSlots(ds.start_time.slice(0, 5), ds.end_time.slice(0, 5), bookingSettings.session_duration, bookingSettings.buffer_minutes);
      allSlots.push(...slots);
    });

    return allSlots.filter(slot => {
      const slotMinutes = parseInt(slot.split(":")[0]) * 60 + parseInt(slot.split(":")[1]);
      const slotEnd = slotMinutes + bookingSettings.session_duration;
      return !bookedOnDate.some(b => {
        const bStart = parseInt(b.start_time.split(":")[0]) * 60 + parseInt(b.start_time.split(":")[1]);
        const bEnd = parseInt(b.end_time.split(":")[0]) * 60 + parseInt(b.end_time.split(":")[1]);
        return slotMinutes < bEnd && slotEnd > bStart;
      });
    });
  }, [selectedDate, availability, existingBookings, bookingSettings]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot || !mentor) return;
    if (!guestName.trim() || !guestEmail.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }

    // Must be logged in to confirm
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to confirm your booking.");
      navigate(`/mentee-auth?redirect=/book/${username}`);
      return;
    }

    setSubmitting(true);

    const bookingDate = format(selectedDate, "yyyy-MM-dd");
    const [sh, sm] = selectedSlot.split(":").map(Number);
    const endMinutes = sh * 60 + sm + bookingSettings.session_duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const bookingId = crypto.randomUUID();
    const { error } = await supabase.from("bookings").insert({
      id: bookingId,
      mentor_id: mentor.user_id,
      booker_id: user.id,
      booking_date: bookingDate,
      start_time: selectedSlot,
      end_time: endTime,
      notes: notes || null,
      timezone: userTimezone,
      title: "Mentorship session",
    } as any);

    if (error) {
      toast.error("Failed to book session. Please try again.");
      setSubmitting(false);
      return;
    }

    // Send confirmation emails
    const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");
    const formattedTime = utcTimeToLocal(selectedDate, selectedSlot);

    await Promise.all([
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "booking-confirmation-mentor",
          recipientEmail: mentor.email,
          idempotencyKey: `booking-mentor-${bookingId}`,
          templateData: {
            mentorName: mentor.full_name,
            bookerName: guestName,
            date: formattedDate,
            time: formattedTime,
            timezone: userTimezone,
            cancelLink: `${window.location.origin}/cancel/${bookingId}`,
          },
        },
      }),
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "booking-confirmation-booker",
          recipientEmail: guestEmail,
          idempotencyKey: `booking-booker-${bookingId}`,
          templateData: {
            bookerName: guestName,
            mentorName: mentor.full_name,
            date: formattedDate,
            time: formattedTime,
            timezone: userTimezone,
            cancelLink: `${window.location.origin}/cancel/${bookingId}`,
          },
        },
      }),
    ]);

    setStep("done");
    setSubmitting(false);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="font-display text-2xl font-bold">Page not found</h1>
          <p className="font-body text-muted-foreground">This booking page doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="font-body">Go home</Button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">Session booked!</h2>
            <p className="font-body text-muted-foreground">
              Your session with {mentor?.full_name} on {selectedDate && format(selectedDate, "EEEE, MMMM d")} is confirmed.
              A confirmation email has been sent.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/dashboard/sessions")} className="font-body">
                View my sessions
              </Button>
              <Button variant="outline" onClick={() => { setStep("calendar"); setSelectedDate(undefined); setSelectedSlot(null); }} className="font-body">
                Book another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* LEFT PANEL — Mentor Info */}
          <Card className="h-fit">
            <CardContent className="p-6 space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={mentor?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {mentor?.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="font-display text-lg font-bold">{mentor?.full_name}</h2>
                {mentor?.bio && (
                  <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-3">{mentor.bio}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="font-body">
                  <Clock className="h-3 w-3 mr-1" /> {bookingSettings.session_duration} min
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="font-body text-xs">{userTimezone}</span>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT PANEL — Calendar + Slots */}
          <Card>
            <CardContent className="p-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2 font-body text-xs text-muted-foreground mb-4">
                <span className={cn(step === "calendar" && "text-primary font-medium")}>1. Date</span>
                <span>→</span>
                <span className={cn(step === "time" && "text-primary font-medium")}>2. Time</span>
                <span>→</span>
                <span className={cn(step === "confirm" && "text-primary font-medium")}>3. Confirm</span>
              </div>

              {step === "calendar" && (
                <div>
                  {availability.length === 0 ? (
                    <div className="py-8 text-center">
                      <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-body text-sm text-muted-foreground">No available times right now.</p>
                    </div>
                  ) : (
                    <>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => { if (d && isDateAvailable(d)) { setSelectedDate(d); setSelectedSlot(null); setStep("time"); } }}
                        disabled={(date) => !isDateAvailable(date)}
                        className={cn("p-3 pointer-events-auto mx-auto")}
                        modifiers={{ available: (date) => isDateAvailable(date) }}
                        modifiersClassNames={{ available: "!bg-primary/10 !text-primary font-semibold hover:!bg-primary/20" }}
                      />
                      <div className="flex items-center gap-1 mt-2 font-body text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        Times shown in {userTimezone}
                      </div>
                    </>
                  )}
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
                    <p className="font-body text-sm text-muted-foreground text-center py-4">No available slots on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                      {availableSlots.map(slot => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          size="sm"
                          className="font-body text-sm"
                          onClick={() => { setSelectedSlot(slot); setStep("confirm"); }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {utcTimeToLocal(selectedDate, slot)}
                        </Button>
                      ))}
                    </div>
                  )}
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
                        <span className="font-medium">{mentor?.full_name}</span>
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
                        <Badge variant="secondary" className="font-body text-xs">{bookingSettings.session_duration} min</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!currentUser && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="font-body text-sm">Your Name *</Label>
                          <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name" className="font-body" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-body text-sm">Your Email *</Label>
                          <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="email@example.com" className="font-body" type="email" />
                        </div>
                      </>
                    )}
                    <div className="space-y-1.5">
                      <Label className="font-body text-sm">Notes (optional)</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What would you like to discuss?" className="font-body resize-none" rows={3} />
                    </div>
                  </div>

                  <Button className="font-body w-full" onClick={handleConfirm} disabled={submitting}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</> : "Confirm Booking"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookMentor;
