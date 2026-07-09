/**
 * CohortCallBanner – CTA banner announcing the 2026 cohort is open and calling for mentors
 */
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

const CohortCallBanner = () => {
  return (
    <section className="py-16 md:py-20 bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground font-body text-sm sora-semibold px-4 py-2 rounded-full mb-6">
          <Megaphone className="h-4 w-4" />
          Now Open
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
          The 2026 Cohort Is Officially Open
        </h2>
        <p className="font-body text-sm md:text-base text-accent-foreground/80 max-w-2xl mx-auto mb-8 sora-regular">
          We're calling for experienced professionals across Africa and the diaspora to mentor the next generation. Share your expertise, grow your network, and make a lasting impact.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero-outline" size="lg" className="font-body sora-semibold">
            Apply as a Mentor
          </Button>
          <Button variant="hero-outline" size="lg" className="font-body sora-semibold">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CohortCallBanner;
