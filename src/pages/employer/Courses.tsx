import { useEffect, useState } from "react";
import EmployerLayout from "@/components/employer/EmployerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMyEmployer } from "@/hooks/useEmployer";
import { Loader2, Plus, BookOpen, Users, Globe, Lock, Trash2 } from "lucide-react";

interface EmployerCourseRow {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  visibility: "private" | "public";
  published: boolean;
  enrollment_count?: number;
}

const EmployerCourses = () => {
  const { employer } = useMyEmployer();
  const [courses, setCourses] = useState<EmployerCourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployerCourseRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!employer) return;
    setLoading(true);
    const { data } = await supabase
      .from("employer_courses")
      .select("id, title, description, content, visibility, published")
      .eq("employer_id", employer.id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as EmployerCourseRow[];
    if (rows.length) {
      const { data: counts } = await supabase
        .from("employer_course_enrollments")
        .select("course_id")
        .in("course_id", rows.map((c) => c.id));
      const map = new Map<string, number>();
      (counts ?? []).forEach((r: any) => map.set(r.course_id, (map.get(r.course_id) ?? 0) + 1));
      rows.forEach((r) => (r.enrollment_count = map.get(r.id) ?? 0));
    }
    setCourses(rows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employer?.id]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setContent("");
    setVisibility("private");
    setPublished(true);
    setOpen(true);
  };

  const openEdit = (c: EmployerCourseRow) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description ?? "");
    setContent(c.content ?? "");
    setVisibility(c.visibility);
    setPublished(c.published);
    setOpen(true);
  };

  const save = async () => {
    if (!employer) return;
    if (!title.trim()) {
      toast({ title: "Add a title", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      employer_id: employer.id,
      title: title.trim(),
      description: description.trim() || null,
      content: content.trim() || null,
      visibility,
      published,
    };
    const { error } = editing
      ? await supabase.from("employer_courses").update(payload).eq("id", editing.id)
      : await supabase.from("employer_courses").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save course", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Course updated" : "Course created" });
    setOpen(false);
    void load();
  };

  const remove = async (c: EmployerCourseRow) => {
    if (!confirm(`Delete "${c.title}"? This will also remove all enrollments.`)) return;
    const { error } = await supabase.from("employer_courses").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    void load();
  };

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Courses</h1>
            <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
              Upload courses for your team or share them publicly with all Ascendency learners.
            </p>
          </div>
          <Button onClick={openCreate} className="font-body sora-semibold">
            <Plus className="h-4 w-4 mr-2" /> Create course
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-foreground/70 sora-regular">
                No courses yet. Create your first one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Card key={c.id} className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-base font-semibold text-accent">{c.title}</h3>
                    <Badge variant="outline" className="font-body text-[11px]">
                      {c.visibility === "public" ? (
                        <><Globe className="h-3 w-3 mr-1" />Public</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" />Team only</>
                      )}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="font-body text-sm text-foreground/70 sora-regular line-clamp-3">{c.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-body text-foreground/70">
                    <span className={`sora-semibold ${c.published ? "text-emerald-700" : "text-amber-700"}`}>
                      {c.published ? "Published" : "Draft"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {c.enrollment_count ?? 0} enrolled
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button size="sm" variant="outline" className="font-body" onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="font-body text-destructive hover:text-destructive" onClick={() => remove(c)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit course" : "Create course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="font-body">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Short description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={280} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Content (markdown)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Lesson content, links, instructions..." />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
                <div>
                  <p className="font-body sora-semibold text-sm">Visibility</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {visibility === "public" ? "Any learner on Ascendency can enroll." : "Only members of your team can enroll."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={visibility === "public"} onCheckedChange={(v) => setVisibility(v ? "public" : "private")} />
                  <span className="font-body text-xs">Public</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
                <div>
                  <p className="font-body sora-semibold text-sm">Published</p>
                  <p className="font-body text-xs text-muted-foreground">Unpublished drafts stay hidden from learners.</p>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="font-body sora-semibold">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save changes" : "Create course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EmployerLayout>
  );
};

export default EmployerCourses;