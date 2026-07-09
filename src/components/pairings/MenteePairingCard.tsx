/**
 * Purpose: Mentee-side pairing card showing the assigned mentor with session stats.
 */
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarClock, MessageCircle, User } from "lucide-react";
import PairingGoals from "./PairingGoals";

export interface MenteePairingViewModel {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorBio: string | null;
  mentorAvatar: string | null;
  status: string;
  sessionsCompleted: number;
  nextSessionLabel: string;
  hasNextSession: boolean;
}

const statusBadgeClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const MenteePairingCard = ({ pairing }: { pairing: MenteePairingViewModel }) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={pairing.mentorAvatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-body sora-semibold text-lg">
              {pairing.mentorName[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider">
              Your mentor
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <h2 className="font-body text-lg sora-semibold truncate">{pairing.mentorName}</h2>
              <Badge className={`font-body text-[10px] capitalize ${statusBadgeClass[pairing.status] ?? ""}`}>
                {pairing.status}
              </Badge>
            </div>
            {pairing.mentorBio && (
              <p className="font-body text-sm text-muted-foreground mt-1 line-clamp-2">{pairing.mentorBio}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="font-body text-2xl sora-bold text-foreground">{pairing.sessionsCompleted}</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Sessions completed</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <p className="font-body text-sm sora-semibold text-center leading-tight">
                {pairing.hasNextSession ? pairing.nextSessionLabel : "No session scheduled"}
              </p>
            </div>
            <p className="font-body text-xs text-muted-foreground text-center mt-1">Next session</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-body"
            onClick={() => navigate(`/dashboard/messages?to=${pairing.mentorId}`)}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-2" />
            Message
          </Button>
          <Link to={`/dashboard/profile/${pairing.mentorId}`}>
            <Button variant="outline" size="sm" className="w-full font-body">
              <User className="h-3.5 w-3.5 mr-2" />
              View profile
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-border">
          <PairingGoals pairingId={pairing.id} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MenteePairingCard;