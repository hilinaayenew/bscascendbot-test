import { Button } from "@/components/ui/button";
import { BarChart3, Users2, Award, GitBranch } from "lucide-react";

const b2bFeatures = [
  {
    icon: Users2,
    title: "Colleague Matching",
    description: "Intelligently pair employees across departments, seniority levels, and skill areas to foster cross-functional learning and collaboration.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track programme engagement, mentor-mentee progress, skill development metrics, and ROI — all in real-time.",
  },
  {
    icon: Award,
    title: "Scoring & Gamification",
    description: "Motivate participation with points, milestones, and leaderboards. Recognise top mentors and high-achieving mentees.",
  },
  {
    icon: GitBranch,
    title: "Custom Programme Design",
    description: "We build bespoke mentorship platforms and run staff training tailored to your company's culture, goals, and structure.",
  },
];

const B2BSection = () => {
  return (
    <section id="business" className="py-20 md:py-28 bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Enterprise Mentorship Solutions
          </h2>
          <p className="font-body text-sm md:text-base text-accent-foreground/75 sora-regular">
            Invest in your African talent. We build custom mentorship platforms and run training programmes that drive retention, engagement, and leadership development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {b2bFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-accent-foreground/5 border border-accent-foreground/10 rounded-lg p-8"
            >
              <div className="w-10 h-10 rounded-md bg-primary/30 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="font-body text-sm text-accent-foreground/70 leading-relaxed sora-regular">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="font-body sora-semibold">
            Request a Demo
          </Button>
          <p className="font-body text-sm text-accent-foreground/50 mt-3 sora-light">
            Trusted by forward-thinking organisations across the continent
          </p>
        </div>
      </div>
    </section>
  );
};

export default B2BSection;
