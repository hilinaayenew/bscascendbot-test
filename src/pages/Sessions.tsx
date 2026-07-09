import { useAuth } from "@/hooks/useAuth";
import MentorCalendar from "@/components/sessions/MentorCalendar";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar, Clock, Users, BarChart3, Globe, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, parseISO, differenceInCalendarDays } from "date-fns";
import UpcomingWorkshopsWidget from "@/components/dashboard/UpcomingWorkshopsWidget";
import MentorBookingSettings from "@/components/settings/MentorBookingSettings";

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function utcTimeToLocal(dateStr: string, utcTime: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = utcTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: userTimezone });
}

interface Booking {
  id: string;
  mentor_id: string;
  booker_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  timezone: string | null;
  created_at: string;
  mentor_name?: string;
  mentor_avatar?: string;
  booker_name?: string;
  booker_avatar?: string;
}

interface PairingOption {
  id: string;
  partner_name: string;
}

interface SessionEntry {
  id: string;
  pairing_id: string;
  logged_by: string;
  session_date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  partner_name?: string;
}

const Sessions = () => {
  const { user, roles, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pairings, setPairings] = useState<PairingOption[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [selectedPairing, setSelectedPairing] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const isMentor = roles.includes("mentor");

  // Fetch bookings
  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .order("booking_date", { ascending: true });

      if (data?.length) {
        const userIds = new Set<string>();
        data.forEach((b: any) => { userIds.add(b.mentor_id); userIds.add(b.booker_id); });
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", Array.from(userIds));

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setBookings(data.map((b: any) => ({
          ...b,
          mentor_name: profileMap.get(b.mentor_id)?.full_name || "Unknown",
          mentor_avatar: profileMap.get(b.mentor_id)?.avatar_url || null,
          booker_name: profileMap.get(b.booker_id)?.full_name || "Unknown",
          booker_avatar: profileMap.get(b.booker_id)?.avatar_url || null,
        })));
      }
    };
    fetchBookings();
  }, [user]);

  // Realtime bookings subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`${user.id}-bookings`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, async (payload) => {
        const b = payload.new as any;
        if (b.mentor_id !== user.id && b.booker_id !== user.id) return;
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", [b.mentor_id, b.booker_id]);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setBookings(prev => [...prev, {
          ...b,
          mentor_name: profileMap.get(b.mentor_id)?.full_name || "Unknown",
          mentor_avatar: profileMap.get(b.mentor_id)?.avatar_url || null,
          booker_name: profileMap.get(b.booker_id)?.full_name || "Unknown",
          booker_avatar: profileMap.get(b.booker_id)?.avatar_url || null,
        }].sort((a, b) => a.booking_date.localeCompare(b.booking_date)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Fetch session logs (existing behavior)
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const col = isMentor ? "mentor_id" : "mentee_id";
      const { data: pairingData } = await supabase
        .from("pairings")
        .select("*")
        .eq(col, user.id)
        .eq("status", "active");

      if (pairingData?.length) {
        const partnerIds = pairingData.map((p) => isMentor ? p.mentee_id : p.mentor_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", partnerIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

        const pairingOptions = pairingData.map((p) => ({
          id: p.id,
          partner_name: profileMap.get(isMentor ? p.mentee_id : p.mentor_id) || "Unknown",
        }));
        setPairings(pairingOptions);

        const pairingNameMap = new Map(pairingOptions.map((p) => [p.id, p.partner_name]));
        const pairingIds = pairingData.map((p) => p.id);
        const { data: sessionData } = await supabase
          .from("session_logs")
          .select("*")
          .in("pairing_id", pairingIds)
          .order("session_date", { ascending: false });

        setSessions(
          (sessionData || []).map((s) => ({
            ...s,
            partner_name: pairingNameMap.get(s.pairing_id) || "Unknown",
          }))
        );
      } else {
        setPairings([]);
        setSessions([]);
      }
    };
    fetchData();
  }, [user, roles]);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const upcoming = bookings.filter(b => b.booking_date >= today);
    const past = bookings.filter(b => b.booking_date < today);
    return { upcomingBookings: upcoming, pastBookings: past.reverse() };
  }, [bookings]);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const activePairings = pairings.length;
    return { totalSessions, totalHours, activePairings, upcomingCount: upcomingBookings.length };
  }, [sessions, pairings, upcomingBookings]);

  const logSession = async () => {
    if (!selectedPairing || !user) return;
    const { error } = await supabase.from("session_logs").insert({
      pairing_id: selectedPairing,
      logged_by: user.id,
      session_date: sessionDate,
      duration_minutes: duration ? parseInt(duration) : null,
      notes: notes || null,
    });
    if (error) toast.error("Failed to log session.");
    else {
      const partnerName = pairings.find((p) => p.id === selectedPairing)?.partner_name || "Unknown";
      toast.success("Session logged!");
      setSessions((prev) => [{
        id: crypto.randomUUID(),
        pairing_id: selectedPairing,
        logged_by: user.id,
        session_date: sessionDate,
        duration_minutes: duration ? parseInt(duration) : null,
        notes,
        created_at: new Date().toISOString(),
        partner_name: partnerName,
      }, ...prev]);
      setNotes("");
      setDuration("");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const renderBookingCard = (b: Booking) => {
    const isMyBooking = b.booker_id === user!.id;
    const partnerName = isMyBooking ? b.mentor_name : b.booker_name;
    const partnerAvatar = isMyBooking ? b.mentor_avatar : b.booker_avatar;
    const isPastBooking = b.booking_date < format(new Date(), "yyyy-MM-dd");

    return (
      <Card key={b.id} className={cn("shadow-card", isPastBooking && "opacity-70")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={partnerAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {partnerName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-body text-sm font-medium">{partnerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CalendarClock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">
                    {format(parseISO(b.booking_date), "EEE, MMM d, yyyy")}
                  </span>
                  <Clock className="h-3 w-3 text-muted-foreground ml-1" />
                  <span className="font-body text-xs text-muted-foreground">
                    {utcTimeToLocal(b.booking_date, b.start_time.slice(0, 5))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {(() => {
                const daysAway = differenceInCalendarDays(parseISO(b.booking_date), new Date());
                if (daysAway === 0) return <Badge className="font-body text-[10px] bg-destructive text-destructive-foreground">Today</Badge>;
                if (daysAway === 1) return <Badge className="font-body text-[10px] bg-amber-500/80 text-primary-foreground">Tomorrow</Badge>;
                if (daysAway > 1 && daysAway <= 7) return <Badge variant="secondary" className="font-body text-[10px]">In {daysAway} days</Badge>;
                return <Badge variant="secondary" className="font-body text-xs">One-on-one</Badge>;
              })()}
              {!isMyBooking && isMentor && (
                <span className="font-body text-[10px] text-muted-foreground">
                  Booked by {b.booker_id === b.mentor_id ? "you" : "mentee"}
                </span>
              )}
            </div>
          </div>
          {b.notes && <p className="font-body text-xs text-muted-foreground mt-2">{b.notes}</p>}
          <div className="flex items-center gap-1 mt-2">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="font-body text-[10px] text-muted-foreground">{b.timezone || userTimezone}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Sessions</h1>

        <UpcomingWorkshopsWidget />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-2xl font-bold">{stats.upcomingCount}</p>
                <p className="font-body text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-2xl font-bold">{stats.totalSessions}</p>
                <p className="font-body text-xs text-muted-foreground">Logged Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-2xl font-bold">{stats.totalHours}</p>
                <p className="font-body text-xs text-muted-foreground">Hours Logged</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-2xl font-bold">{stats.activePairings}</p>
                <p className="font-body text-xs text-muted-foreground">Active Pairings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Section */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="font-body">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
            <TabsTrigger value="logs">Session Logs</TabsTrigger>
            {isMentor && <TabsTrigger value="calendar">My Calendar</TabsTrigger>}
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-body text-muted-foreground">No upcoming sessions.</p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {isMentor
                    ? "Set your availability under the Session Logs tab so mentees can book with you."
                    : "Browse mentors in Explore and book a session."}
                </p>
              </div>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {pastBookings.length === 0 ? (
              <p className="font-body text-muted-foreground text-center py-8">No past sessions yet.</p>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-4">
            {/* Mentor Booking Availability — manage when mentees can book you */}
            {isMentor && user && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-body text-base">Booking Availability</CardTitle>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Set the days, hours, and rules mentees use when booking sessions with you.
                  </p>
                </CardHeader>
                <CardContent>
                  <MentorBookingSettings userId={user.id} />
                </CardContent>
              </Card>
            )}

            {/* Log a Session Form */}
            {pairings.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-body text-base">Log a Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <select
                    value={selectedPairing}
                    onChange={(e) => setSelectedPairing(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 font-body text-sm bg-background"
                  >
                    <option value="">Select {isMentor ? "mentee" : "mentor"}...</option>
                    {pairings.map((p) => (
                      <option key={p.id} value={p.id}>{p.partner_name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="font-body" />
                    <Input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} className="font-body" />
                  </div>
                  <Input placeholder="Session notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="font-body" />
                  <Button onClick={logSession} className="font-body">
                    <Plus className="h-4 w-4 mr-2" /> Log Session
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Session List */}
            <div className="space-y-3">
              {sessions.map((s) => (
                <Card key={s.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <span className="font-body text-sm font-medium">
                            {new Date(s.session_date).toLocaleDateString()}
                          </span>
                          {s.partner_name && (
                            <span className="font-body text-xs text-muted-foreground ml-2">
                              with {s.partner_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {s.duration_minutes && (
                        <span className="font-body text-sm text-muted-foreground">{s.duration_minutes} min</span>
                      )}
                    </div>
                    {s.notes && <p className="font-body text-sm text-muted-foreground mt-2">{s.notes}</p>}
                  </CardContent>
                </Card>
              ))}
              {sessions.length === 0 && (
                <p className="font-body text-muted-foreground text-center py-8">No sessions logged yet.</p>
              )}
            </div>
          </TabsContent>

          {isMentor && user && (
            <TabsContent value="calendar" className="mt-4">
              <MentorCalendar userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Sessions;
