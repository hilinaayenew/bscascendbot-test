/**
 * Purpose: Upcoming sessions widget for Dashboard, Home — shows next 7 days of bookings with countdown badges
 * DB tables: bookings, profiles
 * Emails: none
 */
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Clock, Globe, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInCalendarDays, differenceInHours } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function utcTimeToLocal(dateStr: string, utcTime: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

interface UpcomingSessionsProps {
  userId: string;
  showCancelButton?: boolean;
}

interface BookingWithProfile {
  id: string;
  mentor_id: string;
  booker_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  timezone: string | null;
  cancel_token?: string;
  partner_name: string;
  partner_avatar: string | null;
}

const UpcomingSessions = ({ userId, showCancelButton = false }: UpcomingSessionsProps) => {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcoming = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("bookings")
        .select("id, mentor_id, booker_id, booking_date, start_time, end_time, timezone, title, status, cancel_token")
        .eq("status", "confirmed")
        .gte("booking_date", today)
        .or(`mentor_id.eq.${userId},booker_id.eq.${userId}`)
        .order("booking_date", { ascending: true })
        .limit(10);

      if (data?.length) {
        const userIds = new Set<string>();
        data.forEach((b: any) => { userIds.add(b.mentor_id); userIds.add(b.booker_id); });
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", Array.from(userIds));
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setBookings(data.map((b: any) => {
          const isBooker = b.booker_id === userId;
          const partnerId = isBooker ? b.mentor_id : b.booker_id;
          const partner = profileMap.get(partnerId);
          return {
            ...b,
            partner_name: partner?.full_name || "Unknown",
            partner_avatar: partner?.avatar_url || null,
          };
        }));
      }
      setLoading(false);
    };
    fetchUpcoming();
  }, [userId]);

  if (loading) return null;
  if (bookings.length === 0) return null;

  const getCountdownBadge = (dateStr: string) => {
    const today = new Date();
    const bookingDate = parseISO(dateStr);
    const daysAway = differenceInCalendarDays(bookingDate, today);

    if (daysAway === 0) {
      return <Badge className="font-body text-[10px] bg-destructive text-destructive-foreground">Today</Badge>;
    }
    if (daysAway === 1) {
      return <Badge className="font-body text-[10px] bg-amber-500/80 text-primary-foreground">Tomorrow</Badge>;
    }
    if (daysAway <= 7) {
      return <Badge variant="secondary" className="font-body text-[10px]">In {daysAway} days</Badge>;
    }
    return null;
  };

  const handleCancel = async (booking: BookingWithProfile) => {
    if ((booking as any).cancel_token) {
      navigate(`/cancel/${(booking as any).cancel_token}`);
    } else {
      // Direct cancel
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      if (error) {
        toast.error("Failed to cancel.");
      } else {
        setBookings(prev => prev.filter(b => b.id !== booking.id));
        toast.success("Session cancelled.");
      }
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-body text-base flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Sessions
          </CardTitle>
          <button
            onClick={() => navigate("/dashboard/sessions")}
            className="font-body text-xs text-primary hover:underline"
          >
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {bookings.map(b => {
          // Check if > 1 hour away for cancel eligibility
          const [y, mo, d] = b.booking_date.split("-").map(Number);
          const [h, m] = b.start_time.slice(0, 5).split(":").map(Number);
          const sessionTime = new Date(Date.UTC(y, mo - 1, d, h, m));
          const hoursAway = differenceInHours(sessionTime, new Date());

          return (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Avatar className="h-9 w-9">
                <AvatarImage src={b.partner_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {b.partner_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium truncate">{b.partner_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-body text-xs text-muted-foreground">
                    {format(parseISO(b.booking_date), "EEE, MMM d")}
                  </span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">
                    {utcTimeToLocal(b.booking_date, b.start_time.slice(0, 5))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getCountdownBadge(b.booking_date)}
                {showCancelButton && hoursAway > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancel(b)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessions;
