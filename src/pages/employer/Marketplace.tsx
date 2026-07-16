import { useEffect, useState } from "react";
import EmployerLayout from "@/components/employer/EmployerLayout";
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
import { MessageSquare, ExternalLink, Loader2, MapPin } from "lucide-react";
import { Listing, StarRating, availabilityMeta } from "@/lib/marketplaceShared";

const EmployerMarketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [contactFor, setContactFor] = useState<Listing | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoadingData(true);
    const { data: rows, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, user_id, headline, services, hourly_rate_usd, availability_status, portfolio_url, approval_status"
      )
      .eq("approval_status", "approved")
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
            .select("listing_id, rating")
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
      return {
        ...r,
        profile: profilesById.get(r.user_id) ?? null,
        avg_rating: avg,
        review_count: revs.length,
        my_review: null,
      };
    });

    setListings(enriched);
    setLoadingData(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openContact = (l: Listing) => {
    setContactFor(l);
    setMessage(
      `Hi ${l.profile?.full_name?.split(" ")[0] || "there"},\n\nI saw your Ascendency marketplace listing and would love to connect about a potential opportunity.\n\n`
    );
  };

  const sendMessage = async () => {
    if (!user || !contactFor || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: contactFor.user_id,
      content: message.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: "Could not send message", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Message sent", description: "They'll be notified in their inbox." });
    setContactFor(null);
    setMessage("");
  };

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
            Browse mentors and mentees offering freelance and consulting services. Reach out directly to start a conversation.
          </p>
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
                        onClick={() => openContact(l)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Reach out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!contactFor} onOpenChange={(o) => !o && setContactFor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                Message {contactFor?.profile?.full_name || "this member"}
              </DialogTitle>
              <DialogDescription className="font-body">
                They'll receive your message in their Ascendency inbox and can reply directly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="font-body">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  maxLength={2000}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setContactFor(null)} disabled={sending}>Cancel</Button>
              <Button onClick={sendMessage} disabled={sending || !message.trim()} className="font-body sora-semibold">
                {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EmployerLayout>
  );
};

export default EmployerMarketplace;