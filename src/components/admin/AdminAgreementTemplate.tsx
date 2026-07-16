/**
 * Admin editor for the mentorship agreement template.
 * Lets admins manage form fields (label, key, type, options, required) and
 * the standard terms paragraphs. A single live template — edits overwrite.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  FileSignature,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AgreementTemplatePreview from "./AgreementTemplatePreview";
import {
  DEFAULT_TEMPLATE,
  loadAgreementTemplate,
  type AgreementField,
  type AgreementFieldType,
  type AgreementTermBlock,
} from "@/lib/agreementTemplate";

const TYPE_OPTIONS: { value: AgreementFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "multiselect", label: "Dropdown (multi-select)" },
  { value: "radio", label: "Radio buttons" },
  { value: "checkbox", label: "Checkbox (single)" },
  { value: "checkbox_group", label: "Checkboxes (multi-select)" },
  { value: "date", label: "Date" },
];

const slugifyKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "field";

const move = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
};

const AdminAgreementTemplate = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<AgreementField[]>([]);
  const [terms, setTerms] = useState<AgreementTermBlock[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await loadAgreementTemplate();
      setFields(t.fields.length ? t.fields : DEFAULT_TEMPLATE.fields);
      setTerms(t.terms);
      setLoading(false);
    })();
  }, []);

  const updateField = (idx: number, patch: Partial<AgreementField>) =>
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const updateTerm = (idx: number, patch: Partial<AgreementTermBlock>) =>
    setTerms((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const addField = () =>
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: "New field", type: "text", required: false, options: [] },
    ]);

  const addTerm = () =>
    setTerms((prev) => [...prev, { heading: "New section", body: "" }]);

  const handleSave = async () => {
    // Validate keys unique & non-empty
    const keys = fields.map((f) => f.key.trim());
    if (keys.some((k) => !k)) {
      toast.error("Every field needs a key.");
      return;
    }
    if (new Set(keys).size !== keys.length) {
      toast.error("Field keys must be unique.");
      return;
    }
    setSaving(true);
    const cleanFields = fields.map((f) => ({
      key: f.key.trim(),
      label: f.label.trim() || f.key.trim(),
      type: f.type,
      required: !!f.required,
      options: (f.options || []).map((o) => String(o).trim()).filter(Boolean),
      helpText: f.helpText?.trim() || "",
    }));
    const cleanTerms = terms
      .map((t) => ({ heading: t.heading.trim(), body: t.body.trim() }))
      .filter((t) => t.heading || t.body);

    const { error } = await supabase
      .from("agreement_template" as any)
      .update({ fields: cleanFields, terms: cleanTerms })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save template.");
      return;
    }
    toast.success("Agreement template saved.");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Agreement template
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Define the form fields and standard terms shown to every mentor/mentee pair.
            In-progress agreements pick up changes immediately; signed ones stay locked.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="font-body">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save template
        </Button>
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          className="font-body"
        >
          <Eye className="h-4 w-4 mr-2" /> Preview
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-display text-base">Form fields</CardTitle>
          <Button variant="outline" size="sm" className="font-body" onClick={addField}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add field
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && (
            <p className="font-body text-sm text-muted-foreground">No fields yet.</p>
          )}
          {fields.map((field, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-body sora-semibold text-sm">Field {idx + 1}</p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFields((prev) => move(prev, idx, idx - 1))}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFields((prev) => move(prev, idx, idx + 1))}
                    disabled={idx === fields.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateField(idx, { label });
                    }}
                    onBlur={() => {
                      // Auto-fill key from label if key still looks default
                      if (/^field_\d+$/.test(field.key)) {
                        updateField(idx, { key: slugifyKey(field.label) });
                      }
                    }}
                    className="font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Storage key</Label>
                  <Input
                    value={field.key}
                    onChange={(e) => updateField(idx, { key: slugifyKey(e.target.value) })}
                    className="font-body font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Input type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(idx, { type: v as AgreementFieldType })}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="font-body">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(c) => updateField(idx, { required: !!c })}
                    />
                    <Label className="font-body text-sm">Required</Label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="font-body text-xs">Help text (optional)</Label>
                  <Input
                    value={field.helpText ?? ""}
                    onChange={(e) => updateField(idx, { helpText: e.target.value })}
                    className="font-body"
                    placeholder="Shown beneath the field"
                  />
                </div>

                {(field.type === "select" ||
                  field.type === "radio" ||
                  field.type === "multiselect" ||
                  field.type === "checkbox_group") && (
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="font-body text-xs">Options (one per line)</Label>
                    <Textarea
                      rows={Math.min(8, Math.max(3, field.options.length + 1))}
                      value={field.options.join("\n")}
                      onChange={(e) =>
                        updateField(idx, {
                          options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="font-body"
                      placeholder={"Option 1\nOption 2\nOption 3"}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-display text-base">Standard terms</CardTitle>
          <Button variant="outline" size="sm" className="font-body" onClick={addTerm}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add section
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {terms.length === 0 && (
            <p className="font-body text-sm text-muted-foreground">No terms sections yet.</p>
          )}
          {terms.map((term, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-body sora-semibold text-sm">Section {idx + 1}</p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTerms((prev) => move(prev, idx, idx - 1))}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTerms((prev) => move(prev, idx, idx + 1))}
                    disabled={idx === terms.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setTerms((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Heading</Label>
                <Input
                  value={term.heading}
                  onChange={(e) => updateTerm(idx, { heading: e.target.value })}
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Body</Label>
                <Textarea
                  rows={4}
                  value={term.body}
                  onChange={(e) => updateTerm(idx, { body: e.target.value })}
                  className="font-body"
                />
                <p className="font-body text-[11px] text-muted-foreground">
                  Tip: start a line with <code>-</code>, <code>*</code>, or <code>•</code> to make a bullet point. Leave a blank line between paragraphs.
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          className="font-body mr-2"
        >
          <Eye className="h-4 w-4 mr-2" /> Preview
        </Button>
        <Button onClick={handleSave} disabled={saving} className="font-body">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save template
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Agreement preview</DialogTitle>
          </DialogHeader>
          <AgreementTemplatePreview fields={fields} terms={terms} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgreementTemplate;