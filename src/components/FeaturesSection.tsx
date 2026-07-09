import { Sparkles, Target, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Mentor Matching",
    description:
      "Our intelligent algorithm analyses your goals, experience, and preferences to connect you with the ideal mentor — creating meaningful, high-impact relationships.",
  },
  {
    icon: Target,
    title: "Curated Learning Resources",
    description:
      "Access courses from partners like Coursera, industry-specific guides, and skill-building content tailored to the African professional landscape.",
  },
  {
    icon: TrendingUp,
    title: "Freelance Marketplace",
    description:
      "Post your availability, showcase your expertise, and get hired by individuals and companies across the continent and beyond.",
  },
  {
    icon: Shield,
    title: "Mentor-First Payments",
    description:
      "Mentors get paid only after delivering their service through completed bookings. This ensures quality and builds trust in every interaction.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-accent mb-6">
              Built for How
              <br />
              Africans Work
            </h2>
            <p className="font-body text-sm md:text-base text-foreground/70 mb-10 leading-relaxed max-w-lg sora-regular">
              Every feature is designed with the African professional in mind — from intelligent matching that understands your context, to a marketplace that amplifies your skills across borders.
            </p>

            <div className="flex flex-col gap-8 stagger-children">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-md bg-crimson-light flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-accent mb-1">
                      {feature.title}
                    </h3>
                    <p className="font-body text-sm text-foreground/70 leading-relaxed sora-regular">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — decorative geometric pattern */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <svg viewBox="0 0 400 400" className="w-full h-full" aria-hidden="true">
                {/* Crimson lines */}
                <line x1="0" y1="80" x2="400" y2="320" stroke="hsl(348, 87%, 43%)" strokeWidth="1.5" opacity="0.3" />
                <line x1="40" y1="0" x2="360" y2="400" stroke="hsl(348, 87%, 43%)" strokeWidth="1.5" opacity="0.2" />
                <line x1="100" y1="0" x2="300" y2="400" stroke="hsl(348, 87%, 43%)" strokeWidth="2" opacity="0.4" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="hsl(348, 87%, 43%)" strokeWidth="1" opacity="0.15" />
                {/* Maroon lines */}
                <line x1="400" y1="80" x2="0" y2="320" stroke="hsl(320, 80%, 18%)" strokeWidth="1.5" opacity="0.3" />
                <line x1="360" y1="0" x2="40" y2="400" stroke="hsl(320, 80%, 18%)" strokeWidth="1.5" opacity="0.2" />
                <line x1="300" y1="0" x2="100" y2="400" stroke="hsl(320, 80%, 18%)" strokeWidth="2" opacity="0.4" />
                <line x1="200" y1="0" x2="200" y2="400" stroke="hsl(320, 80%, 18%)" strokeWidth="1" opacity="0.15" />
                {/* Diamond shapes */}
                <polygon points="200,60 340,200 200,340 60,200" fill="none" stroke="hsl(348, 87%, 43%)" strokeWidth="2" opacity="0.2" />
                <polygon points="200,120 280,200 200,280 120,200" fill="none" stroke="hsl(320, 80%, 18%)" strokeWidth="2" opacity="0.2" />
                {/* Center */}
                <circle cx="200" cy="200" r="24" fill="hsl(348, 87%, 43%)" opacity="0.1" />
                <circle cx="200" cy="200" r="8" fill="hsl(348, 87%, 43%)" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
