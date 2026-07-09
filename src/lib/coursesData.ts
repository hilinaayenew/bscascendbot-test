import { supabase } from "@/integrations/supabase/client";

export type CourseAudience = "mentor" | "mentee" | "both";
export type ChecklistRole = "mentor" | "mentee" | "both";

export interface DbCourse {
  id: string;
  title: string;
  description: string | null;
  audience: CourseAudience;
  cohort_label: string | null;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbChecklistItem {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  resource_url: string | null;
  target_role: ChecklistRole;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCompletion {
  id: string;
  user_id: string;
  course_id: string;
  item_id: string;
  completed_at: string;
}

/**
 * Determine which courses a user can see based on their roles.
 * Mentors see audience='mentor' or 'both'. Mentees see audience='mentee' or 'both'.
 */
export function audienceForRole(isMentor: boolean, isMentee: boolean): CourseAudience[] {
  if (isMentor && isMentee) return ["mentor", "mentee", "both"];
  if (isMentor) return ["mentor", "both"];
  if (isMentee) return ["mentee", "both"];
  return ["both"];
}

export function itemRolesForUser(isMentor: boolean, isMentee: boolean): ChecklistRole[] {
  if (isMentor && isMentee) return ["mentor", "mentee", "both"];
  if (isMentor) return ["mentor", "both"];
  if (isMentee) return ["mentee", "both"];
  return ["both"];
}

export async function fetchCoursesForUser(isMentor: boolean, isMentee: boolean) {
  const audiences = audienceForRole(isMentor, isMentee);
  const { data, error } = await supabase
    .from("courses" as any)
    .select("*")
    .eq("published", true)
    .in("audience", audiences)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as DbCourse[];
}

export async function fetchAllCourses() {
  const { data, error } = await supabase
    .from("courses" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as DbCourse[];
}

export async function fetchChecklistItems(courseId: string) {
  const { data, error } = await supabase
    .from("course_checklist_items" as any)
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as DbChecklistItem[];
}

export async function fetchCompletionsForUser(userId: string) {
  const { data, error } = await supabase
    .from("course_item_completions" as any)
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []) as unknown as DbCompletion[];
}

export async function fetchAllCompletions() {
  const { data, error } = await supabase
    .from("course_item_completions" as any)
    .select("*");
  if (error) throw error;
  return (data || []) as unknown as DbCompletion[];
}

export async function markItemComplete(userId: string, courseId: string, itemId: string) {
  const { error } = await supabase
    .from("course_item_completions" as any)
    .insert({ user_id: userId, course_id: courseId, item_id: itemId });
  if (error && error.code !== "23505") throw error;
}

export async function unmarkItemComplete(userId: string, itemId: string) {
  const { error } = await supabase
    .from("course_item_completions" as any)
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);
  if (error) throw error;
}

export async function createCourse(input: {
  title: string;
  description?: string | null;
  audience: CourseAudience;
  cohort_label?: string | null;
  published?: boolean;
}) {
  const { data, error } = await supabase
    .from("courses" as any)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DbCourse;
}

export async function updateCourse(id: string, patch: Partial<DbCourse>) {
  const { error } = await supabase.from("courses" as any).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function createChecklistItem(input: {
  course_id: string;
  title: string;
  description?: string | null;
  resource_url?: string | null;
  target_role: ChecklistRole;
  sort_order: number;
}) {
  const { data, error } = await supabase
    .from("course_checklist_items" as any)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DbChecklistItem;
}

export async function updateChecklistItem(id: string, patch: Partial<DbChecklistItem>) {
  const { error } = await supabase.from("course_checklist_items" as any).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string) {
  const { error } = await supabase.from("course_checklist_items" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function reorderChecklistItems(items: { id: string; sort_order: number }[]) {
  await Promise.all(
    items.map((it) =>
      supabase.from("course_checklist_items" as any).update({ sort_order: it.sort_order }).eq("id", it.id)
    )
  );
}