/**
 * Purpose: Mentor-side pairing card showing a paired mentee, their session stats and course progress.
 */
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, User } from "lucide-react";
import PairingGoals from "./PairingGoals";

export interface MentorPairingViewModel {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeAvatar: string | null;
  status: string;
  sessionsCompleted: number;
  nextSessionLabel: string;
  hasNextSession: boolean;
  courseProgressPct: number;
}

const statusBadgeClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const MentorPairingCard = ({ pairing }: { pairing: MentorPairingViewModel }) => {
  const navigate = useNavigate();
  const handleMessage = () => navigate(`/dashboard/messages?to=${pairing.menteeId}`);

  return (
    <Card className="shadow-card">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <button onClick={handleMessage} className="shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={pairing.menteeAvatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-body sora-semibold">
                {pairing.menteeName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMessage}
                className="font-body text-base sora-semibold truncate hover:text-primary transition-colors text-left"
              >
                {pairing.menteeName}
              </button>
              <Badge className={`font-body text-[10px] capitalize ${statusBadgeClass[pairing.status] ?? ""}`}>
                {pairing.status}
              </Badge>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Your mentee</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="font-body text-xl sora-bold text-foreground">{pairing.sessionsCompleted}</p>
            <p className="font-body text-[10px] text-muted-foreground">Sessions completed</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-1.5 text-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-body text-xs sora-semibold text-center leading-tight">
                {pairing.hasNextSession ? pairing.nextSessionLabel : "No session scheduled"}
              </p>
            </div>
            <p className="font-body text-[10px] text-muted-foreground text-center mt-1">Next session</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs sora-semibold text-muted-foreground uppercase tracking-wider">
              Course progress
            </p>
            <span className="font-body text-xs sora-semibold">{pairing.courseProgressPct}%</span>
          </div>
          <Progress value={pairing.courseProgressPct} className="h-2" />
        </div>

        <div className="pt-2 border-t border-border">
          <PairingGoals pairingId={pairing.id} compact />
        </div>

        <Link to={`/dashboard/profile/${pairing.menteeId}`} className="block">
          <Button variant="outline" size="sm" className="w-full font-body">
            <User className="h-3.5 w-3.5 mr-2" />
            View full profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default MentorPairingCard;