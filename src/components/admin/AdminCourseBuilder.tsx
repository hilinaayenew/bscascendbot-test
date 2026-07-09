import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import LessonMarkdownEditor from "./LessonMarkdownEditor";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  fetchAllCourses,
  fetchChecklistItems,
  createCourse,
  updateCourse,
  deleteCourse,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  type DbCourse,
  type DbChecklistItem,
  type CourseAudience,
  type ChecklistRole,
} from "@/lib/coursesData";

const AUDIENCE_LABEL: Record<CourseAudience, string> = {
  mentor: "Mentors only",
  mentee: "Mentees only",
  both: "Mentors & Mentees",
};

const ROLE_LABEL: Record<ChecklistRole, string> = {
  mentor: "Mentor",
  mentee: "Mentee",
  both: "Both",
};

const SortableItem = ({
  item,
  onEdit,
  onDelete,
}: {
  item: DbChecklistItem;
  onEdit: (item: DbChecklistItem) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 border border-border rounded-md bg-background"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-body text-sm sora-medium">{item.title}</p>
          <Badge variant="outline" className="font-body text-[10px]">
            {ROLE_LABEL[item.target_role]}
          </Badge>
        </div>
        {item.description && (
          <p className="font-body text-xs text-muted-foreground mt-0.5">{item.description}</p>
        )}
        {item.resource_url && (
          <a
            href={item.resource_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-body text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            {item.resource_url.length > 40 ? item.resource_url.slice(0, 40) + "..." : item.resource_url}
          </a>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const emptyCourseForm = {
  id: "",
  title: "",
  description: "",
  audience: "both" as CourseAudience,
  cohort_label: "",
  published: true,
};

const emptyItemForm = {
  id: "",
  title: "",
  description: "",
  resource_url: "",
  target_role: "both" as ChecklistRole,
};

const AdminCourseBuilder = () => {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [items, setItems] = useState<DbChecklistItem[]>([]);

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [savingItem, setSavingItem] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadCourses = async () => {
    try {
      setCourses(await fetchAllCourses());
    } catch {
      toast.error("Failed to load courses");
    }
  };

  const loadItems = async (courseId: string) => {
    try {
      setItems(await fetchChecklistItems(courseId));
    } catch {
      toast.error("Failed to load checklist items");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (editingCourseId) loadItems(editingCourseId);
  }, [editingCourseId]);

  const editingCourse = courses.find((c) => c.id === editingCourseId);

  // Course CRUD
  const openNewCourse = () => {
    setCourseForm(emptyCourseForm);
    setCourseDialogOpen(true);
  };

  const openEditCourse = (c: DbCourse) => {
    setCourseForm({
      id: c.id,
      title: c.title,
      description: c.description || "",
      audience: c.audience,
      cohort_label: c.cohort_label || "",
      published: c.published,
    });
    setCourseDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: courseForm.title.trim(),
      description: courseForm.description.trim() || null,
      audience: courseForm.audience,
      cohort_label: courseForm.cohort_label.trim() || null,
      published: courseForm.published,
    };
    try {
      if (courseForm.id) {
        await updateCourse(courseForm.id, payload);
        toast.success("Course updated");
      } else {
        await createCourse(payload);
        toast.success("Course created");
      }
      setCourseDialogOpen(false);
      loadCourses();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const removeCourse = async (id: string) => {
    if (!confirm("Delete this course and all its checklist items? This cannot be undone.")) return;
    try {
      await deleteCourse(id);
      toast.success("Course deleted");
      if (editingCourseId === id) setEditingCourseId(null);
      loadCourses();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const togglePublished = async (c: DbCourse) => {
    try {
      await updateCourse(c.id, { published: !c.published });
      loadCourses();
    } catch {
      toast.error("Failed to update");
    }
  };

  // Item CRUD
  const openNewItem = () => {
    setItemForm(emptyItemForm);
    setItemDialogOpen(true);
  };

  const openEditItem = (it: DbChecklistItem) => {
    setItemForm({
      id: it.id,
      title: it.title,
      description: it.description || "",
      resource_url: it.resource_url || "",
      target_role: it.target_role,
    });
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.title.trim() || !editingCourseId) return;
    setSavingItem(true);
    try {
      const payload = {
        title: itemForm.title.trim(),
        description: itemForm.description.trim() || null,
        resource_url: itemForm.resource_url.trim() || null,
        target_role: itemForm.target_role,
      };
      if (itemForm.id) {
        await updateChecklistItem(itemForm.id, payload);
        toast.success("Item updated");
      } else {
        const maxOrder = items.reduce((m, it) => Math.max(m, it.sort_order), 0);
        await createChecklistItem({
          course_id: editingCourseId,
          ...payload,
          sort_order: maxOrder + 1,
        });
        toast.success("Item added");
      }
      setItemDialogOpen(false);
      loadItems(editingCourseId);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm("Delete this checklist item?")) return;
    try {
      await deleteChecklistItem(id);
      if (editingCourseId) loadItems(editingCourseId);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    try {
      await reorderChecklistItems(reordered.map((it, idx) => ({ id: it.id, sort_order: idx + 1 })));
    } catch {
      toast.error("Failed to save order");
      if (editingCourseId) loadItems(editingCourseId);
    }
  };

  // ===== EDITING A COURSE =====
  if (editingCourse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditingCourseId(null)} className="font-body">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to courses
          </Button>
          <Button onClick={openNewItem} className="font-body">
            <Plus className="h-4 w-4 mr-1" /> Add checklist item
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="font-display">{editingCourse.title}</CardTitle>
                {editingCourse.description && (
                  <p className="font-body text-sm text-muted-foreground mt-1">{editingCourse.description}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="font-body text-xs">
                    {AUDIENCE_LABEL[editingCourse.audience]}
                  </Badge>
                  {editingCourse.cohort_label && (
                    <Badge variant="outline" className="font-body text-xs">
                      {editingCourse.cohort_label}
                    </Badge>
                  )}
                  <Badge
                    className={`font-body text-xs ${
                      editingCourse.published ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {editingCourse.published ? "Published" : "Unpublished"}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEditCourse(editingCourse)} className="font-body">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-6">
                No checklist items yet. Click "Add checklist item" to create one.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map((it) => (
                      <SortableItem key={it.id} item={it} onEdit={openEditItem} onDelete={removeItem} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Item dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {itemForm.id ? "Edit lesson" : "New lesson"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-body text-xs">Title</Label>
                <Input
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  className="font-body"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="font-body text-xs">Lesson content</Label>
                  <span className="font-body text-[10px] text-muted-foreground">
                    Markdown supported · embed videos with [video](url)
                  </span>
                </div>
                <LessonMarkdownEditor
                  value={itemForm.description}
                  onChange={(next) => setItemForm({ ...itemForm, description: next })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="font-body text-xs">Resource URL (optional)</Label>
                  <Input
                    value={itemForm.resource_url}
                    onChange={(e) => setItemForm({ ...itemForm, resource_url: e.target.value })}
                    className="font-body"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="font-body text-xs">Target role</Label>
                  <Select
                    value={itemForm.target_role}
                    onValueChange={(v) => setItemForm({ ...itemForm, target_role: v as ChecklistRole })}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">Mentor only</SelectItem>
                      <SelectItem value="mentee">Mentee only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)} className="font-body">
                Cancel
              </Button>
              <Button onClick={saveItem} disabled={savingItem} className="font-body">
                {savingItem ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Course edit dialog (reused) */}
        <CourseDialog
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          form={courseForm}
          setForm={setCourseForm}
          onSave={saveCourse}
        />
      </div>
    );
  }

  // ===== COURSE LIST =====
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Course Builder</h2>
        <Button onClick={openNewCourse} className="font-body">
          <Plus className="h-4 w-4 mr-1" /> New course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-body text-sm text-muted-foreground">No courses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm sora-semibold">{c.title}</p>
                    {c.description && (
                      <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`font-body text-[10px] shrink-0 ${
                      c.published ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-body text-[10px]">
                    {AUDIENCE_LABEL[c.audience]}
                  </Badge>
                  {c.cohort_label && (
                    <Badge variant="outline" className="font-body text-[10px]">
                      {c.cohort_label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={c.published} onCheckedChange={() => togglePublished(c)} />
                    <span className="font-body text-xs text-muted-foreground">Published</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditingCourseId(c.id)} className="font-body h-8 text-xs">
                      Manage items
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditCourse(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeCourse(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        form={courseForm}
        setForm={setCourseForm}
        onSave={saveCourse}
      />
    </div>
  );
};

const CourseDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  form: typeof emptyCourseForm;
  setForm: (f: typeof emptyCourseForm) => void;
  onSave: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display">{form.id ? "Edit course" : "New course"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="font-body text-xs">Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="font-body" />
        </div>
        <div>
          <Label className="font-body text-xs">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="font-body"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-body text-xs">Audience</Label>
            <Select
              value={form.audience}
              onValueChange={(v) => setForm({ ...form, audience: v as CourseAudience })}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor">Mentors only</SelectItem>
                <SelectItem value="mentee">Mentees only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-body text-xs">Cohort label</Label>
            <Input
              value={form.cohort_label}
              onChange={(e) => setForm({ ...form, cohort_label: e.target.value })}
              className="font-body"
              placeholder="Cohort V"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
          <Label className="font-body text-xs">Published (visible to participants)</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
          Cancel
        </Button>
        <Button onClick={onSave} className="font-body">
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default AdminCourseBuilder;