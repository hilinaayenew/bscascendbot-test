import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ActivationState {
  isActivated: boolean;
  loading: boolean;
  codeUsed: string | null;
  activatedAt: string | null;
  refresh: () => Promise<void>;
}

export const useActivation = (): ActivationState => {
  const { user, roles } = useAuth();
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codeUsed, setCodeUsed] = useState<string | null>(null);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);

  const isMentee = roles.includes("mentee");

  const fetchActivation = async () => {
    if (!user || !isMentee) {
      setIsActivated(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("discount_codes")
      .select("code, redeemed_at")
      .eq("redeemed_by", user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      setIsActivated(true);
      setCodeUsed(data.code);
      setActivatedAt(data.redeemed_at);
    } else {
      setIsActivated(false);
      setCodeUsed(null);
      setActivatedAt(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivation();
  }, [user, roles]);

  return { isActivated, loading, codeUsed, activatedAt, refresh: fetchActivation };
};
