import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AdminAuthStatus = "loading" | "authorized" | "unauthorized";

interface AdminAuthContextType {
  status: AdminAuthStatus;
  recheck: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  status: "loading",
  recheck: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");

  const check = useCallback(async () => {
    if (sessionStorage.getItem("admin_session") !== "true") {
      setStatus("unauthorized");
      return;
    }

    // Parallelize: get user + roles together. We can query user_roles by the
    // current authenticated user via RLS without needing the user id first
    // by using a single round-trip after getUser.
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      sessionStorage.removeItem("admin_session");
      setStatus("unauthorized");
      return;
    }

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin" as any);

    if (error && /could not find the table/i.test(error.message || "")) {
      setStatus("unauthorized");
      return;
    }

    setStatus(roles && roles.length > 0 ? "authorized" : "unauthorized");
  }, []);

  useEffect(() => {
    check();

    // Re-check on auth state changes (e.g. sign-out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("admin_session");
        setStatus("unauthorized");
      }
    });

    return () => subscription.unsubscribe();
  }, [check]);

  return (
    <AdminAuthContext.Provider value={{ status, recheck: check }}>
      {children}
    </AdminAuthContext.Provider>
  );
};