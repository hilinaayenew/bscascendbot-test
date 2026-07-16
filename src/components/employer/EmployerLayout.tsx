import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  Building2,
  LogOut,
  Menu,
  Loader2,
  Store,
} from "lucide-react";
import TourLauncher from "@/components/WelcomeTourDialog";

const EmployerLayout = ({ children }: { children: ReactNode }) => {
  const { user, profile, roles, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isEmployer = roles.includes("employer");

  useEffect(() => {
    if (!loading && user && !isEmployer) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, isEmployer, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?role=employer" replace />;
  if (!isEmployer) return null;

  const navItems = [
    { label: "Dashboard", href: "/employer", icon: LayoutDashboard, exact: true },
    { label: "Courses", href: "/employer/courses", icon: BookOpen },
    { label: "Marketplace", href: "/employer/marketplace", icon: Store },
    { label: "Analytics", href: "/employer/analytics", icon: BarChart3 },
    { label: "Team", href: "/employer/team", icon: Users },
    { label: "Company Profile", href: "/employer/profile", icon: Building2 },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform md:translate-x-0 md:sticky md:top-0 md:h-screen ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link to="/" className="font-display text-xl font-bold text-accent tracking-tight">
              Ascendency
            </Link>
            <p className="font-body text-xs text-muted-foreground mt-1">Employer workspace</p>
          </div>
          <nav className="flex-1 px-4 pt-2 pb-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
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
                <p className="font-body text-sm font-medium truncate">{profile?.full_name || "Employer"}</p>
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-bold text-accent md:hidden">Ascendency</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <TourLauncher role="employer" />
    </div>
  );
};

export default EmployerLayout;