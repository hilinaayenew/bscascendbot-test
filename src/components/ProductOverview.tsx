import { Users, BookOpen, Briefcase } from "lucide-react";

const offerings = [
  {
    icon: Users,
    title: "Free Cohort Programme",
    description:
      "Our flagship annual 3-month global cohort mentorship programme. Connect with mentors across Africa and the diaspora — at no cost.",
    cta: "Join the Next Cohort",
    href: "#cohort",
  },
  {
    icon: BookOpen,
    title: "Curated Pathways (D2C)",
    description:
      "A monthly platform with learning resources, courses, a freelance marketplace, and AI-powered mentor matching — tailored to your career level.",
    cta: "Explore Pathways",
    href: "#pathways",
  },
  {
    icon: Briefcase,
    title: "Enterprise Solutions (B2B)",
    description:
      "Custom mentorship platforms, staff training, colleague matching, analytics dashboards, and scoring frameworks for your organisation.",
    cta: "Talk to Us",
    href: "#business",
  },
];

const ProductOverview = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-accent mb-4">
            Three Ways to Grow
          </h2>
          <p className="font-body text-sm md:text-base text-foreground/70 sora-regular">
            Whether you're starting your career, scaling your expertise, or investing in your team — Ascendency meets you where you are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
          {offerings.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group border-l-4 border-crimson bg-card rounded-r-lg p-8 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-md bg-crimson-light flex items-center justify-center mb-6">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-accent mb-3">
                {item.title}
              </h3>
              <p className="font-body text-sm text-foreground/70 mb-6 leading-relaxed sora-regular">
                {item.description}
              </p>
              <span className="font-body text-sm sora-semibold text-primary group-hover:underline">
                {item.cta} →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductOverview;
