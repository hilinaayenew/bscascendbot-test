import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Linkedin, GraduationCap, Users, Eye, AlertCircle, Globe, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/utils";

interface FormData {
  full_name: string;
  bio: string;
  email: string;
  country: string;
  phone: string;
  linkedin_url: string;
  portfolio_url: string;
  expertise: string[];
  interests: string[];
  avatar_url: string | null;
}

const ProfilePreview = () => {
  const { user, profile, roles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  const isMentor = roles.includes("mentor");

  // Use unsaved form data from navigation state if available, otherwise fall back to saved profile
  const formData = (location.state as { formData?: FormData } | null)?.formData;
  const displayData = formData
    ? {
        full_name: formData.full_name,
        bio: formData.bio,
        country: formData.country,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        expertise: formData.expertise,
        interests: formData.interests,
        avatar_url: formData.avatar_url,
      }
    : profile
      ? {
          full_name: profile.full_name,
          bio: profile.bio,
          country: (profile as any).country,
          linkedin_url: profile.linkedin_url,
          portfolio_url: (profile as any).portfolio_url,
          expertise: profile.expertise,
          interests: profile.interests,
          avatar_url: profile.avatar_url,
        }
      : null;

  useEffect(() => {
    if (!user || !isMentor) return;
    const fetch = async () => {
      const { data } = await supabase.from("mentor_details").select("approval_status").eq("user_id", user.id).single();
      setApprovalStatus(data?.approval_status || null);
    };
    fetch();
  }, [user, isMentor]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user || !displayData) return <Navigate to="/mentee-auth" replace />;

  const avatarUrl = resolveAvatarUrl(displayData.avatar_url);
  const isPending = isMentor && approvalStatus === "pending";
  const hasUnsavedEdits = !!formData;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Preview banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-body text-sm sora-semibold text-blue-900">
                This is how your profile appears to others
              </h3>
              <p className="font-body text-sm text-blue-700 mt-1">
                {isPending
                  ? "Your profile is not yet visible to mentees. It will go live once your application is approved. This preview shows how it will appear."
                  : hasUnsavedEdits
                    ? "You're previewing unsaved changes. Go back to save them."
                    : "Any changes must be made through your profile settings."}
              </p>
              {isPending && (
                <div className="flex items-center gap-1.5 mt-2 text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="font-body text-xs sora-medium">Pending approval — not yet visible to mentees</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-body shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exit preview
            </Button>
          </div>
        </div>

        {/* Profile card — read-only */}
        <Card className="shadow-elevated overflow-hidden">
          <div
            className={`h-24 ${isMentor ? "bg-gradient-to-r from-primary/80 to-primary" : "bg-gradient-to-r from-secondary/80 to-secondary"}`}
          />

          <CardContent className="relative px-6 pb-6">
            <div className="-mt-14 mb-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-card">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayData.full_name} /> : null}
                <AvatarFallback
                  className={`text-2xl font-bold ${isMentor ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}
                >
                  {displayData.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-foreground">{displayData.full_name}</h1>
              <Badge variant={isMentor ? "default" : "secondary"} className="font-body">
                {isMentor ? (
                  <>
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Mentor
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5 mr-1" />
                    Mentee
                  </>
                )}
              </Badge>
            </div>
            {displayData.country && (
              <p className="font-body text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="h-4 w-4" />
                {displayData.country}
              </p>
            )}

            {displayData.bio ? (
              <p className="font-body text-muted-foreground mt-3 leading-relaxed">{displayData.bio}</p>
            ) : (
              <p className="font-body text-muted-foreground mt-3 italic text-sm">No bio added yet.</p>
            )}

            {displayData.expertise?.length || displayData.interests?.length ? (
              <div className="mt-4">
                <h3 className="font-body text-sm font-semibold text-foreground mb-2">
                  {isMentor ? "Expertise" : "Interests"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(displayData.expertise || displayData.interests || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="font-body">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <h3 className="font-body text-sm font-semibold text-foreground mb-2">
                  {isMentor ? "Expertise" : "Interests"}
                </h3>
                <p className="font-body text-sm text-muted-foreground italic">No skills added yet.</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-5 text-muted-foreground flex-wrap">
              {displayData.linkedin_url ? (
                <a
                  href={
                    displayData.linkedin_url.startsWith("http")
                      ? displayData.linkedin_url
                      : `https://${displayData.linkedin_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-sm hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              ) : null}
              {displayData.portfolio_url ? (
                <a
                  href={
                    displayData.portfolio_url.startsWith("http")
                      ? displayData.portfolio_url
                      : `https://${displayData.portfolio_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-sm hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" /> Portfolio
                </a>
              ) : null}
              {!displayData.linkedin_url && !displayData.portfolio_url && (
                <span className="font-body text-sm italic">No links added yet.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePreview;
