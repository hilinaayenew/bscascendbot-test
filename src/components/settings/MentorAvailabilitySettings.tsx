import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, CalendarOff, Clock, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

interface MentorAvailabilitySettingsProps {
  userId: string;
}

const MentorAvailabilitySettings = ({ userId }: MentorAvailabilitySettingsProps) => {
  const [days, setDays] = useState<DayAvailability[]>(
    DAYS.map(() => ({ enabled: false, slots: [] }))
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      const [{ data: slots }, { data: blocked }] = await Promise.all([
        supabase.from("mentor_availability").select("*").eq("mentor_id", userId),
        supabase.from("mentor_blocked_dates").select("*").eq("mentor_id", userId),
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
        });
        // Sort slots within each day
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

      setLoading(false);
    };
    fetchAvailability();
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

  const handleSave = async () => {
    // Validate slots
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

    // Delete all existing and re-insert
    const { error: delSlots } = await (supabase.from("mentor_availability").delete().eq("mentor_id", userId) as any);
    const { error: delBlocked } = await (supabase.from("mentor_blocked_dates").delete().eq("mentor_id", userId) as any);

    if (delSlots || delBlocked) {
      toast.error("Failed to update availability.");
      setSaving(false);
      return;
    }

    const slotsToInsert = days.flatMap((d, i) =>
      d.enabled
        ? d.slots.map(s => ({
            mentor_id: userId,
            day_of_week: i,
            start_time: s.start_time,
            end_time: s.end_time,
          }))
        : []
    );

    const blockedToInsert = blockedDates.map(b => ({
      mentor_id: userId,
      blocked_date: b.blocked_date,
      reason: b.reason || null,
    }));

    let hasError = false;
    if (slotsToInsert.length) {
      const { error } = await (supabase.from("mentor_availability").insert(slotsToInsert) as any);
      if (error) hasError = true;
    }
    if (blockedToInsert.length) {
      const { error } = await (supabase.from("mentor_blocked_dates").insert(blockedToInsert) as any);
      if (error) hasError = true;
    }

    if (hasError) {
      toast.error("Failed to save some availability settings.");
    } else {
      toast.success("Availability saved!");
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
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Weekly Availability
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Set the days and times you're available for sessions. Mentees will only be able to book during these times.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day, i) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch checked={days[i].enabled} onCheckedChange={() => toggleDay(i)} />
                <Label className="font-body font-medium w-24">{day}</Label>
                {days[i].enabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(i)}
                    className="font-body text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add slot
                  </Button>
                )}
              </div>
              {days[i].enabled && days[i].slots.map((slot, si) => (
                <div key={si} className="flex items-center gap-2 ml-14">
                  <Input
                    type="time"
                    value={slot.start_time}
                    onChange={e => updateSlot(i, si, "start_time", e.target.value)}
                    className="font-body w-32"
                  />
                  <span className="font-body text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.end_time}
                    onChange={e => updateSlot(i, si, "end_time", e.target.value)}
                    className="font-body w-32"
                  />
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

      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <CalendarOff className="h-5 w-5" /> Blocked Dates
          </CardTitle>
          <p className="font-body text-sm text-muted-foreground">
            Block specific dates when you're unavailable — holidays, personal time, etc.
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

          {blockedDates.length > 0 && (
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
          )}

          {blockedDates.length === 0 && (
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

export default MentorAvailabilitySettings;
