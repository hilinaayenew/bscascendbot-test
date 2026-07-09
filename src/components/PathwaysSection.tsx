/**
 * PathwaysSection – Landing page pricing tiers
 * Displays Curious, Mentee, ApprentSis, and Mentor tiers with features and CTAs
 */
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const levels = [
  {
    number: "1",
    title: "Curious",
    subtitle: "Foundation Builder",
    price: "$1",
    period: "/month",
    description:
      "Start your growth journey. Get access to vetted mentors, masterclasses, workshops, and AI-powered career tools — all for less than a cup of coffee.",
    features: [
      {
        name: "Access to our list of vetted mentors",
        detail: "Browse and connect with experienced professionals across industries.",
      },
      {
        name: "On-Demand Masterclasses",
        detail: "Watch expert-led sessions on leadership, tech, and career growth — anytime.",
      },
      {
        name: "Monthly Technical Workshops",
        detail: "Hands-on sessions to sharpen your tech and digital skills.",
      },
      {
        name: "Community forum access",
        detail: "Join conversations, ask questions, and learn from peers across Africa.",
      },
      {
        name: "Access to Ascendency AI",
        detail: "Your personal AI career assistant for guidance, prep, and planning.",
      },
      {
        name: "Freelance marketplace profile",
        detail: "Showcase your skills and get discovered by clients and companies.",
      },
    ],
    ctas: [{ label: "Join Now", variant: "default" as const }],
  },
  {
    number: "2",
    title: "Mentee",
    subtitle: "Acceleration",
    price: "$10",
    period: "/month",
    description:
      "Go further with dedicated mentorship. Get paired with a personal mentor, join leadership workshops, and accelerate your career with structured support.",
    features: [
      { name: "All Curious tier benefits, with the addition of", detail: "" },
      {
        name: "Monthly meetings with your personal mentor",
        detail: "One-on-one sessions tailored to your goals and career stage.",
      },
      {
        name: "Monthly leadership workshops",
        detail: "Develop the soft skills and strategic thinking to lead with confidence.",
      },
      {
        name: "Featured marketplace listing",
        detail: "Stand out to employers and clients with a highlighted profile.",
      },
      {
        name: "Monthly career building group",
        detail: "Collaborate with a small group of peers on career goals and accountability.",
      },
    ],
    highlighted: true,
    ctas: [
      { label: "Join Now", variant: "default" as const },
      { label: "Apply for Scholarship", variant: "outline" as const },
    ],
  },
  {
    number: "3",
    title: "ApprentSis",
    subtitle: "Career Launchpad",
    price: "$25",
    period: "/month",
    description:
      "Our ApprentSis programme is open to mentees who have completed our three-month programme. We help you find a placement to take you to the next step in your career.",
    features: [
      { name: "Building on the Mentee tier, members also receive", detail: "" },
      {
        name: "Access to Bloom & Build Brunches",
        detail: "Exclusive invitation to our annual BSC brunch with industry leaders.", // CHANGED: was "Exclusive in-person and virtual gatherings with industry leaders."
      },
      {
        name: "Networking opportunities",
        detail: "Curated introductions and events to expand your professional circle.",
      },
    ],
    ctas: [
      { label: "Join Now", variant: "default" as const },
      { label: "Apply for Scholarship", variant: "outline" as const },
    ],
  },
];

const mentorTier = {
  title: "Become a Mentor",
  description:
    "You have access to all the advantages of our members — plus exclusive perks for giving back.",
  features: [
    "All member benefits included",
    "Exclusive invite to our Bloom & Build Brunches", // CHANGED: was "Invite to our Bloom & Build Brunches"
    "Networking opportunities with industry leaders",
    "Shape the next generation of African professionals",
  ],
};

const PathwaysSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pathways" className="py-20 md:py-28 section-warm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-accent mb-4">
            Curated Mentorship Pathways
          </h2>
          <p className="font-body text-sm md:text-base text-foreground/70 sora-regular">
            Your monthly platform for growth. Vetted mentors, masterclasses, workshops, a marketplace, and AI-powered tools — all in one place.
          </p>
        </div>

        {/* Pathway tiers */}
        <div className="flex flex-col gap-6">
          {levels.map((level) => (
            <div
              key={level.number}
              className={`relative rounded-lg border overflow-hidden transition-all ${
                level.highlighted
                  ? "bg-card border-primary shadow-elevated"
                  : "bg-card border-border shadow-card"
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 p-8 lg:p-10">
                {/* Large numeral */}
                <div className="shrink-0">
                  <span className="font-display text-7xl lg:text-8xl font-bold text-primary/15">
                    {level.number}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-display text-2xl font-bold text-accent">
                      {level.title}
                    </h3>
                    {level.subtitle && (
                      <span className="font-body text-sm sora-medium text-primary">
                        {level.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-foreground/70 mb-4 max-w-xl leading-relaxed sora-regular">
                    {level.description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {level.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-body text-sm font-medium text-foreground sora-medium">
                            {feature.name}
                          </span>
                          {feature.detail && (
                            <p className="font-body text-xs text-muted-foreground sora-regular leading-relaxed">
                              {feature.detail}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price + CTA */}
                <div className="shrink-0 text-center lg:text-right">
                  <div className="mb-4">
                    <span className="font-bold text-accent font-sans text-5xl">
                      {level.price}
                    </span>
                    <span className="font-body text-muted-foreground sora-light">
                      {level.period}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {level.ctas.map((cta) => (
                      <Button
                        key={cta.label}
                        variant={cta.variant}
                        size="lg"
                        className="font-body sora-semibold"
                      >
                        {cta.label}
                      </Button>
                    ))}
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-2 sora-light">
                    Cancel anytime
                  </p>
                </div>
              </div>
              {level.highlighted && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs sora-semibold px-4 py-1 rounded-bl-md">
                  Most Popular
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mentor tier */}
        <div className="mt-8 rounded-lg border border-primary/40 bg-accent/5 p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="shrink-0">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-2xl font-bold text-accent mb-1">
                {mentorTier.title}
              </h3>
              <p className="font-body text-sm text-foreground/70 mb-4 max-w-xl leading-relaxed sora-regular">
                {mentorTier.description}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mentorTier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 font-body text-sm text-foreground sora-regular"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0">
              <Button
                variant="default"
                size="lg"
                className="font-body sora-semibold"
                onClick={() => navigate("/mentor-auth")}
              >
                Apply as a Mentor
              </Button>
            </div>
          </div>
        </div>

        {/* One-off sessions note */}
        <div className="mt-8 text-center bg-card rounded-lg p-8 border border-border shadow-card">
          <h3 className="font-display text-xl font-semibold text-accent mb-2">
            Prefer a One-Off Session?
          </h3>
          <p className="font-body text-sm text-foreground/70 max-w-xl mx-auto mb-4 sora-regular">
            Book a single mentorship session with any mentor for a flat fee. But a monthly pathway gives you more sessions, learning resources, and marketplace access — making it far more valuable long term.
          </p>
          <Button variant="outline" className="font-body sora-semibold">
            Book a Single Session — from $35
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PathwaysSection;
