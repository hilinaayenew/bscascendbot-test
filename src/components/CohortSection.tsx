import { Button } from "@/components/ui/button";
import { Calendar, Globe, HeartHandshake } from "lucide-react";

const CohortSection = () => {
  return (
    <section id="cohort" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-crimson-light text-primary font-body text-sm sora-semibold px-4 py-2 rounded-full mb-6">
              <HeartHandshake className="h-4 w-4" />
              Always Free
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-accent mb-6">
              The Global Cohort
              <br />
              Mentorship Programme
            </h2>
            <p className="font-body text-sm md:text-base text-foreground/70 mb-8 leading-relaxed max-w-lg sora-regular">
              Our flagship annual 3-month programme connects ambitious Africans with experienced mentors from around the world. No fees, no barriers — just structured growth, accountability, and community.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-body text-sm text-foreground sora-regular">3-month structured programme, annually</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-body text-sm text-foreground sora-regular">Mentors and mentees from across Africa and the diaspora</span>
              </div>
              <div className="flex items-center gap-3">
                <HeartHandshake className="h-5 w-5 text-primary" />
                <span className="font-body text-sm text-foreground sora-regular">Completely free — always</span>
              </div>
            </div>

            <Button variant="default" size="lg" className="font-body sora-semibold">
              Apply for the Next Cohort
            </Button>
          </div>

          {/* Right — quote block */}
          <div className="bg-accent rounded-lg p-10 text-accent-foreground">
            <blockquote className="font-display text-2xl font-medium italic leading-relaxed mb-6">
              "The cohort programme gave me a mentor who not only understood my industry but understood my context as an African professional. That changed everything."
            </blockquote>
            <div>
              <p className="font-body sora-semibold">Amara K.</p>
              <p className="font-body text-sm text-accent-foreground/70 sora-light">Product Manager, Lagos — Cohort 2024</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CohortSection;
