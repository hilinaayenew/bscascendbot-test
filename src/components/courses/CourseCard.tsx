import { Course, ACCENT_COLORS } from "@/lib/courseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, BookOpen, ChevronRight } from "lucide-react";

interface CourseCardProps {
  course: Course;
  completedModules: string[];
  onOpenModule: (courseId: string, moduleId: string) => void;
}

const CourseCard = ({ course, completedModules, onOpenModule }: CourseCardProps) => {
  const colors = ACCENT_COLORS[course.accent];
  const completedCount = completedModules.length;
  const progress = Math.round((completedCount / course.modules.length) * 100);

  const status = completedCount === 0
    ? "Not started"
    : completedCount === course.modules.length
    ? "Completed"
    : "In progress";

  const statusBadgeClass =
    status === "Completed"
      ? "bg-green-100 text-green-800"
      : status === "In progress"
      ? colors.badge
      : "bg-muted text-muted-foreground";

  const nextModuleId = course.modules.find((m) => !completedModules.includes(m.id))?.id;

  return (
    <Card className={`shadow-card border ${colors.border} overflow-hidden`}>
      <CardHeader className={`${colors.bg} pb-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-body text-lg sora-semibold text-foreground">
              {course.title}
            </CardTitle>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1 font-body text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                {course.moduleCount} modules
              </span>
              <span className="flex items-center gap-1 font-body text-xs">
                <Clock className="h-3.5 w-3.5" />
                Est. {course.estimatedHours} hrs
              </span>
            </div>
          </div>
          <Badge className={`font-body text-xs shrink-0 ${statusBadgeClass}`}>
            {status}
          </Badge>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-body text-xs sora-medium text-foreground/70">Progress</span>
            <span className="font-body text-xs sora-semibold text-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-2">
        {course.modules.map((mod) => {
          const isCompleted = completedModules.includes(mod.id);
          const isNext = mod.id === nextModuleId;

          return (
            <button
              key={mod.id}
              onClick={() => onOpenModule(course.id, mod.id)}
              className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-muted transition-colors group"
            >
              {isCompleted ? (
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${colors.fill.replace("bg-", "text-")}`} />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-border group-hover:text-muted-foreground transition-colors" />
              )}
              <span
                className={`font-body text-sm flex-1 ${
                  isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {mod.title}
              </span>
              {isNext && !isCompleted && (
                <Badge variant="outline" className={`font-body text-[10px] shrink-0 ${colors.badge}`}>
                  Up next
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          );
        })}

        <div className="pt-3">
          <Button
            className="w-full font-body sora-semibold"
            variant={status === "Completed" ? "outline" : "default"}
            onClick={() => {
              if (nextModuleId) onOpenModule(course.id, nextModuleId);
            }}
            disabled={status === "Completed"}
          >
            {status === "Not started"
              ? "Start course"
              : status === "Completed"
              ? "✓ Course complete"
              : "Continue course"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
