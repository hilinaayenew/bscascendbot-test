import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PathwaysSection from "@/components/PathwaysSection";
import FeaturesSection from "@/components/FeaturesSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import B2BSection from "@/components/B2BSection";
import CohortCallBanner from "@/components/CohortCallBanner";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PathwaysSection />
        <FeaturesSection />
        <MarketplaceSection />
        <CohortCallBanner />
        <B2BSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
