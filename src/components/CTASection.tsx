import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
          Your Ascension Starts Here
        </h2>
        <p className="font-body text-sm md:text-base text-primary-foreground/80 max-w-2xl mx-auto mb-10 sora-regular">
          Join thousands of African professionals who are growing through structured mentorship, curated learning, and a community that understands their journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero-outline" size="lg" className="font-body sora-semibold">
            Get Started Free
          </Button>
          <Button variant="hero-outline" size="lg" className="font-body sora-semibold">
            Talk to Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
