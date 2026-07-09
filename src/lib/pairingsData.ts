/**
 * Purpose: Shared helpers to enrich pairings with sessions, next session, and course progress.
 * DB tables: bookings, course_progress, profiles
 */
import { supabase } from "@/integrations/supabase/client";
import { COURSES } from "@/lib/courseData";
import { format, parseISO } from "date-fns";

export interface PairingSessionStats {
  sessionsCompleted: number;
  nextSession: { date: string; startTime: string } | null;
}

/**
 * Compute sessions completed and next upcoming session for a (mentor, mentee) pair.
 * - Sessions completed = confirmed bookings whose date is in the past.
 * - Next session = soonest confirmed booking whose date is today or later.
 */
export async function getPairSessionStats(
  mentorId: string,
  menteeId: string,
): Promise<PairingSessionStats> {
  const { data } = await supabase
    .from("bookings")
    .select("booking_date, start_time, status")
    .eq("status", "confirmed")
    .eq("mentor_id", mentorId)
    .eq("booker_id", menteeId)
    .order("booking_date", { ascending: true });

  const today = format(new Date(), "yyyy-MM-dd");
  let sessionsCompleted = 0;
  let nextSession: PairingSessionStats["nextSession"] = null;

  for (const b of data || []) {
    if (b.booking_date < today) {
      sessionsCompleted += 1;
    } else if (!nextSession) {
      nextSession = { date: b.booking_date, startTime: b.start_time };
    }
  }

  return { sessionsCompleted, nextSession };
}

/**
 * Compute overall course-progress percentage for a mentee across all non-mentor-only courses.
 */
export async function getMenteeCourseProgressPct(menteeId: string): Promise<number> {
  const { data } = await supabase
    .from("course_progress")
    .select("course_id, completed_modules")
    .eq("user_id", menteeId);

  const sharedCourses = COURSES.filter((c) => !c.mentorOnly);
  const totalModules = sharedCourses.reduce((sum, c) => sum + c.modules.length, 0);
  if (totalModules === 0) return 0;

  const completedSet = new Set<string>();
  for (const row of data || []) {
    for (const moduleId of row.completed_modules || []) completedSet.add(moduleId);
  }

  // Only count modules that belong to shared courses.
  const sharedModuleIds = new Set(sharedCourses.flatMap((c) => c.modules.map((m) => m.id)));
  let completedCount = 0;
  completedSet.forEach((id) => {
    if (sharedModuleIds.has(id)) completedCount += 1;
  });

  return Math.round((completedCount / totalModules) * 100);
}

/** Format a next-session pair (date + UTC time) into the user's local timezone string. */
export function formatNextSession(next: PairingSessionStats["nextSession"]): string {
  if (!next) return "No session scheduled";
  const [y, m, d] = next.date.split("-").map(Number);
  const [h, min] = next.startTime.slice(0, 5).split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, h, min));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateLabel = format(parseISO(next.date), "EEEE, MMM d");
  const timeLabel = utc.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
  return `${dateLabel} at ${timeLabel}`;
}