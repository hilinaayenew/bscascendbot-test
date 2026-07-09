import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-mentorship.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Because She Can Bloom and Build Brunch Experience with young African women"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-24 md:py-32">
        <div className="max-w-2xl animate-fade-in-up">
          <p className="font-body text-sm sora-semibold text-primary-foreground/80 mb-4 tracking-widest uppercase">
            A Because She Can Programme
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
            Where African
            <br />
            Excellence
            <br />
            <span className="italic">Ascends.</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-primary-foreground/85 mb-10 max-w-lg leading-relaxed sora-light">
            A trusted mentorship ecosystem connecting ambitious Africans with world-class guidance. From free cohorts to curated pathways — grow at every stage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="lg" asChild>
              <a href="#pathways">Find Your Pathway</a>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <a href="#business">For Businesses</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
