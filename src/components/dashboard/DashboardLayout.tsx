/**
 * Purpose: Dashboard layout with sidebar navigation and notification dot for upcoming sessions
 * DB tables: bookings (for notification dot check)
 */
import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Target,
  Calendar,
  LogOut,
  Menu,
  X,
  Settings,
  CreditCard,
  GraduationCap,
  MessagesSquare,
  ClipboardList,
  HelpCircle,
  Rocket,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours } from "date-fns";
import FeedbackGate from "@/components/dashboard/FeedbackGate";
import HelpSheet from "@/components/help/HelpSheet";
import TourLauncher from "@/components/WelcomeTourDialog";
import AICoachWidget from "@/components/AICoachWidget";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, profile, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUpcomingSession, setHasUpcomingSession] = useState(false);

  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");

  // Check for sessions in next 24 hours (notification dot)
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const now = new Date();
      const tomorrow = addHours(now, 24);
      const todayStr = format(now, "yyyy-MM-dd");
      const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("booking_date", todayStr)
        .lte("booking_date", tomorrowStr);

      setHasUpcomingSession((count || 0) > 0);
    };
    check();
  }, [user]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Courses", href: "/dashboard/courses", icon: GraduationCap },
    { label: "Explore", href: "/dashboard/explore", icon: Users },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Forum", href: "/dashboard/forum", icon: MessagesSquare },
    { label: "Project Wall", href: "/dashboard/projects", icon: Rocket },
    { label: "My Pairings", href: "/dashboard/pairings", icon: Target },
    { label: "Sessions", href: "/dashboard/sessions", icon: Calendar, dot: hasUpcomingSession },
    { label: "Feedback", href: "/dashboard/feedback", icon: ClipboardList },
    { label: "Help", href: "/dashboard/help", icon: HelpCircle },
    { label: "Profile Settings", href: "/dashboard/settings", icon: Settings },
    ...(isMentee && !isMentor ? [{ label: "Subscribe", href: "/dashboard/subscribe", icon: CreditCard }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform md:translate-x-0 md:sticky md:top-0 md:h-screen ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link to="/" className="font-display text-xl font-bold text-accent tracking-tight">
              Ascendency
            </Link>
            <p className="font-body text-xs text-muted-foreground mt-1">{isMentor ? "Mentor" : "Mentee"} Dashboard</p>
          </div>

          <nav className="flex-1 px-4 pt-2 pb-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm transition-colors relative ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {"dot" in item && item.dot && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body text-sm font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                <p className="font-body text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start font-body" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-bold text-accent md:hidden">Ascendency</span>
          <div className="ml-auto">
            <HelpSheet />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <FeedbackGate />
      <TourLauncher />
      <AICoachWidget />
    </div>
  );
};

export default DashboardLayout;
