import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, Target, Calendar } from "lucide-react";
import ActivationBanner from "@/components/ActivationBanner";
import MentorStatusBanner from "@/components/MentorStatusBanner";
import UpcomingSessions from "@/components/dashboard/UpcomingSessions";
import UpcomingWorkshopsWidget from "@/components/dashboard/UpcomingWorkshopsWidget";

const Dashboard = () => {
  const { user, roles, loading, profile } = useAuth();
  const [stats, setStats] = useState({ pairings: 0, messages: 0, sessions: 0, goals: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const isMentor = roles.includes("mentor");
      const pairingCol = isMentor ? "mentor_id" : "mentee_id";

      const [pairings, messages, sessions, pairingIdsRes] = await Promise.all([
        supabase
          .from("pairings")
          .select("id", { count: "exact", head: true })
          .eq(pairingCol, user.id)
          .eq("status", "active"),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("read", false),
        supabase.from("session_logs").select("id", { count: "exact", head: true }).eq("logged_by", user.id),
        supabase
          .from("pairings")
          .select("id")
          .eq(pairingCol, user.id),
      ]);

      const pairingIds = (pairingIdsRes.data || []).map((p) => p.id);
      let goalsCount = 0;
      if (pairingIds.length > 0) {
        const { count } = await supabase
          .from("goals")
          .select("id", { count: "exact", head: true })
          .in("pairing_id", pairingIds)
          .eq("completed", false);
        goalsCount = count || 0;
      }

      setStats({
        pairings: pairings.count || 0,
        messages: messages.count || 0,
        sessions: sessions.count || 0,
        goals: goalsCount,
      });
    };
    fetchStats();
  }, [user, roles]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const isMentor = roles.includes("mentor");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MentorStatusBanner />
        <ActivationBanner />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name || "there"}!
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            {isMentor ? "Here's an overview of your mentorship activity." : "Track your mentorship journey."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Pairings", value: stats.pairings, icon: Target, color: "text-primary" },
            { label: "Unread Messages", value: stats.messages, icon: MessageSquare, color: "text-accent" },
            { label: "Sessions Logged", value: stats.sessions, icon: Calendar, color: "text-primary" },
            { label: "Goals Set", value: stats.goals, icon: Users, color: "text-accent" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between min-h-[80px]">
                    <div>
                      <p className="font-body text-sm text-muted-foreground min-h-[2.5rem] flex items-start">
                        {stat.label}
                      </p>
                      <p className="font-display text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-60 mt-1`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <UpcomingSessions userId={user.id} />
        <UpcomingWorkshopsWidget limit={5} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
