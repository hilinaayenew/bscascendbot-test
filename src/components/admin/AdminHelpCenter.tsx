/**
 * Purpose: Admin UI to manage Help Center content — contacts, articles, FAQs.
 * DB tables: help_contacts, help_articles, help_faqs
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

type Row = Record<string, any>;

const blanks = {
  help_contacts: { name: "", role: "", email: "", phone: "", whatsapp: "", notes: "", sort_order: 0, is_active: true },
  help_articles: { title: "", body: "", category: "", sort_order: 0, is_active: true },
  help_faqs: { question: "", answer: "", category: "", sort_order: 0, is_active: true },
} as const;

type TableName = keyof typeof blanks;

const useRows = (table: TableName) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("sort_order").order("created_at");
    if (error) toast.error(`Failed to load ${table}`);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [table]);

  return { rows, setRows, loading, refresh };
};

const Section = ({ table, fields }: { table: TableName; fields: { key: string; label: string; textarea?: boolean }[] }) => {
  const { rows, setRows, loading, refresh } = useRows(table);
  const [draft, setDraft] = useState<Row>({ ...blanks[table] });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    const payload: Row = { ...draft };
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    const { error } = await (supabase.from(table) as any).insert(payload);
    setSaving(false);
    if (error) return toast.error("Failed to add: " + error.message);
    toast.success("Added.");
    setDraft({ ...blanks[table] });
    refresh();
  };

  const save = async (row: Row) => {
    const { id, created_at, updated_at, ...patch } = row;
    Object.keys(patch).forEach((k) => { if (patch[k] === "") patch[k] = null; });
    const { error } = await (supabase.from(table) as any).update(patch).eq("id", id);
    if (error) return toast.error("Save failed: " + error.message);
    toast.success("Saved.");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error("Delete failed: " + error.message);
    toast.success("Deleted.");
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, key: string, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  return (
    <div className="space-y-4">
      {/* Add new */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <p className="font-body font-semibold text-sm">Add new</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
                <Label className="font-body text-xs">{f.label}</Label>
                {f.textarea ? (
                  <Textarea
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <Input
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div>
              <Label className="font-body text-xs">Sort order</Label>
              <Input
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              <Label className="font-body text-xs">Active</Label>
            </div>
          </div>
          <Button size="sm" onClick={add} disabled={saving} className="font-body">
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </CardContent>
      </Card>

      {/* Existing */}
      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        rows.map((row) => (
          <Card key={row.id} className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
                    <Label className="font-body text-xs">{f.label}</Label>
                    {f.textarea ? (
                      <Textarea
                        value={row[f.key] ?? ""}
                        onChange={(e) => updateRow(row.id, f.key, e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <Input
                        value={row[f.key] ?? ""}
                        onChange={(e) => updateRow(row.id, f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                <div>
                  <Label className="font-body text-xs">Sort order</Label>
                  <Input
                    type="number"
                    value={row.sort_order ?? 0}
                    onChange={(e) => updateRow(row.id, "sort_order", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch checked={!!row.is_active} onCheckedChange={(v) => updateRow(row.id, "is_active", v)} />
                  <Label className="font-body text-xs">Active</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => save(row)} className="font-body">
                  <Save className="h-4 w-4 mr-1" />Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(row.id)} className="font-body text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

const AdminHelpCenter = () => {
  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-muted-foreground">
        Manage what users see in the Help Center (sidebar link and the ? icon in the header).
      </p>
      <Tabs defaultValue="contacts">
        <TabsList className="font-body">
          <TabsTrigger value="contacts">Key contacts</TabsTrigger>
          <TabsTrigger value="articles">Helpful information</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4">
          <Section
            table="help_contacts"
            fields={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role / Title" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "whatsapp", label: "WhatsApp (with country code)" },
              { key: "notes", label: "Notes", textarea: true },
            ]}
          />
        </TabsContent>
        <TabsContent value="articles" className="mt-4">
          <Section
            table="help_articles"
            fields={[
              { key: "title", label: "Title" },
              { key: "category", label: "Category (optional)" },
              { key: "body", label: "Body", textarea: true },
            ]}
          />
        </TabsContent>
        <TabsContent value="faqs" className="mt-4">
          <Section
            table="help_faqs"
            fields={[
              { key: "question", label: "Question" },
              { key: "category", label: "Category (optional)" },
              { key: "answer", label: "Answer", textarea: true },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHelpCenter;