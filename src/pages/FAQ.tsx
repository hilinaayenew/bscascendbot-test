import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;