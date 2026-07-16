import { useEffect, useState } from "react";
import EmployerLayout from "@/components/employer/EmployerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMyEmployer } from "@/hooks/useEmployer";
import { Loader2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseMetric {
  id: string;
  title: string;
  visibility: string;
  enrolled: number;
  completed: number;
}

const EmployerAnalytics = () => {
  const { employer } = useMyEmployer();
  const [metrics, setMetrics] = useState<CourseMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employer) return;
    const load = async () => {
      setLoading(true);
      const { data: courses } = await supabase
        .from("employer_courses")
        .select("id, title, visibility")
        .eq("employer_id", employer.id);
      const rows = (courses ?? []) as any[];
      if (rows.length === 0) {
        setMetrics([]);
        setLoading(false);
        return;
      }
      const { data: enrolls } = await supabase
        .from("employer_course_enrollments")
        .select("course_id, completed_at")
        .in("course_id", rows.map((c) => c.id));
      const byCourse = new Map<string, { enrolled: number; completed: number }>();
      (enrolls ?? []).forEach((e: any) => {
        const rec = byCourse.get(e.course_id) ?? { enrolled: 0, completed: 0 };
        rec.enrolled += 1;
        if (e.completed_at) rec.completed += 1;
        byCourse.set(e.course_id, rec);
      });
      setMetrics(rows.map((c) => ({
        id: c.id,
        title: c.title,
        visibility: c.visibility,
        enrolled: byCourse.get(c.id)?.enrolled ?? 0,
        completed: byCourse.get(c.id)?.completed ?? 0,
      })));
      setLoading(false);
    };
    void load();
  }, [employer?.id]);

  const totalEnrolled = metrics.reduce((s, m) => s + m.enrolled, 0);
  const totalCompleted = metrics.reduce((s, m) => s + m.completed, 0);
  const overallRate = totalEnrolled ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
            Enrollment and completion across your courses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total enrollments", value: totalEnrolled },
            { label: "Completions", value: totalCompleted },
            { label: "Completion rate", value: `${overallRate}%` },
          ].map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="p-5">
                <p className="font-body text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-bold text-accent mt-2">{loading ? "—" : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : metrics.length === 0 ? (
              <div className="p-10 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-body text-sm text-foreground/70 sora-regular">
                  No course data yet. Create a course to start tracking.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {metrics.map((m) => {
                  const rate = m.enrolled ? Math.round((m.completed / m.enrolled) * 100) : 0;
                  return (
                    <div key={m.id} className="p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-body sora-semibold text-sm text-foreground truncate">{m.title}</p>
                          <Badge variant="outline" className="font-body text-[10px]">{m.visibility}</Badge>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-body text-sm sora-semibold">{m.completed}/{m.enrolled}</p>
                        <p className="font-body text-xs text-muted-foreground">{rate}% complete</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployerLayout>
  );
};

export default EmployerAnalytics;