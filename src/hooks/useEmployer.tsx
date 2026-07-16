import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EmployerDetailsRow {
  id: string;
  user_id: string;
  company_name: string | null;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  plan: string;
  subscription_status: string;
  seat_limit: number;
  current_period_end: string | null;
}

export const useMyEmployer = () => {
  const { user } = useAuth();
  const [employer, setEmployer] = useState<EmployerDetailsRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setEmployer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("employer_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setEmployer((data as EmployerDetailsRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { employer, loading, refresh: load };
};