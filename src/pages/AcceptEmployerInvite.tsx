import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AcceptEmployerInvite = () => {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!token) {
      setStatus("error");
      setMessage("Missing invite token.");
      return;
    }
    if (!user) {
      navigate(`/auth?role=mentee&invite=${token}&next=/employer/invite?token=${token}`, { replace: true });
      return;
    }
    const run = async () => {
      const { data, error } = await supabase.rpc("accept_employer_invite" as any, { p_token: token });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      const result = data as any;
      if (result?.status === "accepted") {
        setStatus("success");
        setMessage("You've joined the team.");
        setTimeout(() => navigate("/dashboard/courses"), 1500);
      } else {
        setStatus("error");
        setMessage(
          result?.status === "already_accepted"
            ? "This invite has already been accepted."
            : result?.status === "revoked"
              ? "This invite was revoked."
              : result?.status === "no_seats"
                ? "The team has no more seats available."
                : "This invite link is invalid.",
        );
      }
    };
    void run();
  }, [loading, user, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {status === "working" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="font-body text-sm text-foreground/70">Joining team...</p>
            </>
          )}
          {status === "success" && (
            <>
              <h1 className="font-display text-xl font-bold text-accent">You're in!</h1>
              <p className="font-body text-sm text-foreground/70">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className="font-display text-xl font-bold text-accent">Invite unavailable</h1>
              <p className="font-body text-sm text-foreground/70">{message}</p>
              <Button onClick={() => navigate("/dashboard")} className="font-body sora-semibold">
                Go to dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptEmployerInvite;