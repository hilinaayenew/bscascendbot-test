import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Linkedin, Globe, MessageSquare, GraduationCap, Users, CalendarClock, UserPlus, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PaywallDialog from "@/components/PaywallDialog";
import LockedFeaturePrompt from "@/components/LockedFeaturePrompt";
import BookingCalendarDialog from "@/components/BookingCalendarDialog";
import { useActivation } from "@/hooks/useActivation";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/utils";

interface ProfileData {
  user_id: string;
  full_name: string;
  bio: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  expertise: string[] | null;
  interests: string[] | null;
  pathway_level: string | null;
  avatar_url: string | null;
}

// Mock data for demo — matches Explore page mock users
const mockUsers: (ProfileData & { role: "mentor" | "mentee" })[] = [
  {
    user_id: "mock-1",
    full_name: "Dr. Sarah Chen",
    bio: "15+ years in leadership development and executive coaching. Passionate about helping emerging leaders find their voice. I've worked with Fortune 500 executives and startup founders alike, helping them develop the confidence and skills to lead effectively.",
    email: "sarah@example.com",
    phone: null,
    linkedin_url: "https://linkedin.com",
    expertise: ["Leadership", "Executive Coaching", "Strategy", "Public Speaking", "Team Building"],
    interests: null,
    pathway_level: "Advanced",
    avatar_url: null,
    portfolio_url: null,
    role: "mentor",
  },
  {
    user_id: "mock-2",
    full_name: "Marcus Johnson",
    bio: "Serial entrepreneur with exits in fintech and edtech. Love mentoring the next generation of founders. Previously founded PayFlow (acquired 2022) and LearnBridge. Now focused on angel investing and giving back to the community.",
    email: "marcus@example.com",
    phone: "+1234567890",
    linkedin_url: "https://linkedin.com",
    expertise: ["Entrepreneurship", "Fintech", "Fundraising", "Business Strategy", "Pitching"],
    interests: null,
    pathway_level: "Advanced",
    avatar_url: null,
    portfolio_url: null,
    role: "mentor",
  },
  {
    user_id: "mock-3",
    full_name: "Priya Patel",
    bio: "Product leader at a Fortune 500 company. Specializing in AI/ML product strategy. I help aspiring PMs understand the intersection of technology and business, and how to build products that truly make a difference.",
    email: null,
    phone: null,
    linkedin_url: "https://linkedin.com",
    expertise: ["Product Management", "AI/ML", "Data Strategy", "User Research", "Roadmapping"],
    interests: null,
    pathway_level: "Intermediate",
    avatar_url: null,
    portfolio_url: null,
    role: "mentor",
  },
  {
    user_id: "mock-4",
    full_name: "Elena Volkov",
    bio: "Data scientist with 8 years of experience at top tech companies. Happy to guide aspiring analysts and ML engineers. I specialize in NLP and recommendation systems.",
    email: "elena@example.com",
    phone: null,
    linkedin_url: "https://linkedin.com",
    expertise: ["Data Science", "Machine Learning", "Python", "NLP", "Statistics"],
    interests: null,
    pathway_level: "Advanced",
    avatar_url: null,
    portfolio_url: null,
    role: "mentor",
  },
  {
    user_id: "mock-5",
    full_name: "James Okonkwo",
    bio: "Recent graduate eager to break into the tech industry. Looking for guidance on career paths and building a strong portfolio. Currently working on open-source projects and attending hackathons.",
    email: "james@example.com",
    phone: null,
    linkedin_url: null,
    expertise: null,
    interests: ["Software Engineering", "Career Growth", "Networking", "Open Source", "Web Development"],
    pathway_level: "Beginner",
    avatar_url: null,
    portfolio_url: null,
    role: "mentee",
  },
  {
    user_id: "mock-6",
    full_name: "Aisha Rahman",
    bio: "Mid-career professional transitioning from finance to product management. Looking for mentors who have made similar career pivots and can share practical advice on breaking into PM roles.",
    email: "aisha@example.com",
    phone: null,
    linkedin_url: "https://linkedin.com",
    expertise: null,
    interests: ["Product Management", "Career Transition", "Finance", "UX Design", "Analytics"],
    pathway_level: "Intermediate",
    avatar_url: null,
    portfolio_url: null,
    role: "mentee",
  },
  {
    user_id: "mock-7",
    full_name: "Carlos Rivera",
    bio: "Aspiring entrepreneur working on a social impact startup focused on education access in underserved communities. Seeking mentorship in fundraising and scaling social enterprises.",
    email: null,
    phone: "+1987654321",
    linkedin_url: null,
    expertise: null,
    interests: ["Social Impact", "Fundraising", "Startups", "Education", "Community Building"],
    pathway_level: "Beginner",
    avatar_url: null,
    portfolio_url: null,
    role: "mentee",
  },
  {
    user_id: "mock-8",
    full_name: "David Mensah",
    bio: "College junior studying computer science. Interested in internships and building real-world projects. Currently learning React and Node.js.",
    email: "david@example.com",
    phone: null,
    linkedin_url: null,
    expertise: null,
    interests: ["Web Development", "Internships", "Open Source", "React", "Node.js"],
    pathway_level: "Beginner",
    avatar_url: null,
    portfolio_url: null,
    role: "mentee",
  },
];

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: myProfile, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<"pathway" | "session">("session");
  const [sessionBookingOpen, setSessionBookingOpen] = useState(false);
  const [hasActivePairing, setHasActivePairing] = useState(false);
  const [hasPendingPairing, setHasPendingPairing] = useState(false);
  const [lockedPromptOpen, setLockedPromptOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState("");

  const isMentee = roles.includes("mentee");
  const { isActivated } = useActivation();
  const isCurrentUserMentor = roles.includes("mentor");
  const hasSubscription = myProfile?.pathway_level && !["none", "curious"].includes(myProfile.pathway_level);

  useEffect(() => {
    if (!userId || !user) return;
    // Check for active or pending pairing with this user
    const checkPairing = async () => {
      const { data } = await supabase
        .from("pairings")
        .select("id, status")
        .or(`and(mentor_id.eq.${userId},mentee_id.eq.${user.id}),and(mentor_id.eq.${user.id},mentee_id.eq.${userId})`)
        .in("status", ["active", "pending"]);
      setHasActivePairing((data || []).some((p) => p.status === "active"));
      setHasPendingPairing((data || []).some((p) => p.status === "pending"));
    };
    checkPairing();
  }, [userId, user]);

  useEffect(() => {
    if (!userId) return;

    // Check mock data first
    const mockUser = mockUsers.find((u) => u.user_id === userId);
    if (mockUser) {
      setProfileData(mockUser);
      setProfileRole(mockUser.role);
      setLoadingProfile(false);
      return;
    }

    // Otherwise fetch from DB
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const [{ data: prof }, { data: mentorData }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, full_name, bio, email, phone, linkedin_url, portfolio_url, expertise, interests, pathway_level, avatar_url",
          )
          .eq("user_id", userId)
          .single(),
        supabase.from("mentor_details").select("user_id").eq("user_id", userId).eq("approval_status", "approved"),
      ]);
      setProfileData(prof);
      setProfileRole(mentorData && mentorData.length > 0 ? "mentor" : "mentee");
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 font-body text-muted-foreground">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!profileData) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="font-body text-muted-foreground">Profile not found.</p>
          <Button variant="ghost" className="font-body mt-4" onClick={() => navigate("/dashboard/explore")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Explore
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isMentor = profileRole === "mentor";
  const isOwnProfile = user.id === profileData.user_id;
  const avatarUrl = resolveAvatarUrl(profileData.avatar_url);

  // Mentees need activation to access mentor features
  const canAccessMentorFeatures = !isMentee || isActivated;
  const canMessageMentor = !isMentor || !isMentee || (isActivated && (hasSubscription || hasActivePairing));

  const handleMessage = () => {
    if (isMentor && isMentee && !isActivated) {
      setLockedFeature("message a mentor");
      setLockedPromptOpen(true);
      return;
    }
    if (!canMessageMentor) {
      toast.error("Subscribe to a pathway or get paired with this mentor to send messages.");
      return;
    }
    navigate(`/dashboard/messages?to=${profileData.user_id}`);
  };

  const handleBookSession = () => {
    if (isMentee && !isActivated) {
      setLockedFeature("book a session with a mentor");
      setLockedPromptOpen(true);
      return;
    }
    // Activated mentees and mentors go straight to booking dialog
    setSessionBookingOpen(true);
  };

  const handleRequestPairing = async () => {
    if (isMentee && !isActivated) {
      setLockedFeature("request a pairing with a mentor");
      setLockedPromptOpen(true);
      return;
    }
    if (hasActivePairing) {
      toast.info("You're already paired with this mentor.");
      return;
    }
    if (hasPendingPairing) {
      toast.info("You already have a pairing request pending with this mentor.");
      return;
    }
    // Activated mentees bypass the subscription paywall for pairing requests
    if (!hasSubscription && !isActivated) {
      setPaywallType("pathway");
      setPaywallOpen(true);
      return;
    }
    const { error } = await supabase.from("pairings").insert({
      mentor_id: profileData!.user_id,
      mentee_id: user!.id,
      status: "pending",
      matched_by: "mentee_request",
    });
    if (error) {
      toast.error("Could not send pairing request. Please try again.");
      return;
    }
    setHasPendingPairing(true);
    toast.success("Pairing request sent! An admin will review it shortly.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="font-body" onClick={() => navigate("/dashboard/explore")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Explore
        </Button>

        <Card className="shadow-elevated overflow-hidden">
          {/* Header band */}
          <div
            className={`h-24 ${isMentor ? "bg-gradient-to-r from-primary/80 to-primary" : "bg-gradient-to-r from-secondary/80 to-secondary"}`}
          />

          <CardContent className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-14 mb-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-card">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profileData.full_name} /> : null}
                <AvatarFallback
                  className={`text-2xl font-bold ${isMentor ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}
                >
                  {profileData.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name & Role */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-foreground">{profileData.full_name}</h1>
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

            {/* Bio */}
            {profileData.bio && (
              <p className="font-body text-muted-foreground mt-3 leading-relaxed">{profileData.bio}</p>
            )}

            {/* Skills / Interests */}
            {profileData.expertise?.length || profileData.interests?.length ? (
              <div className="mt-4">
                <h3 className="font-body text-sm font-semibold text-foreground mb-2">
                  {isMentor ? "Expertise" : "Interests"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(profileData.expertise || profileData.interests || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="font-body">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Contact */}
            <div className="flex items-center gap-4 mt-5 text-muted-foreground">
              {profileData.linkedin_url && (
                <a
                  href={
                    profileData.linkedin_url.startsWith("http")
                      ? profileData.linkedin_url
                      : `https://${profileData.linkedin_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-sm hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {profileData.portfolio_url && (
                <a
                  href={
                    profileData.portfolio_url.startsWith("http")
                      ? profileData.portfolio_url
                      : `https://${profileData.portfolio_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-sm hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" /> Portfolio
                </a>
              )}
            </div>

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
                {isMentor && (
                  <Button className="font-body" onClick={handleBookSession}>
                    <CalendarClock className="h-4 w-4 mr-1.5" /> Book One-Off Session
                  </Button>
                )}

                {isMentor && (hasSubscription || isMentee) && (
                  <Button
                    variant={hasSubscription ? "secondary" : "outline"}
                    className="font-body"
                    onClick={handleRequestPairing}
                    disabled={hasActivePairing || hasPendingPairing}
                  >
                    {hasActivePairing ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-1.5" /> Already Paired
                      </>
                    ) : hasPendingPairing ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-1.5" /> Request Pending
                      </>
                    ) : !hasSubscription ? (
                      <>
                        <Lock className="h-4 w-4 mr-1.5" /> Request Pairing
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1.5" /> Request Pairing
                      </>
                    )}
                  </Button>
                )}

                <Button variant="outline" className="font-body" onClick={handleMessage} disabled={!canMessageMentor}>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  {!canMessageMentor ? "Subscribe or Pair to Message" : "Message"}
                </Button>
              </div>
            )}

            {isOwnProfile && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="outline" className="font-body" onClick={() => navigate("/dashboard/settings")}>
                  Edit Your Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          feature="mentor pairing"
          type={paywallType}
          mentorOnly={isCurrentUserMentor}
        />

        <LockedFeaturePrompt open={lockedPromptOpen} onOpenChange={setLockedPromptOpen} feature={lockedFeature} />

        <BookingCalendarDialog
          open={sessionBookingOpen}
          onOpenChange={setSessionBookingOpen}
          mentorId={profileData.user_id}
          mentorName={profileData.full_name}
        />
      </div>
    </DashboardLayout>
  );
};

export default Profile;
