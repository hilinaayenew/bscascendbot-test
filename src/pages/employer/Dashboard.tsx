import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmployerLayout from "@/components/employer/EmployerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyEmployer } from "@/hooks/useEmployer";

const EmployerDashboard = () => {
  const { employer, loading } = useMyEmployer();
  const [stats, setStats] = useState({
    teamCount: 0,
    pendingInvites: 0,
    courses: 0,
    enrollments: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!employer) return;
    const load = async () => {
      setLoadingStats(true);
      const [team, invites, courses] = await Promise.all([
        supabase.from("employer_team_members").select("id", { count: "exact", head: true }).eq("employer_id", employer.id),
        supabase
          .from("employer_team_invites")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", employer.id)
          .is("accepted_at", null)
          .is("revoked_at", null),
        supabase.from("employer_courses").select("id").eq("employer_id", employer.id),
      ]);
      const courseIds = (courses.data ?? []).map((c: any) => c.id);
      let enrollments = 0;
      if (courseIds.length) {
        const { count } = await supabase
          .from("employer_course_enrollments")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds);
        enrollments = count ?? 0;
      }
      setStats({
        teamCount: team.count ?? 0,
        pendingInvites: invites.count ?? 0,
        courses: courseIds.length,
        enrollments,
      });
      setLoadingStats(false);
    };
    void load();
  }, [employer?.id]);

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </EmployerLayout>
    );
  }

  const seatsUsed = stats.teamCount;
  const seatLimit = employer?.seat_limit ?? 10;

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {employer?.company_name || "Employer dashboard"}
          </h1>
          <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
            Manage your team, upload courses, and track their learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Team members", value: `${seatsUsed} / ${seatLimit}`, icon: Users, href: "/employer/team" },
            { label: "Pending invites", value: stats.pendingInvites, icon: Mail, href: "/employer/team" },
            { label: "Courses", value: stats.courses, icon: BookOpen, href: "/employer/courses" },
            { label: "Enrollments", value: stats.enrollments, icon: GraduationCap, href: "/employer/analytics" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.href}>
                <Card className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-xs text-muted-foreground">{s.label}</p>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-display text-2xl font-bold text-accent mt-2">
                      {loadingStats ? "—" : s.value}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="shadow-card border-l-4 border-crimson">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="font-body sora-semibold text-sm text-foreground">
                Plan: {employer?.plan ?? "starter"} · {employer?.subscription_status ?? "trial"}
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                You can add up to {seatLimit} team members. Manage your plan under Company Profile.
              </p>
            </div>
            <Link to="/employer/profile">
              <Button size="sm" variant="outline" className="font-body sora-semibold">Manage plan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </EmployerLayout>
  );
};

export default EmployerDashboard;