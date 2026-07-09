/**
 * Purpose: Cancel booking page at /cancel/:token — shows booking details and cancel button
 * DB tables: bookings, profiles
 * Emails: booking-cancelled (via send-transactional-email)
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CalendarClock, Clock, User, Globe, AlertTriangle, Check, Loader2 } from "lucide-react";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function utcTimeToLocal(dateStr: string, utcTime: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

const CancelBooking = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [mentorName, setMentorName] = useState("");
  const [bookerName, setBookerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Find booking by cancel_token
      // @ts-ignore - cancel_token column added via migration
      const bookingResult = await supabase
        .from("bookings")
        .select("*")
        .eq("cancel_token", token)
        .maybeSingle();
      const data = bookingResult.data as any;
      const error = bookingResult.error;

      if (!data || error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if ((data as any).status === "cancelled") {
        setCancelled(true);
      }

      setBooking(data);

      // Names only — emails are resolved server-side by the cancel function.
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", [(data as any).mentor_id, (data as any).booker_id]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const mentor = profileMap.get((data as any).mentor_id);
      const booker = profileMap.get((data as any).booker_id);
      setMentorName(mentor?.full_name || "Mentor");
      setBookerName(booker?.full_name || "Mentee");

      setLoading(false);
    };
    load();
  }, [token]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);

    const { error } = await supabase.functions.invoke("cancel-booking-by-token", {
      body: { cancelToken: token },
    });
    if (error) {
      toast.error("Failed to cancel booking.");
      setCancelling(false);
      return;
    }
    setCancelled(true);
    setCancelling(false);
    toast.success("Booking cancelled.");
  };

  if (loading) {
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
          <h1 className="font-display text-2xl font-bold">Booking not found</h1>
          <p className="font-body text-muted-foreground">This cancel link is invalid or has expired.</p>
          <Button onClick={() => navigate("/")} className="font-body">Go home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-6">
          {cancelled ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-bold">Session Cancelled</h2>
              <p className="font-body text-muted-foreground">This session has been cancelled. Feel free to rebook.</p>
              <Button onClick={() => navigate("/")} className="font-body">Go home</Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <h2 className="font-display text-xl font-bold">Cancel Session?</h2>
                <p className="font-body text-sm text-muted-foreground">
                  Are you sure you want to cancel this session? Both parties will be notified.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="space-y-2 font-body text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mentor:</span>
                    <span className="font-medium">{mentorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mentee:</span>
                    <span className="font-medium">{bookerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(parseISO(booking.booking_date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{utcTimeToLocal(booking.booking_date, booking.start_time.slice(0, 5))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{booking.timezone || userTimezone}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="font-body flex-1" onClick={() => navigate("/")}>
                  Keep session
                </Button>
                <Button variant="destructive" className="font-body flex-1" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</> : "Cancel this session"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelBooking;
