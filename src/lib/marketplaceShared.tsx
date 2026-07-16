import { Star } from "lucide-react";

export type AvailabilityStatus = "available" | "booked" | "away";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ListingProfile {
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  expertise: string[] | null;
  interests: string[] | null;
}

export interface Listing {
  id: string;
  user_id: string;
  headline: string | null;
  services: string | null;
  hourly_rate_usd: number | null;
  availability_status: AvailabilityStatus;
  portfolio_url: string | null;
  approval_status: ApprovalStatus;
  profile: ListingProfile | null;
  avg_rating: number | null;
  review_count: number;
  my_review?: { id: string; rating: number; comment: string | null } | null;
}

export const availabilityMeta: Record<AvailabilityStatus, { label: string; className: string }> = {
  available: { label: "Available now", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  booked: { label: "Currently booked", className: "bg-amber-100 text-amber-800 border-amber-200" },
  away: { label: "Away", className: "bg-muted text-foreground/70 border-border" },
};

export const approvalMeta: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "Pending admin approval", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Live on marketplace", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Not approved", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const StarRating = ({ value, count }: { value: number | null; count: number }) => {
  if (!value || count === 0) {
    return <span className="font-body text-xs text-muted-foreground">No reviews yet</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        ))}
      </div>
      <span className="font-body text-xs text-foreground/70">
        {value.toFixed(1)} ({count})
      </span>
    </div>
  );
};