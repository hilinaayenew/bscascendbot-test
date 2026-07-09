import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, BookOpen, ChevronRight } from "lucide-react";
import type { DbCourse, DbChecklistItem } from "@/lib/coursesData";

interface Props {
  course: DbCourse;
  items: DbChecklistItem[];
  completedItemIds: Set<string>;
  onOpenLesson: (courseId: string, itemId: string) => void;
}

const PREVIEW_COUNT = 6;
const MIN_PER_LESSON = 8;

const ChecklistCourseCard = ({ course, items, completedItemIds, onOpenLesson }: Props) => {
  const total = items.length;
  const completedCount = items.filter((i) => completedItemIds.has(i.id)).length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const status =
    completedCount === 0 ? "Not started" : completedCount === total ? "Completed" : "In progress";

  const statusBadgeClass =
    status === "Completed"
      ? "bg-green-100 text-green-800 hover:bg-green-100"
      : status === "In progress"
      ? "bg-primary/10 text-primary hover:bg-primary/10"
      : "bg-muted text-muted-foreground hover:bg-muted";

  const nextItem = items.find((m) => !completedItemIds.has(m.id));
  const previewItems = items.slice(0, PREVIEW_COUNT);
  const remainingCount = Math.max(0, items.length - PREVIEW_COUNT);
  const estHours = Math.max(1, Math.round((items.length * MIN_PER_LESSON) / 60));

  return (
    <Card className="shadow-card border-border overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-display text-xl font-bold text-foreground">
              {course.title}
            </CardTitle>
            {course.description && (
              <p className="font-body text-sm text-muted-foreground mt-2">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 font-body text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                {items.length} lessons
              </span>
              <span className="flex items-center gap-1 font-body text-xs">
                <Clock className="h-3.5 w-3.5" />
                Est. {estHours} hrs
              </span>
              {course.cohort_label && (
                <Badge variant="outline" className="font-body text-[10px]">
                  {course.cohort_label}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={`font-body text-xs shrink-0 ${statusBadgeClass}`}>{status}</Badge>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-body text-xs sora-medium text-foreground/70">Progress</span>
            <span className="font-body text-xs sora-semibold text-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-1">
        {items.length === 0 && (
          <p className="font-body text-sm text-muted-foreground text-center py-4">
            No lessons yet.
          </p>
        )}
        {previewItems.map((item) => {
          const done = completedItemIds.has(item.id);
          const isNext = nextItem?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onOpenLesson(course.id, item.id)}
              className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-muted transition-colors group"
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-border group-hover:text-muted-foreground transition-colors" />
              )}
              <span
                className={`font-body text-sm flex-1 truncate ${
                  done ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {item.title}
              </span>
              {isNext && !done && (
                <Badge variant="outline" className="font-body text-[10px] shrink-0 bg-primary/10 text-primary border-primary/20">
                  Up next
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          );
        })}

        {remainingCount > 0 && (
          <p className="font-body text-xs text-muted-foreground pl-10 pt-1">
            + {remainingCount} more lesson{remainingCount === 1 ? "" : "s"}
          </p>
        )}

        <div className="pt-3">
          <Button
            className="w-full font-body sora-semibold"
            variant={status === "Completed" ? "outline" : "default"}
            onClick={() => {
              const target = nextItem ?? items[0];
              if (target) onOpenLesson(course.id, target.id);
            }}
            disabled={items.length === 0}
          >
            {status === "Not started"
              ? "Start course"
              : status === "Completed"
              ? "✓ Course complete — Review"
              : "Continue course"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChecklistCourseCard;