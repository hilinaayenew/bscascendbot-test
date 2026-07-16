import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MarketplaceListingTab from "@/components/settings/MarketplaceListingTab";

const MarketplaceListing = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-accent">
            Marketplace listing
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage how you appear on the Ascendency marketplace.
          </p>
        </div>
        <MarketplaceListingTab />
      </div>
    </DashboardLayout>
  );
};

export default MarketplaceListing;