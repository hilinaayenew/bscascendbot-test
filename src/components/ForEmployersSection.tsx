import { Button } from "@/components/ui/button";
import { GraduationCap, Search, ListChecks } from "lucide-react";

const steps = [
  {
    icon: GraduationCap,
    title: "Holistically Trained Interns",
    description:
      "Your intern is holistically trained with technical expertise & soft skills like communication, teamwork, and problem-solving.",
  },
  {
    icon: Search,
    title: "Identify the Right Person",
    description:
      "From our talent pool, we pinpoint the exact profile your company needs, ensuring alignment with your goals and culture.",
  },
  {
    icon: ListChecks,
    title: "Tailored Suggestions",
    description:
      "You receive a shortlist of carefully vetted candidates: high-quality matches designed to save you time and resources.",
  },
];

const ForEmployersSection = () => {
  return (
    <section id="employers" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
            For Employers
          </h2>
          <p className="font-body text-sm md:text-base text-foreground/70 sora-regular">
            The end product of our pipeline are AprentSisters. Here is why you want to get on the site and find Africa&apos;s best talent.
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="font-body text-base md:text-lg text-foreground/80 sora-medium">
            How it works
          </p>
          <p className="font-body text-sm md:text-base text-foreground/70 mt-2 sora-regular">
            For a flat fee, you get access to The Apprent Sis programme. We provide a complete support package that removes the hiring hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-muted/40 border border-border rounded-lg p-8 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                {step.title}
              </h3>
              <p className="font-body text-sm text-foreground/70 leading-relaxed sora-regular">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="font-body sora-semibold">
            Find Talent
          </Button>
          <p className="font-body text-sm text-foreground/50 mt-3 sora-light">
            Join companies already discovering Africa&apos;s next generation of leaders
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForEmployersSection;
