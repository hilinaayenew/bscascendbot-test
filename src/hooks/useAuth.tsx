import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const isMissingSchemaError = (error: { code?: string; status?: number; message?: string } | null) => {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.status === 404 ||
    /could not find the (table|function)/i.test(error.message ?? "")
  );
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // email and phone are restricted at the column level; fetch them via RPC for the owner.
    const [{ data, error: profileError }, { data: contact, error: contactError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, full_name, bio, country, username, avatar_url, linkedin_url, portfolio_url, expertise, interests, pathway_level, created_at, updated_at, email_notify_new_message, email_notify_message_reminders")
        .eq("user_id", userId)
        .single(),
      supabase.rpc("get_my_contact_info" as any),
    ]);

    const hasMissingSchema = isMissingSchemaError(profileError) || isMissingSchemaError(contactError);
    if (hasMissingSchema) {
      setProfile(null);
      return;
    }

    const c = Array.isArray(contact) ? (contact as any[])[0] : null;
    setProfile(data ? ({ ...(data as any), email: c?.email ?? null, phone: c?.phone ?? null } as any) : null);
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (isMissingSchemaError(error)) {
      setRoles([]);
      return;
    }

    setRoles(data?.map((r) => r.role) || []);
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    const isAdminSession = sessionStorage.getItem("admin_session") === "true";

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // If this is an admin session, don't populate platform auth
        if (isAdminSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRoles([]);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(session.user.id),
              fetchRoles(session.user.id),
            ]);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isAdminSession) {
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchRoles(session.user.id),
        ]).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
