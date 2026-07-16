import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartAvatarImg } from "@/components/SmartAvatarImage";
import { Loader2, MapPin, ExternalLink, Store } from "lucide-react";
import {
  AvailabilityStatus,
  ApprovalStatus,
  availabilityMeta,
  approvalMeta,
  StarRating,
} from "@/lib/marketplaceShared";

interface OwnListing {
  id: string;
  headline: string | null;
  services: string | null;
  hourly_rate_usd: number | null;
  availability_status: AvailabilityStatus;
  portfolio_url: string | null;
  approval_status: ApprovalStatus;
}

const MarketplaceListingTab = () => {
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<OwnListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ avg: number | null; count: number }>({ avg: null, count: 0 });

  const [headline, setHeadline] = useState("");
  const [services, setServices] = useState("");
  const [rate, setRate] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>("available");
  const [portfolio, setPortfolio] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("marketplace_listings")
      .select("id, headline, services, hourly_rate_usd, availability_status, portfolio_url, approval_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const l = data as OwnListing;
      setListing(l);
      setHeadline(l.headline ?? "");
      setServices(l.services ?? "");
      setRate(l.hourly_rate_usd != null ? String(l.hourly_rate_usd) : "");
      setAvailability(l.availability_status);
      setPortfolio(l.portfolio_url ?? "");

      const { data: reviews } = await supabase
        .from("marketplace_reviews")
        .select("rating")
        .eq("listing_id", l.id);
      const arr = reviews ?? [];
      setReviewSummary({
        avg: arr.length ? arr.reduce((s, r: any) => s + r.rating, 0) / arr.length : null,
        count: arr.length,
      });
    } else {
      setListing(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!services.trim()) {
      toast({ title: "Add services", description: "Describe what you offer.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const isFirstTime = !listing;
    const payload: any = {
      user_id: user.id,
      headline: headline.trim() || null,
      services: services.trim(),
      hourly_rate_usd: rate ? Number(rate) : null,
      availability_status: availability,
      portfolio_url: portfolio.trim() || null,
      ...(isFirstTime ? { approval_status: "pending", approved_at: null, approved_by: null } : {}),
    };
    const { error } = await supabase
      .from("marketplace_listings")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: isFirstTime ? "Listing submitted" : "Listing updated",
      description: isFirstTime
        ? "An admin will review it before it appears on the marketplace."
        : "Your changes are live.",
    });
    await load();
  };

  const status = listing ? approvalMeta[listing.approval_status] : null;
  const availabilityInfo = availabilityMeta[availability];
  const initials = profile?.full_name?.[0]?.toUpperCase() || "?";

  return (
    <Card id="marketplace-listing" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle className="font-body text-lg">Marketplace listing</CardTitle>
          </div>
          {status && (
            <Badge variant="outline" className={`font-body text-[11px] ${status.className}`}>
              {status.label}
            </Badge>
          )}
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Offer yourself for freelance or consulting work on the Ascendency marketplace. First-time listings are reviewed by an admin — later edits go live immediately.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mkt-headline" className="font-body">Headline</Label>
                  <Input
                    id="mkt-headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Product strategy & platform reviews"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mkt-services" className="font-body">Services offered</Label>
                  <Textarea
                    id="mkt-services"
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    maxLength={600}
                    rows={5}
                    placeholder="Describe what people can hire you to do."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mkt-rate" className="font-body">Hourly rate (USD, optional)</Label>
                    <Input
                      id="mkt-rate"
                      type="number"
                      min={0}
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Availability</Label>
                    <Select value={availability} onValueChange={(v) => setAvailability(v as AvailabilityStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available now</SelectItem>
                        <SelectItem value="booked">Currently booked</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mkt-portfolio" className="font-body">Portfolio link (optional)</Label>
                  <Input
                    id="mkt-portfolio"
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={save} disabled={saving} className="font-body sora-semibold">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {listing ? "Save changes" : "Submit for review"}
                </Button>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-body text-xs sora-semibold text-foreground/70 uppercase tracking-wide">
                    Preview
                  </p>
                  <span className="font-body text-xs text-muted-foreground sora-regular">
                    How your listing appears on the marketplace
                  </span>
                </div>
                <Card className="shadow-card border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-body sora-semibold overflow-hidden shrink-0">
                        {profile?.avatar_url ? (
                          <SmartAvatarImg avatarUrl={profile.avatar_url} className="w-full h-full object-cover" alt={profile?.full_name ?? "you"} />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-semibold text-accent truncate">
                          {profile?.full_name || "You"}
                        </h3>
                        {profile?.country && (
                          <p className="font-body text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {profile.country}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <StarRating value={reviewSummary.avg} count={reviewSummary.count} />
                        </div>
                      </div>
                      <Badge variant="outline" className={`font-body text-[11px] ${availabilityInfo.className}`}>
                        {availabilityInfo.label}
                      </Badge>
                    </div>
                    {headline && (
                      <p className="font-body sora-semibold text-sm text-foreground mb-1.5">{headline}</p>
                    )}
                    {services ? (
                      <p className="font-body text-sm text-foreground/70 sora-regular leading-relaxed line-clamp-4">
                        {services}
                      </p>
                    ) : (
                      <p className="font-body text-xs text-muted-foreground italic">
                        Add services above to fill out your listing.
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-body text-foreground/70">
                      {rate && (
                        <span className="sora-semibold text-foreground">${Number(rate).toFixed(0)}/hr USD</span>
                      )}
                      {portfolio && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          Portfolio <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplaceListingTab;