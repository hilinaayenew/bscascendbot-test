import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    sessionStorage.removeItem("admin_session");
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-accent">Ascendency Admin</span>
        </div>
        <Button variant="ghost" size="sm" className="font-body" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </header>
      <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
