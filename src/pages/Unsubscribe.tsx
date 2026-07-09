import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type UnsubState = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<UnsubState>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already_unsubscribed");
        } else if (data.valid) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        setState("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) {
        setState("success");
      } else if (data?.reason === "already_unsubscribed") {
        setState("already_unsubscribed");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Email Preferences</h1>

        {state === "loading" && (
          <p className="text-muted-foreground">Verifying your request…</p>
        )}

        {state === "valid" && (
          <>
            <p className="text-muted-foreground">
              Click below to unsubscribe from future emails. You'll still receive essential account-related messages.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {processing ? "Processing…" : "Confirm Unsubscribe"}
            </button>
          </>
        )}

        {state === "success" && (
          <p className="text-muted-foreground">
            You've been unsubscribed. You will no longer receive these emails.
          </p>
        )}

        {state === "already_unsubscribed" && (
          <p className="text-muted-foreground">
            You're already unsubscribed from these emails.
          </p>
        )}

        {state === "invalid" && (
          <p className="text-destructive">
            This unsubscribe link is invalid or has expired.
          </p>
        )}

        {state === "error" && (
          <p className="text-destructive">
            Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
