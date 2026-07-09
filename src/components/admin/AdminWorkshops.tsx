import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  TYPE_LABEL,
  type Workshop,
  type WorkshopType,
  type WorkshopVisibility,
} from "@/lib/workshopsData";

function toLocalDatetimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalDatetimeInput(local: string) {
  if (!local) return null;
  return new Date(local).toISOString();
}

const emptyForm = {
  id: "",
  title: "",
  type: "workshop" as WorkshopType,
  starts_at: "",
  ends_at: "",
  location: "",
  link: "",
  description: "",
  visibility: "all" as WorkshopVisibility,
};

const AdminWorkshops = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setWorkshops(await fetchAllWorkshops());
    } catch (e: any) {
      toast.error("Failed to load workshops");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (w: Workshop) => {
    setForm({
      id: w.id,
      title: w.title,
      type: w.type,
      starts_at: toLocalDatetimeInput(w.starts_at),
      ends_at: toLocalDatetimeInput(w.ends_at),
      location: w.location || "",
      link: w.link || "",
      description: w.description || "",
      visibility: w.visibility,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.starts_at) {
      toast.error("Title and start time are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        starts_at: fromLocalDatetimeInput(form.starts_at)!,
        ends_at: fromLocalDatetimeInput(form.ends_at),
        location: form.location.trim() || null,
        link: form.link.trim() || null,
        description: form.description.trim() || null,
        visibility: form.visibility,
      };
      if (form.id) {
        await updateWorkshop(form.id, payload);
        toast.success("Event updated");
      } else {
        await createWorkshop(payload);
        toast.success("Event created");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteWorkshop(id);
      toast.success("Event deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const now = new Date();
  const upcoming = workshops.filter((w) => new Date(w.starts_at) >= now);
  const past = workshops.filter((w) => new Date(w.starts_at) < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Sessions & Workshops</h2>
        <Button onClick={openNew} className="font-body">
          <Plus className="h-4 w-4 mr-1" /> New Event
        </Button>
      </div>

      {[
        { label: `Upcoming (${upcoming.length})`, items: upcoming },
        { label: `Past (${past.length})`, items: past },
      ].map((section) => (
        <Card key={section.label} className="shadow-card">
          <CardHeader>
            <CardTitle className="font-body text-base">{section.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.items.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">No events.</p>
            ) : (
              section.items.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-md border border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm sora-semibold">{w.title}</p>
                      <Badge variant="secondary" className="font-body text-[10px]">
                        {TYPE_LABEL[w.type]}
                      </Badge>
                      <Badge variant="outline" className="font-body text-[10px]">
                        {w.visibility === "all" ? "All users" : w.visibility === "mentor" ? "Mentors" : "Mentees"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-body text-xs">
                        {new Date(w.starts_at).toLocaleString()}
                      </span>
                    </div>
                    {w.description && (
                      <p className="font-body text-xs text-muted-foreground mt-1">{w.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(w)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(w.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {form.id ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-body text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="font-body"
                placeholder="Cohort V Kickoff Workshop"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WorkshopType })}>
                  <SelectTrigger className="font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="group_session">Group Session</SelectItem>
                    <SelectItem value="one_on_one">One-on-One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs">Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) => setForm({ ...form, visibility: v as WorkshopVisibility })}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="mentor">Mentors only</SelectItem>
                    <SelectItem value="mentee">Mentees only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs">Starts at</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="font-body"
                />
              </div>
              <div>
                <Label className="font-body text-xs">Ends at (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  className="font-body"
                />
              </div>
            </div>
            <div>
              <Label className="font-body text-xs">Location (optional)</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="font-body"
                placeholder="Online or address"
              />
            </div>
            <div>
              <Label className="font-body text-xs">Link (optional)</Label>
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="font-body"
                placeholder="https://zoom.us/..."
              />
            </div>
            <div>
              <Label className="font-body text-xs">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="font-body"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-body">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="font-body">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWorkshops;