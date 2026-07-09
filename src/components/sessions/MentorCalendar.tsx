/**
 * Purpose: Mentor's monthly calendar view showing booked/available/blocked slots with side panel
 * DB tables: bookings, mentor_availability, mentor_blocked_dates, profiles, booking_slots
 * Emails: none
 */
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarClock, Clock, User, Globe, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function utcTimeToLocal(dateStr: string, utcTime: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

interface MentorCalendarProps {
  userId: string;
}

interface BookingEntry {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  booker_id: string;
  booker_name: string;
  booker_avatar: string | null;
  cancel_token?: string;
}

const MentorCalendar = ({ userId }: MentorCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<BookingEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const [{ data: avail }, { data: blocked }, { data: bookingData }] = await Promise.all([
        supabase.from("mentor_availability").select("day_of_week").eq("mentor_id", userId),
        supabase.from("mentor_blocked_dates").select("blocked_date").eq("mentor_id", userId),
        supabase
          .from("bookings")
          .select("id, booking_date, start_time, end_time, notes, booker_id, cancel_token")
          .eq("mentor_id", userId)
          .eq("status", "confirmed")
          .gte("booking_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
      ]);

      setAvailableDays(new Set((avail || []).map((a: any) => a.day_of_week)));
      setBlockedDates(new Set((blocked || []).map((b: any) => b.blocked_date)));

      if (bookingData?.length) {
        const bookerIds = [...new Set(bookingData.map((b: any) => b.booker_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", bookerIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setBookings(bookingData.map((b: any) => ({
          id: b.id,
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          notes: b.notes,
          booker_id: b.booker_id,
          cancel_token: (b as any).cancel_token,
          booker_name: profileMap.get(b.booker_id)?.full_name || "Unknown",
          booker_avatar: profileMap.get(b.booker_id)?.avatar_url || null,
        })));
      }
    };
    fetch();
  }, [userId]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingEntry[]>();
    bookings.forEach(b => {
      const key = b.booking_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [bookings]);

  const getDayStyle = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const hasBookings = bookingsByDate.has(dateStr);
    const isBlocked = blockedDates.has(dateStr);
    const isAvailable = availableDays.has(date.getDay());

    if (isBlocked) return "!bg-muted !text-muted-foreground";
    if (hasBookings) return "!bg-primary/20 !text-primary font-semibold";
    if (isAvailable) return "!bg-primary/5 !text-primary/70";
    return "";
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayBookings = bookingsByDate.get(dateStr) || [];
    if (dayBookings.length === 1) {
      setSelectedBooking(dayBookings[0]);
      setSheetOpen(true);
    }
  };

  const handleCancelBooking = async (booking: BookingEntry) => {
    if (booking.cancel_token) {
      navigate(`/cancel/${booking.cancel_token}`);
    }
  };

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedDayBookings = bookingsByDate.get(selectedDateStr) || [];
  const selectedDateIsBlocked = blockedDates.has(selectedDateStr);
  const selectedDateIsAvailable = selectedDate ? availableDays.has(selectedDate.getDay()) : false;

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-body text-base flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              My Calendar
            </CardTitle>
            <div className="flex items-center gap-3 font-body text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/20 inline-block" /> Booked</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/5 border inline-block" /> Available</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted inline-block" /> Blocked</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              booked: (date) => bookingsByDate.has(format(date, "yyyy-MM-dd")),
              blocked: (date) => blockedDates.has(format(date, "yyyy-MM-dd")),
              available: (date) => availableDays.has(date.getDay()) && !blockedDates.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              booked: "!bg-primary/20 !text-primary font-semibold",
              blocked: "!bg-muted !text-muted-foreground",
              available: "!bg-primary/5",
            }}
          />
        </CardContent>
      </Card>

      {/* Selected date details */}
      {selectedDate && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-body text-sm">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedDateIsBlocked && (
              <p className="font-body text-sm text-muted-foreground">This date is blocked.</p>
            )}
            {!selectedDateIsBlocked && !selectedDateIsAvailable && selectedDayBookings.length === 0 && (
              <p className="font-body text-sm text-muted-foreground">Not available on this day.</p>
            )}
            {selectedDateIsAvailable && selectedDayBookings.length === 0 && (
              <p className="font-body text-sm text-muted-foreground">Available — no bookings yet.</p>
            )}
            {selectedDayBookings.map(b => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => { setSelectedBooking(b); setSheetOpen(true); }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={b.booker_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {b.booker_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">{b.booker_name}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-body text-xs text-muted-foreground">
                      {utcTimeToLocal(b.booking_date, b.start_time.slice(0, 5))}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-body text-xs">Booked</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Side panel for booking details */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-lg">Session Details</SheetTitle>
          </SheetHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedBooking.booker_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedBooking.booker_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-body font-medium">{selectedBooking.booker_name}</p>
                  <p className="font-body text-xs text-muted-foreground">Mentee</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="space-y-2 font-body text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(parseISO(selectedBooking.booking_date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{utcTimeToLocal(selectedBooking.booking_date, selectedBooking.start_time.slice(0, 5))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{userTimezone}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="font-body text-sm font-medium mb-1">Session Notes</p>
                  <p className="font-body text-sm text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.cancel_token && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-body w-full"
                  onClick={() => handleCancelBooking(selectedBooking)}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel Session
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MentorCalendar;
