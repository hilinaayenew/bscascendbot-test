import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Clock, MapPin, Link2, CalendarDays } from "lucide-react";
import { fetchUpcomingWorkshops, downloadIcs, TYPE_LABEL, type Workshop } from "@/lib/workshopsData";

interface Props {
  variant?: "card" | "section";
  limit?: number;
}

const UpcomingWorkshopsWidget = ({ variant = "card", limit }: Props) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchUpcomingWorkshops()
      .then((data) => {
        if (alive) setWorkshops(limit ? data.slice(0, limit) : data);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [limit]);

  const content = (
    <div className="space-y-3">
      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : workshops.length === 0 ? (
        <div className="text-center py-6">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-body text-sm text-muted-foreground">
            No upcoming sessions or workshops at this time. Check back soon!
          </p>
        </div>
      ) : (
        workshops.map((w) => {
          const start = new Date(w.starts_at);
          return (
            <div
              key={w.id}
              className="border border-border rounded-md p-3 space-y-2 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm sora-semibold text-foreground">{w.title}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-body text-xs">
                      {start.toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-body text-[10px] shrink-0">
                  {TYPE_LABEL[w.type]}
                </Badge>
              </div>
              {w.description && (
                <p className="font-body text-xs text-muted-foreground">{w.description}</p>
              )}
              {(w.location || w.link) && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {w.location && (
                    <span className="flex items-center gap-1 font-body">
                      <MapPin className="h-3 w-3" />
                      {w.location}
                    </span>
                  )}
                  {w.link && (
                    <a
                      href={/^https?:\/\//i.test(w.link) ? w.link : `https://${w.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-body text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      Join link
                    </a>
                  )}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="font-body h-7 text-xs"
                onClick={() => downloadIcs(w)}
              >
                <CalendarPlus className="h-3 w-3 mr-1" />
                Add to Calendar
              </Button>
            </div>
          );
        })
      )}
    </div>
  );

  if (variant === "section") {
    return (
      <div className="space-y-3">
        <h2 className="font-body text-lg sora-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Upcoming Sessions & Workshops
        </h2>
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Upcoming Sessions & Workshops
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default UpcomingWorkshopsWidget;