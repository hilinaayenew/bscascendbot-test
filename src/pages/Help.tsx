/**
 * Purpose: Help Center page — Key contacts, Helpful information, Help desk (FAQs + mailto).
 */
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HelpContent from "@/components/help/HelpContent";

const Help = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-2">
        <h1 className="font-display text-2xl font-bold">Help Center</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Key contacts, helpful information, and our help desk — all in one place.
        </p>
        <HelpContent />
      </div>
    </DashboardLayout>
  );
};

export default Help;