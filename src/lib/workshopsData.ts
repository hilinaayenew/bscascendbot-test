import { supabase } from "@/integrations/supabase/client";

export type WorkshopType = "workshop" | "group_session" | "one_on_one";
export type WorkshopVisibility = "all" | "mentor" | "mentee";

export interface Workshop {
  id: string;
  title: string;
  type: WorkshopType;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  link: string | null;
  description: string | null;
  visibility: WorkshopVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const TYPE_LABEL: Record<WorkshopType, string> = {
  workshop: "Workshop",
  group_session: "Group Session",
  one_on_one: "One-on-One",
};

export async function fetchUpcomingWorkshops() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("workshops_sessions" as any)
    .select("*")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as Workshop[];
}

export async function fetchAllWorkshops() {
  const { data, error } = await supabase
    .from("workshops_sessions" as any)
    .select("*")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Workshop[];
}

export async function createWorkshop(input: Omit<Workshop, "id" | "created_at" | "updated_at" | "created_by">) {
  const { data, error } = await supabase
    .from("workshops_sessions" as any)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Workshop;
}

export async function updateWorkshop(id: string, patch: Partial<Workshop>) {
  const { error } = await supabase.from("workshops_sessions" as any).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteWorkshop(id: string) {
  const { error } = await supabase.from("workshops_sessions" as any).delete().eq("id", id);
  if (error) throw error;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIcsDate(iso: string) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function downloadIcs(w: Workshop) {
  const start = toIcsDate(w.starts_at);
  const end = toIcsDate(w.ends_at || new Date(new Date(w.starts_at).getTime() + 60 * 60 * 1000).toISOString());
  const locationParts = [w.location, w.link].filter(Boolean).join(" — ");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ascendency//Workshop//EN",
    "BEGIN:VEVENT",
    `UID:${w.id}@ascendency`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(w.title)}`,
    w.description ? `DESCRIPTION:${escapeIcs(w.description)}` : "",
    locationParts ? `LOCATION:${escapeIcs(locationParts)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${w.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}