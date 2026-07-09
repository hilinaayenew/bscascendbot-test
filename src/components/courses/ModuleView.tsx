import { useState, useEffect, useRef } from "react";
import { Course, CourseModule, ACCENT_COLORS } from "@/lib/courseData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface ModuleViewProps {
  course: Course;
  module: CourseModule;
  isCompleted: boolean;
  onBack: () => void;
  onMarkComplete: () => void;
}

const PLACEHOLDER_CONTENT = [
  "Welcome to this module. In this lesson, we'll explore key concepts that will help you grow professionally and personally.",
  "Learning is a journey, not a destination. As you work through this material, take time to reflect on how each concept applies to your own career path and aspirations.",
  "## Key Concepts",
  "Understanding the fundamentals is critical. Whether you're just starting out or looking to refine your approach, the principles covered here will serve as a strong foundation.",
  "Think about the professionals you admire. What habits do they have? What makes them effective? These are the kinds of questions we'll explore throughout this module.",
  "## Practical Application",
  "Theory without practice is incomplete. As you go through this content, consider how you might apply these ideas in your daily interactions, your current role, or your next career move.",
  "Take notes as you go. Writing things down helps with retention and gives you a reference to return to later. Consider keeping a learning journal alongside this course.",
  "## Reflection Exercise",
  "Before moving on, take a moment to think about:",
  "• What is one thing you've learned so far that surprised you?",
  "• How does this connect to your current career goals?",
  "• What is one action you can take this week based on what you've learned?",
  "",
  "## Video Resource",
  "Below is a placeholder for the video content that will accompany this module. Video lessons provide a deeper dive into the concepts covered in the text.",
  "",
  "## Summary",
  "In this module, we covered the essential building blocks that will prepare you for the next steps in your journey. Remember that growth happens incrementally — each small step compounds over time.",
  "Take what you've learned here and put it into practice. The best way to solidify knowledge is through action. When you're ready, mark this module as complete and move on to the next one.",
  "",
  "## Additional Reading",
  "For those who want to go deeper, consider exploring the following topics on your own:",
  "• Industry-specific networking strategies",
  "• Building authentic professional relationships across cultures",
  "• Leveraging digital tools for career development in Africa",
  "• The role of mentorship in accelerating professional growth",
  "",
  "Congratulations on completing this module's content! When you're ready, use the button below to mark it as complete.",
];

const ModuleView = ({ course, module, isCompleted, onBack, onMarkComplete }: ModuleViewProps) => {
  const [reachedEnd, setReachedEnd] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const colors = ACCENT_COLORS[course.accent];

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReachedEnd(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="font-body text-xs text-muted-foreground sora-medium">{course.title}</p>
          <h2 className="font-display text-xl font-bold truncate">{module.title}</h2>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-card rounded-lg border border-border p-6 md:p-8 space-y-4">
        {/* Placeholder video embed */}
        <div className={`w-full aspect-video rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="font-body text-sm text-muted-foreground">Video content coming soon</p>
          </div>
        </div>

        {/* Placeholder text content */}
        {PLACEHOLDER_CONTENT.map((line, i) => {
          if (line.startsWith("## ")) {
            return (
              <h3 key={i} className="font-body text-lg sora-semibold text-foreground pt-4">
                {line.replace("## ", "")}
              </h3>
            );
          }
          if (line.startsWith("• ")) {
            return (
              <p key={i} className="font-body text-sm text-foreground/80 pl-4">
                {line}
              </p>
            );
          }
          if (line === "") return <div key={i} className="h-2" />;
          return (
            <p key={i} className="font-body text-sm text-foreground/80 leading-relaxed">
              {line}
            </p>
          );
        })}

        {/* Sentinel for scroll detection */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Mark as complete button — only visible once scrolled to end */}
      <div
        className={`sticky bottom-4 transition-all duration-500 ${
          reachedEnd ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {isCompleted ? (
          <Button
            variant="outline"
            className="w-full font-body sora-semibold py-6 shadow-elevated"
            onClick={onBack}
          >
            <CheckCircle2 className={`h-5 w-5 mr-2 ${colors.fill.replace("bg-", "text-")}`} />
            Already completed — Return to course
          </Button>
        ) : (
          <Button
            className="w-full font-body sora-semibold py-6 shadow-elevated"
            onClick={onMarkComplete}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Mark as complete
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModuleView;
