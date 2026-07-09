import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Store, DollarSign, Star, ShieldCheck, Briefcase, Search } from "lucide-react";

const Marketplace = () => {
  const { user, roles, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const isMentor = roles.includes("mentor");

  const mentorPoints = [
    { icon: Store, title: "Post your services", desc: "Publish freelance offerings, hourly rates, and availability directly from your profile." },
    { icon: DollarSign, title: "Get hired & paid", desc: "Receive booking requests from companies and individuals. Funds released after delivery." },
    { icon: Star, title: "Grow your reputation", desc: "Earn verified reviews from clients and mentees that boost your visibility on Explore." },
    { icon: ShieldCheck, title: "Protected transactions", desc: "Escrow-style payments and dispute support keep every engagement safe." },
  ];

  const menteePoints = [
    { icon: Search, title: "Discover African talent", desc: "Browse vetted freelancers, mentors, and consultants across industries and countries." },
    { icon: Briefcase, title: "Hire on-demand", desc: "Book one-off projects, advisory calls, or longer engagements — all in one place." },
    { icon: Star, title: "Trust the reviews", desc: "Every provider is rated by real clients so you can hire with confidence." },
    { icon: ShieldCheck, title: "Pay securely", desc: "Your payment is held safely and only released once the work is delivered." },
  ];

  const points = isMentor ? mentorPoints : menteePoints;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Marketplace</h1>
          <Badge variant="secondary" className="font-body">Coming Soon</Badge>
        </div>

        <Card className="shadow-card border-l-4 border-crimson">
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-md bg-crimson-light flex items-center justify-center mb-5">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-accent mb-3">
              {isMentor
                ? "Turn your expertise into income"
                : "Hire trusted African talent — on your terms"}
            </h2>
            <p className="font-body text-sm text-foreground/70 leading-relaxed sora-regular">
              {isMentor
                ? "The Ascendency Marketplace will let you list your freelance services alongside your mentorship profile. Set your rates, manage availability, and get hired by individuals and organisations across Africa and the diaspora — with secure payments and reviews built in."
                : "The Ascendency Marketplace will be your one-stop hub to discover and hire African freelancers, consultants, and mentors. Browse by skill, country, or industry, book engagements directly, and pay securely — knowing every provider has been vetted by the community."}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="shadow-card">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-md bg-crimson-light flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-accent mb-2">{p.title}</h3>
                  <p className="font-body text-sm text-foreground/70 leading-relaxed sora-regular">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-card bg-muted">
          <CardContent className="p-6 text-center">
            <p className="font-body text-sm text-foreground/70 sora-regular">
              We're building this with the community. Want early access when it launches?{" "}
              <span className="text-primary sora-semibold">Stay tuned — you'll be the first to know.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;