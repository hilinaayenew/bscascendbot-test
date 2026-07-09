import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import {
  fetchAllCourses,
  fetchAllCompletions,
  type DbCourse,
  type DbChecklistItem,
  type DbCompletion,
  itemRolesForUser,
} from "@/lib/coursesData";

interface ProfileLite {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface RoleRow {
  user_id: string;
  role: string;
}

interface RowData {
  user_id: string;
  name: string;
  email: string;
  role: "mentor" | "mentee" | "other";
  total: number;
  done: number;
  pct: number;
  lastActivity: string | null;
  perCourse: { course: DbCourse; items: DbChecklistItem[]; completed: Set<string> }[];
}

const AdminCourseProgress = () => {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [items, setItems] = useState<DbChecklistItem[]>([]);
  const [completions, setCompletions] = useState<DbCompletion[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [userRoles, setUserRoles] = useState<RoleRow[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, comp, profilesRes, rolesRes, contactsRes] = await Promise.all([
          fetchAllCourses(),
          fetchAllCompletions(),
          supabase.from("profiles").select("user_id, full_name"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.rpc("admin_get_profile_contacts", { _user_ids: null as any }),
        ]);
        if (!alive) return;
        setCourses(c);
        setCompletions(comp);
        {
          const emailMap = new Map<string, string>(
            ((contactsRes.data as any[]) || []).map((r: any) => [r.user_id, r.email]),
          );
          const merged = ((profilesRes.data as any[]) || []).map((p: any) => ({
            ...p,
            email: emailMap.get(p.user_id) ?? null,
          }));
          setProfiles(merged as ProfileLite[]);
        }
        setUserRoles((rolesRes.data || []) as RoleRow[]);

        if (c.length > 0) {
          const { data: itemsData } = await supabase
            .from("course_checklist_items" as any)
            .select("*")
            .in("course_id", c.map((x) => x.id));
          if (alive) setItems((itemsData || []) as unknown as DbChecklistItem[]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo<RowData[]>(() => {
    const roleMap = new Map<string, Set<string>>();
    userRoles.forEach((r) => {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, new Set());
      roleMap.get(r.user_id)!.add(r.role);
    });

    const userIds = new Set<string>();
    completions.forEach((c) => userIds.add(c.user_id));
    // Also include all known mentors/mentees so admins see who hasn't started
    profiles.forEach((p) => {
      const r = roleMap.get(p.user_id);
      if (r && (r.has("mentor") || r.has("mentee"))) userIds.add(p.user_id);
    });

    return Array.from(userIds)
      .map((uid) => {
        const profile = profiles.find((p) => p.user_id === uid);
        const roles = roleMap.get(uid) || new Set();
        const isMentor = roles.has("mentor");
        const isMentee = roles.has("mentee");
        const role: RowData["role"] = isMentor ? "mentor" : isMentee ? "mentee" : "other";

        const allowedRoles = itemRolesForUser(isMentor, isMentee);
        const visibleCourses = courses.filter(
          (c) =>
            c.published &&
            (c.audience === "both" ||
              (c.audience === "mentor" && isMentor) ||
              (c.audience === "mentee" && isMentee))
        );

        const userCompletions = completions.filter((c) => c.user_id === uid);
        const completedSet = new Set(userCompletions.map((c) => c.item_id));

        let total = 0;
        let done = 0;
        const perCourse = visibleCourses.map((course) => {
          const courseItems = items
            .filter((i) => i.course_id === course.id && allowedRoles.includes(i.target_role))
            .sort((a, b) => a.sort_order - b.sort_order);
          total += courseItems.length;
          done += courseItems.filter((i) => completedSet.has(i.id)).length;
          return { course, items: courseItems, completed: completedSet };
        });

        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        const lastActivity =
          userCompletions.length === 0
            ? null
            : userCompletions.map((c) => c.completed_at).sort().reverse()[0];

        return {
          user_id: uid,
          name: profile?.full_name || "Unknown",
          email: profile?.email || "",
          role,
          total,
          done,
          pct,
          lastActivity,
          perCourse,
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [completions, profiles, userRoles, courses, items]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter === "completed" && r.pct !== 100) return false;
      if (statusFilter === "in-progress" && (r.pct === 100 || r.pct === 0)) return false;
      if (statusFilter === "not-started" && r.pct !== 0) return false;
      return true;
    });
  }, [rows, roleFilter, statusFilter]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <p className="font-body text-sm text-muted-foreground text-center py-8">Loading progress...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="font-body w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="mentor">Mentors</SelectItem>
            <SelectItem value="mentee">Mentees</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="font-body w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not-started">Not started</SelectItem>
            <SelectItem value="in-progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">
              No participants match these filters.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((row) => {
                const isOpen = expanded.has(row.user_id);
                return (
                  <div key={row.user_id}>
                    <button
                      type="button"
                      onClick={() => toggle(row.user_id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm sora-semibold truncate">{row.name}</p>
                        <p className="font-body text-xs text-muted-foreground truncate">{row.email}</p>
                      </div>
                      <Badge variant="secondary" className="font-body text-[10px] capitalize shrink-0">
                        {row.role}
                      </Badge>
                      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-32">
                        <span className="font-body text-xs text-muted-foreground">
                          {row.done} / {row.total}
                        </span>
                        <Progress value={row.pct} className="h-1.5 w-full" />
                      </div>
                      <span className="font-body text-xs sora-semibold w-10 text-right shrink-0">{row.pct}%</span>
                      <span className="hidden md:inline font-body text-xs text-muted-foreground shrink-0 w-24 text-right">
                        {row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : "—"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="bg-muted/20 px-4 py-3 space-y-3 border-t border-border">
                        {row.perCourse.map(({ course, items: courseItems, completed }) => (
                          <div key={course.id}>
                            <p className="font-body text-xs sora-semibold mb-2">{course.title}</p>
                            <ul className="space-y-1">
                              {courseItems.map((it) => {
                                const done = completed.has(it.id);
                                return (
                                  <li key={it.id} className="flex items-center gap-2">
                                    {done ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span
                                      className={`font-body text-xs ${
                                        done ? "line-through text-muted-foreground" : "text-foreground"
                                      }`}
                                    >
                                      {it.title}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourseProgress;