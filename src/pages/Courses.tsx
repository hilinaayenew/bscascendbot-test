import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminCoursesView from "@/components/courses/AdminCoursesView";
import ChecklistCourseCard from "@/components/courses/ChecklistCourseCard";
import LessonView from "@/components/courses/LessonView";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { BookOpen, Info, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchCoursesForUser,
  fetchChecklistItems,
  fetchCompletionsForUser,
  markItemComplete,
  unmarkItemComplete,
  itemRolesForUser,
  type DbCourse,
  type DbChecklistItem,
} from "@/lib/coursesData";

const Courses = () => {
  const { user, roles, loading } = useAuth();
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [itemsByCourse, setItemsByCourse] = useState<Record<string, DbChecklistItem[]>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [openLesson, setOpenLesson] = useState<{ courseId: string; itemId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");
  const isAdmin = roles.includes("admin");

  const loadAll = useCallback(async () => {
    if (!user) return;
    setCoursesLoading(true);
    try {
      const visibleCourses = await fetchCoursesForUser(isMentor, isMentee);
      setCourses(visibleCourses);

      const allowedRoles = itemRolesForUser(isMentor, isMentee);
      const itemsMap: Record<string, DbChecklistItem[]> = {};
      await Promise.all(
        visibleCourses.map(async (c) => {
          const allItems = await fetchChecklistItems(c.id);
          itemsMap[c.id] = allItems.filter((i) => allowedRoles.includes(i.target_role));
        })
      );
      setItemsByCourse(itemsMap);

      const completions = await fetchCompletionsForUser(user.id);
      setCompletedIds(new Set(completions.map((c) => c.item_id)));
    } catch (e: any) {
      toast.error("Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  }, [user, isMentor, isMentee]);

  useEffect(() => {
    if (user && !isAdmin) loadAll();
    else if (isAdmin) setCoursesLoading(false);
  }, [user, isAdmin, loadAll]);

  const handleMarkComplete = async (item: DbChecklistItem) => {
    if (!user) return;
    if (completedIds.has(item.id)) return; // idempotent
    const prev = new Set(completedIds);
    const next = new Set(completedIds);
    next.add(item.id);
    setCompletedIds(next);
    try {
      await markItemComplete(user.id, item.course_id, item.id);
    } catch (e: any) {
      toast.error("Failed to save progress");
      setCompletedIds(prev);
    }
  };

  const openLessonView = (courseId: string, itemId: string) => {
    setOpenLesson({ courseId, itemId });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Resolve currently open lesson (if any) for non-admin views
  const activeCourse = openLesson ? courses.find((c) => c.id === openLesson.courseId) : null;
  const activeLessons = activeCourse ? itemsByCourse[activeCourse.id] || [] : [];
  const activeLesson = activeCourse
    ? activeLessons.find((l) => l.id === openLesson?.itemId) || null
    : null;

  // Filter courses by search query (title, description, or any lesson title)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = normalizedQuery
    ? courses.filter((course) => {
        if (course.title.toLowerCase().includes(normalizedQuery)) return true;
        if (course.description?.toLowerCase().includes(normalizedQuery)) return true;
        const lessons = itemsByCourse[course.id] || [];
        return lessons.some((l) => l.title.toLowerCase().includes(normalizedQuery));
      })
    : courses;

  return (
    <DashboardLayout>
      {isAdmin ? (
        <AdminCoursesView />
      ) : activeCourse && activeLesson ? (
        <LessonView
          course={activeCourse}
          lesson={activeLesson}
          lessons={activeLessons}
          isCompleted={completedIds.has(activeLesson.id)}
          onBack={() => setOpenLesson(null)}
          onMarkComplete={() => handleMarkComplete(activeLesson)}
          onOpenLesson={(itemId) => setOpenLesson({ courseId: activeCourse.id, itemId })}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-display text-2xl font-bold">Courses</h1>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="pl-9 pr-9 font-body"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isMentor && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="font-body text-primary">
                These are courses for your own growth. To track your mentees' progress, visit the{" "}
                <Link to="/dashboard/pairings" className="font-bold underline">
                  Pairings tab
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

          {coursesLoading ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-muted-foreground">
                No courses available right now. Check back soon!
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-muted-foreground">
                No courses match "{searchQuery}". Try a different keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {filteredCourses.map((course) => (
                <ChecklistCourseCard
                  key={course.id}
                  course={course}
                  items={itemsByCourse[course.id] || []}
                  completedItemIds={completedIds}
                  onOpenLesson={openLessonView}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Courses;
