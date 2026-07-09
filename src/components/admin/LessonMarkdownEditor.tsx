import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Video,
  Quote,
  Minus,
  HelpCircle,
} from "lucide-react";
import LessonContent from "@/components/courses/LessonContent";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Markdown editor with a quick-insert toolbar and a live-preview tab.
 * Designed for course lesson bodies — supports videos via [video](url) syntax.
 */
const LessonMarkdownEditor = ({ value, onChange }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [showHelp, setShowHelp] = useState(false);

  const wrap = (before: string, after: string = before, placeholder = "text") => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  };

  const insertLine = (prefix: string, placeholder = "text") => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n" : "") + prefix + placeholder;
    const next = before + insert + after;
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = before.length + insert.length - placeholder.length;
      ta.selectionStart = cursor;
      ta.selectionEnd = cursor + placeholder.length;
    });
  };

  const insertVideo = () => {
    const url = window.prompt(
      "Paste a video URL (YouTube, Vimeo, Loom, Wistia, or any embed URL):"
    );
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    const ta = ref.current;
    const start = ta?.selectionStart ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const snippet = `${needsNewline ? "\n\n" : "\n"}[video](${trimmed})\n\n`;
    onChange(before + snippet + after);
  };

  const insertLink = () => {
    const url = window.prompt("Link URL:");
    if (!url) return;
    wrap("[", `](${url.trim()})`, "link text");
  };

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    const ta = ref.current;
    const start = ta?.selectionStart ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const snippet = `${needsNewline ? "\n\n" : "\n"}![image](${url.trim()})\n\n`;
    onChange(before + snippet + after);
  };

  const Btn = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: typeof Bold;
    label: string;
    onClick: () => void;
  }) => (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="h-8 w-8"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
          <TabsList className="h-7 bg-background">
            <TabsTrigger value="write" className="font-body text-xs h-6 px-2">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="font-body text-xs h-6 px-2">
              Preview
            </TabsTrigger>
          </TabsList>
          {tab === "write" && (
            <div className="flex items-center gap-0.5 flex-wrap">
              <Btn icon={Heading2} label="Heading" onClick={() => insertLine("## ", "Heading")} />
              <Btn icon={Heading3} label="Subheading" onClick={() => insertLine("### ", "Subheading")} />
              <Btn icon={Bold} label="Bold" onClick={() => wrap("**", "**", "bold text")} />
              <Btn icon={Italic} label="Italic" onClick={() => wrap("*", "*", "italic text")} />
              <Btn icon={List} label="Bullet list" onClick={() => insertLine("- ", "List item")} />
              <Btn icon={ListOrdered} label="Numbered list" onClick={() => insertLine("1. ", "List item")} />
              <Btn icon={Quote} label="Quote" onClick={() => insertLine("> ", "Quote")} />
              <Btn icon={Minus} label="Divider" onClick={() => insertLine("\n---\n", "")} />
              <Btn icon={Link2} label="Link" onClick={insertLink} />
              <Btn icon={ImageIcon} label="Image" onClick={insertImage} />
              <Btn icon={Video} label="Embed video" onClick={insertVideo} />
              <Btn icon={HelpCircle} label="Formatting help" onClick={() => setShowHelp((s) => !s)} />
            </div>
          )}
        </div>

        {showHelp && tab === "write" && (
          <div className="border-b border-border bg-muted/30 px-3 py-2 font-body text-[11px] text-muted-foreground space-y-1">
            <p><code className="text-foreground">## Heading</code> · <code className="text-foreground">**bold**</code> · <code className="text-foreground">*italic*</code> · <code className="text-foreground">- bullet</code> · <code className="text-foreground">1. numbered</code></p>
            <p>Link: <code className="text-foreground">[label](https://...)</code> · Image: <code className="text-foreground">![alt](https://image.url)</code></p>
            <p>Video: <code className="text-foreground">[video](https://youtu.be/...)</code> — works for YouTube, Vimeo, Loom, Wistia, or any /embed/ URL.</p>
            <p>Use a blank line between paragraphs for spacing.</p>
          </div>
        )}

        <TabsContent value="write" className="m-0">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            placeholder={`Write the lesson here.\n\n## A section heading\n\nA paragraph of content. Leave a blank line between paragraphs for spacing.\n\n- A bullet point\n- Another bullet\n\n[video](https://youtu.be/dQw4w9WgXcQ)`}
            className="font-mono text-sm min-h-[260px] rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
          />
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div className="p-4 min-h-[260px] max-h-[60vh] overflow-y-auto">
            {value.trim() ? (
              <LessonContent content={value} />
            ) : (
              <p className="font-body text-sm text-muted-foreground italic">
                Nothing to preview yet — switch to Write and add some content.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LessonMarkdownEditor;