import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmartAvatarImg } from "@/components/SmartAvatarImage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Star, ExternalLink, Loader2, MapPin } from "lucide-react";
import {
  Listing,
  StarRating,
  availabilityMeta,
} from "@/lib/marketplaceShared";

const Marketplace = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [hasOwnListing, setHasOwnListing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [reviewFor, setReviewFor] = useState<Listing | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoadingData(true);

    const { data: rows, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, user_id, headline, services, hourly_rate_usd, availability_status, portfolio_url, approval_status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Could not load marketplace", description: error.message, variant: "destructive" });
      setLoadingData(false);
      return;
    }

    const userIds = (rows ?? []).map((r) => r.user_id);
    const listingIds = (rows ?? []).map((r) => r.id);

    const [profilesRes, reviewsRes] = await Promise.all([
      userIds.length
        ? supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, country, bio, expertise, interests")
            .in("user_id", userIds)
        : Promise.resolve({ data: [] as any[], error: null } as any),
      listingIds.length
        ? supabase
            .from("marketplace_reviews")
            .select("id, listing_id, reviewer_id, rating, comment")
            .in("listing_id", listingIds)
        : Promise.resolve({ data: [] as any[], error: null } as any),
    ]);

    const profilesById = new Map<string, Listing["profile"]>();
    (profilesRes.data ?? []).forEach((p: any) => {
      profilesById.set(p.user_id, {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        country: p.country,
        bio: p.bio,
        expertise: p.expertise,
        interests: p.interests,
      });
    });

    const reviewsByListing = new Map<string, any[]>();
    (reviewsRes.data ?? []).forEach((r: any) => {
      const arr = reviewsByListing.get(r.listing_id) ?? [];
      arr.push(r);
      reviewsByListing.set(r.listing_id, arr);
    });

    const enriched: Listing[] = (rows ?? []).map((r: any) => {
      const revs = reviewsByListing.get(r.id) ?? [];
      const avg = revs.length ? revs.reduce((s: number, x: any) => s + x.rating, 0) / revs.length : null;
      const mine = revs.find((x: any) => x.reviewer_id === user.id);
      return {
        ...r,
        profile: profilesById.get(r.user_id) ?? null,
        avg_rating: avg,
        review_count: revs.length,
        my_review: mine ? { id: mine.id, rating: mine.rating, comment: mine.comment } : null,
      };
    });

    setHasOwnListing(enriched.some((l) => l.user_id === user.id));
    setListings(enriched.filter((l) => l.approval_status === "approved" && l.user_id !== user.id));
    setLoadingData(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openReview = (l: Listing) => {
    setReviewFor(l);
    setReviewRating(l.my_review?.rating ?? 5);
    setReviewComment(l.my_review?.comment ?? "");
  };

  const submitReview = async () => {
    if (!user || !reviewFor) return;
    setSavingReview(true);
    const { error } = await supabase
      .from("marketplace_reviews")
      .upsert(
        {
          listing_id: reviewFor.id,
          reviewer_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
        { onConflict: "listing_id,reviewer_id" }
      );
    setSavingReview(false);
    if (error) {
      toast({ title: "Could not save review", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Review saved" });
    setReviewFor(null);
    void load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Marketplace</h1>
            <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
              Hire trusted mentors and mentees from the Ascendency community for freelance and consulting work.
            </p>
          </div>
          <Link to="/dashboard/settings#marketplace-listing">
            <Button size="sm" variant="outline" className="font-body sora-semibold">
              {hasOwnListing ? "Manage your listing" : "Create your listing"}
            </Button>
          </Link>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-10 text-center">
              <p className="font-body text-sm text-foreground/70 sora-regular">
                No approved listings yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((l) => {
              const initials = l.profile?.full_name?.[0]?.toUpperCase() || "?";
              const meta = availabilityMeta[l.availability_status];
              return (
                <Card key={l.id} className="shadow-card flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-body sora-semibold overflow-hidden shrink-0">
                        {l.profile?.avatar_url ? (
                          <SmartAvatarImg avatarUrl={l.profile.avatar_url} className="w-full h-full object-cover" alt={l.profile?.full_name ?? "user"} />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-semibold text-accent truncate">
                          {l.profile?.full_name || "Ascendency member"}
                        </h3>
                        {l.profile?.country && (
                          <p className="font-body text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {l.profile.country}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <StarRating value={l.avg_rating} count={l.review_count} />
                        </div>
                      </div>
                      <Badge variant="outline" className={`font-body text-[11px] ${meta.className}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    {l.headline && (
                      <p className="font-body sora-semibold text-sm text-foreground mb-1.5">{l.headline}</p>
                    )}
                    {l.services && (
                      <p className="font-body text-sm text-foreground/70 sora-regular leading-relaxed line-clamp-4">
                        {l.services}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-body text-foreground/70">
                      {l.hourly_rate_usd != null && (
                        <span className="sora-semibold text-foreground">
                          ${Number(l.hourly_rate_usd).toFixed(0)}/hr USD
                        </span>
                      )}
                      {l.portfolio_url && (
                        <a
                          href={l.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Portfolio <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        className="font-body sora-semibold"
                        onClick={() => navigate(`/dashboard/messages?to=${l.user_id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Message
                      </Button>
                      <Button size="sm" variant="outline" className="font-body" onClick={() => openReview(l)}>
                        <Star className="h-4 w-4 mr-2" />
                        {l.my_review ? "Edit review" : "Leave review"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!reviewFor} onOpenChange={(o) => !o && setReviewFor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                Review {reviewFor?.profile?.full_name || "this listing"}
              </DialogTitle>
              <DialogDescription className="font-body">
                Share your experience hiring this person for freelance or consulting work.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="font-body mb-2 block">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className="p-1"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment" className="font-body">Comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewFor(null)} disabled={savingReview}>Cancel</Button>
              <Button onClick={submitReview} disabled={savingReview} className="font-body sora-semibold">
                {savingReview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;