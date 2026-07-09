import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Search, GraduationCap, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/utils";

interface ExploreUser {
  user_id: string;
  full_name: string;
  bio: string | null;
  expertise: string[] | null;
  interests: string[] | null;
  pathway_level: string | null;
  avatar_url: string | null;
  country: string | null;
  role: "mentor" | "mentee";
  isMock?: boolean;
}

/*const MOCK_USERS: ExploreUser[] = [
  { user_id: "mock-1", full_name: "Dr. Sarah Chen", bio: "15+ years in leadership development and executive coaching. Passionate about helping emerging leaders find their voice.", expertise: ["Leadership", "Executive Coaching", "Strategy", "Public Speaking"], interests: null, pathway_level: "Advanced", avatar_url: null, country: "United States", role: "mentor", isMock: true },
  { user_id: "mock-2", full_name: "Marcus Johnson", bio: "Serial entrepreneur with exits in fintech and edtech. Love mentoring the next generation of founders.", expertise: ["Entrepreneurship", "Fintech", "Fundraising", "Business Strategy"], interests: null, pathway_level: "Advanced", avatar_url: null, country: "United Kingdom", role: "mentor", isMock: true },
  { user_id: "mock-3", full_name: "Priya Patel", bio: "Product leader at a Fortune 500 company. Specializing in AI/ML product strategy.", expertise: ["Product Management", "AI/ML", "Data Strategy", "User Research"], interests: null, pathway_level: "Intermediate", avatar_url: null, country: "India", role: "mentor", isMock: true },
  { user_id: "mock-4", full_name: "Elena Volkov", bio: "Data scientist with 8 years of experience at top tech companies. Happy to guide aspiring analysts and ML engineers.", expertise: ["Data Science", "Machine Learning", "Python", "NLP"], interests: null, pathway_level: "Advanced", avatar_url: null, country: "Germany", role: "mentor", isMock: true },
  { user_id: "mock-5", full_name: "James Okonkwo", bio: "Recent graduate eager to break into the tech industry. Looking for guidance on career paths and building a strong portfolio.", expertise: null, interests: ["Software Engineering", "Career Growth", "Networking", "Open Source"], pathway_level: "Beginner", avatar_url: null, country: "Nigeria", role: "mentee", isMock: true },
  { user_id: "mock-6", full_name: "Aisha Rahman", bio: "Mid-career professional transitioning from finance to product management. Looking for mentors who have made similar career pivots.", expertise: null, interests: ["Product Management", "Career Transition", "Finance", "UX Design"], pathway_level: "Intermediate", avatar_url: null, country: "Canada", role: "mentee", isMock: true },
  { user_id: "mock-7", full_name: "Carlos Rivera", bio: "Aspiring entrepreneur working on a social impact startup focused on education access in underserved communities.", expertise: null, interests: ["Social Impact", "Fundraising", "Startups", "Education"], pathway_level: "Beginner", avatar_url: null, country: "Mexico", role: "mentee", isMock: true },
  { user_id: "mock-8", full_name: "David Mensah", bio: "College junior studying computer science. Interested in internships and building real-world projects.", expertise: null, interests: ["Web Development", "Internships", "Open Source", "React"], pathway_level: "Beginner", avatar_url: null, country: "Ghana", role: "mentee", isMock: true },
];
*/
const UserCard = ({ u, navigate }: { u: ExploreUser; navigate: ReturnType<typeof useNavigate> }) => (
  <Card
    className="shadow-card hover:shadow-elevated transition-shadow border-l-4 cursor-pointer"
    style={{ borderLeftColor: u.role === "mentor" ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}
    onClick={() => navigate(`/dashboard/profile/${u.user_id}`)}
  >
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${u.role === "mentor" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}
        >
          {u.avatar_url ? (
            <img
              src={resolveAvatarUrl(u.avatar_url)!}
              alt={u.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            u.full_name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-body font-semibold text-foreground truncate">{u.full_name}</h3>
            <Badge variant={u.role === "mentor" ? "default" : "secondary"} className="font-body text-xs shrink-0">
              {u.role === "mentor" ? (
                <>
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Mentor
                </>
              ) : (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Mentee
                </>
              )}
            </Badge>
          </div>
          {u.country && (
            <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {u.country}
            </p>
          )}
          <p className="font-body text-sm text-muted-foreground line-clamp-2 mt-1">{u.bio || "No bio yet"}</p>
        </div>
      </div>

      {u.expertise?.length || u.interests?.length ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(u.expertise || u.interests || []).slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="font-body text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <p className="font-body text-xs text-primary mt-3">View Profile →</p>
    </CardContent>
  </Card>
);

const Explore = () => {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      setFetching(true);

      // Fetch approved mentors
      const { data: mentorRows } = await supabase
        .from("mentor_details")
        .select("user_id")
        .eq("approval_status", "approved");

      const approvedMentorIds = (mentorRows || []).map((r) => r.user_id);

      // Fetch mentee role user IDs
      const { data: menteeRoleRows } = await supabase.from("user_roles").select("user_id").eq("role", "mentee");

      const menteeIds = (menteeRoleRows || []).map((r) => r.user_id);

      let results: ExploreUser[] = [];

      // Fetch mentor profiles
      if (approvedMentorIds.length > 0) {
        const { data: mentorProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, bio, expertise, interests, pathway_level, avatar_url, country")
          .in("user_id", approvedMentorIds);

        results.push(
          ...(mentorProfiles || []).map((p) => ({
            ...p,
            role: "mentor" as const,
          })),
        );
      }

      // Fetch mentee profiles
      if (menteeIds.length > 0) {
        const { data: menteeProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, bio, expertise, interests, pathway_level, avatar_url, country")
          .in("user_id", menteeIds);

        results.push(
          ...(menteeProfiles || []).map((p) => ({
            ...p,
            role: "mentee" as const,
          })),
        );
      }

      // Exclude current user and deduplicate (user could be both mentor & mentee)
      const seen = new Set<string>();
      results = results.filter((u) => {
        if (u.user_id === user.id || seen.has(u.user_id)) return false;
        seen.add(u.user_id);
        return true;
      });

      setUsers(results);
      setFetching(false);
    };

    fetchUsers();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.expertise?.some((e) => e.toLowerCase().includes(q)) ||
      u.interests?.some((i) => i.toLowerCase().includes(q));
    const matchesTab = tab === "all" || u.role === tab;
    return matchesSearch && matchesTab;
  });

  const mentorCount = users.filter((u) => u.role === "mentor").length;
  const menteeCount = users.filter((u) => u.role === "mentee").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Explore the Community</h1>
          <p className="font-body text-muted-foreground mt-1">
            Browse mentors and mentees in the Ascendency community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all" className="font-body">
                All ({users.length})
              </TabsTrigger>
              <TabsTrigger value="mentor" className="font-body">
                <GraduationCap className="h-4 w-4 mr-1.5" /> Mentors ({mentorCount})
              </TabsTrigger>
              <TabsTrigger value="mentee" className="font-body">
                <Users className="h-4 w-4 mr-1.5" /> Mentees ({menteeCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-body"
            />
          </div>
        </div>

        {fetching ? (
          <div className="text-center py-12">
            <p className="font-body text-muted-foreground">Loading profiles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((u) => (
              <UserCard key={u.user_id} u={u} navigate={navigate} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="font-body text-muted-foreground">
                  {tab === "mentee" ? "No mentees found." : tab === "mentor" ? "No mentors found." : "No users found."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Explore;
