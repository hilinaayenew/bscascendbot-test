/**
 * Purpose: Mentor booking & availability settings tab (Calendly-style weekly grid + session settings + booking link)
 * DB tables: mentor_availability, mentor_booking_settings, mentor_blocked_dates, profiles
 * Emails: none
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, CalendarOff, Clock, Save, Loader2, Copy, Link as LinkIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMEZONES = [
  "Africa/Abidjan","Africa/Accra","Africa/Cairo","Africa/Casablanca","Africa/Johannesburg","Africa/Lagos","Africa/Nairobi",
  "America/Anchorage","America/Argentina/Buenos_Aires","America/Bogota","America/Chicago","America/Denver","America/Halifax",
  "America/Los_Angeles","America/Mexico_City","America/New_York","America/Sao_Paulo","America/Toronto","America/Vancouver",
  "Asia/Bangkok","Asia/Colombo","Asia/Dubai","Asia/Hong_Kong","Asia/Jakarta","Asia/Karachi","Asia/Kolkata","Asia/Kuala_Lumpur",
  "Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo",
  "Atlantic/Reykjavik","Australia/Melbourne","Australia/Perth","Australia/Sydney",
  "Europe/Amsterdam","Europe/Athens","Europe/Berlin","Europe/Dublin","Europe/Istanbul","Europe/London","Europe/Madrid",
  "Europe/Moscow","Europe/Paris","Europe/Rome","Europe/Stockholm","Europe/Warsaw","Europe/Zurich",
  "Pacific/Auckland","Pacific/Fiji","Pacific/Honolulu","UTC",
];

interface TimeSlot {
  id?: string;
  start_time: string;
  end_time: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

interface BlockedDate {
  id?: string;
  blocked_date: string;
  reason?: string;
}

interface BookingSettings {
  session_duration: number;
  buffer_minutes: number;
  max_bookings_per_day: number;
  minimum_notice: string;
}

interface MentorBookingSettingsProps {
  userId: string;
}

const MentorBookingSettings = ({ userId }: MentorBookingSettingsProps) => {
  const [days, setDays] = useState<DayAvailability[]>(
    DAYS.map(() => ({ enabled: false, slots: [] }))
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState<Date | undefined>();
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [settings, setSettings] = useState<BookingSettings>({
    session_duration: 30,
    buffer_minutes: 0,
    max_bookings_per_day: 4,
    minimum_notice: "1 day",
  });
  const [username, setUsername] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: slots }, { data: blocked }, { data: bSettings }, { data: profileData }, { data: meetingLinkData }] = await Promise.all([
        supabase.from("mentor_availability").select("*").eq("mentor_id", userId),
        supabase.from("mentor_blocked_dates").select("*").eq("mentor_id", userId),
        supabase.from("mentor_booking_settings" as any).select("*").eq("mentor_id", userId).maybeSingle(),
        supabase.from("profiles").select("username").eq("user_id", userId).maybeSingle(),
        supabase.rpc("get_my_mentor_meeting_link" as any),
      ]);

      if (slots?.length) {
        const newDays: DayAvailability[] = DAYS.map(() => ({ enabled: false, slots: [] }));
        slots.forEach((s: any) => {
          newDays[s.day_of_week].enabled = true;
          newDays[s.day_of_week].slots.push({
            id: s.id,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
          });
          if (s.timezone) setTimezone(s.timezone);
        });
        newDays.forEach(d => d.slots.sort((a, b) => a.start_time.localeCompare(b.start_time)));
        setDays(newDays);
      }

      if (blocked?.length) {
        setBlockedDates(blocked.map((b: any) => ({
          id: b.id,
          blocked_date: b.blocked_date,
          reason: b.reason,
        })));
      }

      if (bSettings) {
        setSettings({
          session_duration: (bSettings as any).session_duration || 30,
          buffer_minutes: (bSettings as any).buffer_minutes || 0,
          max_bookings_per_day: (bSettings as any).max_bookings_per_day || 4,
          minimum_notice: (bSettings as any).minimum_notice || "1 day",
        });
      }

      if ((profileData as any)?.username) {
        setUsername((profileData as any).username);
      }

      if (typeof meetingLinkData === "string" && meetingLinkData) {
        setMeetingLink(meetingLinkData);
      }

      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const toggleDay = (index: number) => {
    setDays(prev => prev.map((d, i) =>
      i === index
        ? { enabled: !d.enabled, slots: !d.enabled && d.slots.length === 0 ? [{ start_time: "09:00", end_time: "17:00" }] : d.slots }
        : d
    ));
  };

  const addSlot = (dayIndex: number) => {
    setDays(prev => prev.map((d, i) =>
      i === dayIndex ? { ...d, slots: [...d.slots, { start_time: "09:00", end_time: "17:00" }] } : d
    ));
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setDays(prev => prev.map((d, i) =>
      i === dayIndex ? { ...d, slots: d.slots.filter((_, si) => si !== slotIndex) } : d
    ));
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: "start_time" | "end_time", value: string) => {
    setDays(prev => prev.map((d, i) =>
      i === dayIndex
        ? { ...d, slots: d.slots.map((s, si) => si === slotIndex ? { ...s, [field]: value } : s) }
        : d
    ));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    const dateStr = format(newBlockedDate, "yyyy-MM-dd");
    if (blockedDates.some(b => b.blocked_date === dateStr)) {
      toast.error("Date already blocked.");
      return;
    }
    setBlockedDates(prev => [...prev, { blocked_date: dateStr }]);
    setNewBlockedDate(undefined);
  };

  const removeBlockedDate = (index: number) => {
    setBlockedDates(prev => prev.filter((_, i) => i !== index));
  };

  const copyBookingLink = () => {
    if (!username) {
      toast.error("Set a username first to generate your booking link.");
      return;
    }
    const link = `${window.location.origin}/book/${username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    for (let i = 0; i < days.length; i++) {
      if (days[i].enabled) {
        for (const slot of days[i].slots) {
          if (slot.start_time >= slot.end_time) {
            toast.error(`${DAYS[i]}: Start time must be before end time.`);
            return;
          }
        }
      }
    }

    setSaving(true);

    // Username is auto-generated at signup and intentionally immutable.

    // Delete all existing and re-insert availability
    await Promise.all([
      (supabase.from("mentor_availability").delete().eq("mentor_id", userId) as any),
      (supabase.from("mentor_blocked_dates").delete().eq("mentor_id", userId) as any),
    ]);

    const slotsToInsert = days.flatMap((d, i) =>
      d.enabled
        ? d.slots.map(s => ({
            mentor_id: userId,
            day_of_week: i,
            start_time: s.start_time,
            end_time: s.end_time,
            timezone,
          }))
        : []
    );

    const blockedToInsert = blockedDates.map(b => ({
      mentor_id: userId,
      blocked_date: b.blocked_date,
      reason: b.reason || null,
    }));

    // Upsert booking settings
    const settingsPayload = {
      mentor_id: userId,
      session_duration: settings.session_duration,
      buffer_minutes: settings.buffer_minutes,
      max_bookings_per_day: settings.max_bookings_per_day,
      minimum_notice: settings.minimum_notice,
      updated_at: new Date().toISOString(),
    };

    const promises: Promise<any>[] = [];
    if (slotsToInsert.length) {
      promises.push(supabase.from("mentor_availability").insert(slotsToInsert) as any);
    }
    if (blockedToInsert.length) {
      promises.push(supabase.from("mentor_blocked_dates").insert(blockedToInsert) as any);
    }
    promises.push(
      (supabase.from("mentor_booking_settings" as any).upsert(settingsPayload, { onConflict: "mentor_id" }) as any)
    );
    // Save meeting link to mentor_details
    promises.push(
      supabase.from("mentor_details").update({ meeting_link: meetingLink.trim() || null } as any).eq("user_id", userId) as any
    );

    const results = await Promise.all(promises);
    const hasError = results.some((r: any) => r.error);

    if (hasError) {
      toast.error("Failed to save some settings.");
    } else {
      toast.success("Booking settings saved!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Booking Page Link */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5" /> Booking Page Link
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Your booking link is generated automatically and is permanent. Share it with anyone you'd like to book a session.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-2">
            <span className="font-body text-sm text-muted-foreground truncate">
              {window.location.origin}/book/{username || "…"}
            </span>
          </div>
          {username && (
            <Button variant="outline" size="sm" onClick={copyBookingLink} className="font-body">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Meeting Link */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5" /> Meeting Link
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Add a default video call link (Google Meet, Zoom, Teams, etc.) to include in booking confirmation emails.
          </p>
        </CardHeader>
        <CardContent>
          <Input
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="font-body"
            type="url"
          />
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Session Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Session Duration</Label>
              <Select value={String(settings.session_duration)} onValueChange={v => setSettings(s => ({ ...s, session_duration: Number(v) }))}>
                <SelectTrigger className="font-body mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Buffer Between Sessions</Label>
              <Select value={String(settings.buffer_minutes)} onValueChange={v => setSettings(s => ({ ...s, buffer_minutes: Number(v) }))}>
                <SelectTrigger className="font-body mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Max Bookings Per Day</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={settings.max_bookings_per_day}
                onChange={e => setSettings(s => ({ ...s, max_bookings_per_day: Math.max(1, Number(e.target.value)) }))}
                className="font-body mt-1.5"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Minimum Notice</Label>
              <Select value={settings.minimum_notice} onValueChange={v => setSettings(s => ({ ...s, minimum_notice: v }))}>
                <SelectTrigger className="font-body mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same day">Same day</SelectItem>
                  <SelectItem value="1 day">1 day ahead</SelectItem>
                  <SelectItem value="2 days">2 days ahead</SelectItem>
                  <SelectItem value="1 week">1 week ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg">Timezone</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="font-body w-full max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">
              {TIMEZONES.map(tz => (
                <SelectItem key={tz} value={tz} className="font-body text-sm">{tz.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Weekly Availability
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Set the days and times you're available for sessions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day, i) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch checked={days[i].enabled} onCheckedChange={() => toggleDay(i)} />
                <Label className="font-body font-medium w-24">{day}</Label>
                {days[i].enabled && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => addSlot(i)} className="font-body text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add slot
                  </Button>
                )}
              </div>
              {days[i].enabled && days[i].slots.map((slot, si) => (
                <div key={si} className="flex items-center gap-2 ml-14">
                  <Input type="time" value={slot.start_time} onChange={e => updateSlot(i, si, "start_time", e.target.value)} className="font-body w-32" />
                  <span className="font-body text-sm text-muted-foreground">to</span>
                  <Input type="time" value={slot.end_time} onChange={e => updateSlot(i, si, "end_time", e.target.value)} className="font-body w-32" />
                  {days[i].slots.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(i, si)} className="h-8 w-8">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <CalendarOff className="h-5 w-5" /> Blocked Dates
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Block specific dates when you're unavailable.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("font-body w-48 justify-start text-left", !newBlockedDate && "text-muted-foreground")}>
                  {newBlockedDate ? format(newBlockedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newBlockedDate}
                  onSelect={setNewBlockedDate}
                  disabled={(date) => date < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={addBlockedDate} disabled={!newBlockedDate} variant="outline" className="font-body">
              <Plus className="h-4 w-4 mr-1" /> Block
            </Button>
          </div>

          {blockedDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {blockedDates
                .sort((a, b) => a.blocked_date.localeCompare(b.blocked_date))
                .map((b, i) => (
                  <Badge key={b.blocked_date} variant="secondary" className="font-body gap-1 pr-1">
                    {format(new Date(b.blocked_date + "T00:00:00"), "MMM d, yyyy")}
                    <button onClick={() => removeBlockedDate(i)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          ) : (
            <p className="font-body text-sm text-muted-foreground">No blocked dates.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="font-body px-8">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Availability
        </Button>
      </div>
    </div>
  );
};

export default MentorBookingSettings;
