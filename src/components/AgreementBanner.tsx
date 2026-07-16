/**
 * Dashboard banner prompting mentor or mentee to complete/sign their mentorship agreement.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature } from "lucide-react";

type Pending = {
  pairing_id: string;
  status: "pending_details" | "pending_signatures" | "complete";
  mentee_signature: string | null;
  mentor_signature: string | null;
  mentor_id: string;
  mentee_id: string;
};

const AgreementBanner = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Pending[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("agreements" as any)
        .select("pairing_id, status, mentee_signature, mentor_signature, mentor_id, mentee_id")
        .or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .neq("status", "complete");
      if (cancelled) return;
      setItems(((data as unknown) as Pending[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const isMentor = user.id === a.mentor_id;
        const mySig = isMentor ? a.mentor_signature : a.mentee_signature;
        const message = mySig
          ? "Waiting on the other party to sign your mentorship agreement."
          : a.status === "pending_signatures"
            ? "Your mentorship agreement is ready to sign."
            : "Your mentorship agreement is ready to complete.";
        return (
          <Card key={a.pairing_id} className="shadow-card border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <FileSignature className="h-5 w-5 text-primary shrink-0" />
              <p className="font-body text-sm flex-1 min-w-[200px]">{message}</p>
              <Link to={`/dashboard/agreement/${a.pairing_id}`}>
                <Button size="sm" className="font-body">
                  {mySig ? "View agreement" : "Open agreement"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AgreementBanner;