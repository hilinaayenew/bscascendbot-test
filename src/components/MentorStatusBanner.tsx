import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, X, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MentorStatusBanner = () => {
  const { user, roles } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isMentor = roles.includes("mentor");

  useEffect(() => {
    if (!user || !isMentor) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("mentor_details")
        .select("approval_status")
        .eq("user_id", user.id)
        .single();
      setApprovalStatus(data?.approval_status || null);
    };
    fetch();
  }, [user, isMentor]);

  useEffect(() => {
    if (approvalStatus === "approved") {
      const key = `mentor_approved_banner_dismissed_${user?.id}`;
      setDismissed(localStorage.getItem(key) === "true");
    }
  }, [approvalStatus, user]);

  if (!isMentor || !approvalStatus) return null;

  // Approved + dismissed → show small badge only
  if (approvalStatus === "approved" && dismissed) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-body text-xs gap-1.5 hover:bg-emerald-100">
          <Shield className="h-3 w-3" />
          Approved Mentor
        </Badge>
      </div>
    );
  }

  if (approvalStatus === "pending") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-body text-sm sora-semibold text-amber-900">
              Your application is under review
            </h3>
            <p className="font-body text-sm text-amber-800 mt-1 leading-relaxed">
              We're reviewing your mentor application — it shouldn't be a long wait. In the meantime, you can complete your profile under Settings, browse the platform, and take courses.
            </p>
            <p className="font-body text-xs text-amber-600 mt-2">
              Once approved, your profile will be visible to mentees and you'll be able to accept pairing requests, book sessions, and message mentees.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (approvalStatus === "approved" && !dismissed) {
    const dismissKey = `mentor_approved_banner_dismissed_${user?.id}`;
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-body text-sm sora-semibold text-emerald-900">
                🎉 You're approved — welcome to the mentor community!
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 shrink-0"
                onClick={() => {
                  localStorage.setItem(dismissKey, "true");
                  setDismissed(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="font-body text-sm text-emerald-800 mt-1 leading-relaxed">
              Your profile is now live on the Explore page. Mentees can send you pairing requests, you can book sessions, and message your mentees directly.
            </p>
            <p className="font-body text-xs text-emerald-600 mt-2">
              Head over to the <strong>Settings</strong> page to update your profile and availability so mentees can connect with you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MentorStatusBanner;
