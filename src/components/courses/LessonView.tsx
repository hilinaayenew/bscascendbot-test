import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { DbCourse, DbChecklistItem } from "@/lib/coursesData";
import LessonContent from "./LessonContent";

interface Props {
  course: DbCourse;
  lesson: DbChecklistItem;
  lessons: DbChecklistItem[];
  isCompleted: boolean;
  onBack: () => void;
  onMarkComplete: () => Promise<void> | void;
  onOpenLesson: (lessonId: string) => void;
}

const LessonView = ({
  course,
  lesson,
  lessons,
  isCompleted,
  onBack,
  onMarkComplete,
  onOpenLesson,
}: Props) => {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [saving, setSaving] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const lessonNumber = idx + 1;

  useEffect(() => {
    setReachedEnd(false);
    // Scroll-to-top when lesson changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lesson.id]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReachedEnd(true);
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [lesson.id]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onMarkComplete();
      if (next) onOpenLesson(next.id);
      else onBack();
    } finally {
      setSaving(false);
    }
  };

  const body = lesson.description?.trim() || "This lesson has no written content yet.";

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-body text-xs text-muted-foreground sora-medium truncate">
            {course.title}
          </p>
          <h2 className="font-display text-xl font-bold truncate">{lesson.title}</h2>
        </div>
        <Badge variant="outline" className="font-body text-xs shrink-0">
          Lesson {lessonNumber} of {lessons.length}
        </Badge>
      </div>

      {/* Lesson body card */}
      <div className="bg-card rounded-lg border border-border shadow-card p-6 md:p-8 space-y-3">
        <LessonContent content={body} />

        {lesson.resource_url && (
          <div className="pt-4">
            <Button asChild variant="outline" className="font-body">
              <a href={lesson.resource_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open recommended resource
              </a>
            </Button>
          </div>
        )}

        {/* Sentinel for scroll detection */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Lesson nav (prev / next) */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="font-body"
          disabled={!prev}
          onClick={() => prev && onOpenLesson(prev.id)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="ghost"
          className="font-body"
          disabled={!next}
          onClick={() => next && onOpenLesson(next.id)}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Sticky Mark Complete CTA */}
      <div
        className={`sticky bottom-4 transition-all duration-500 ${
          reachedEnd || isCompleted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {isCompleted ? (
          <Button
            variant="outline"
            className="w-full font-body sora-semibold py-6 shadow-elevated bg-background"
            onClick={() => (next ? onOpenLesson(next.id) : onBack())}
          >
            <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
            {next ? "Already completed — Next lesson" : "Already completed — Back to course"}
          </Button>
        ) : (
          <Button
            className="w-full font-body sora-semibold py-6 shadow-elevated"
            onClick={handleComplete}
            disabled={saving}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {saving ? "Saving…" : next ? "Mark as complete & continue" : "Mark as complete"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LessonView;