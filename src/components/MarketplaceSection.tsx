import { Store, DollarSign, Star, ShieldCheck } from "lucide-react";

const MarketplaceSection = () => {
  return (
    <section id="marketplace" className="py-20 md:py-28 section-warm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-accent mb-4">
            The Ascendency Marketplace
          </h2>
          <p className="font-body text-sm md:text-base text-foreground/70 sora-regular">
            Post your freelance availability, showcase your expertise, and get hired by individuals and companies. A marketplace built for African talent, by African talent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Store,
              title: "Post Your Services",
              description: "Create a professional profile showcasing your skills, rates, and availability.",
            },
            {
              icon: DollarSign,
              title: "Get Hired",
              description: "Companies and individuals can browse and book your expertise directly.",
            },
            {
              icon: Star,
              title: "Build Reputation",
              description: "Earn reviews and ratings that elevate your profile and attract more clients.",
            },
            {
              icon: ShieldCheck,
              title: "Secure Payments",
              description: "All transactions are protected. Mentors and freelancers get paid after service delivery.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-card border-l-4 border-crimson rounded-r-lg p-6 shadow-card"
            >
              <div className="w-10 h-10 rounded-md bg-crimson-light flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-accent mb-2">
                {item.title}
              </h3>
              <p className="font-body text-sm text-foreground/70 leading-relaxed sora-regular">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;
