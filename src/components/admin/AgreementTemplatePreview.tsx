/**
 * Read-only preview of the agreement template as signers will see it.
 * Renders the same field controls as src/pages/Agreement.tsx but disabled,
 * driven by the in-editor template state so admins can preview before saving.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { RenderBody } from "@/lib/agreementBody";
import type {
  AgreementField,
  AgreementTermBlock,
} from "@/lib/agreementTemplate";


const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

interface Props {
  fields: AgreementField[];
  terms: AgreementTermBlock[];
  interactive?: boolean;
}

const PreviewField = ({
  field,
  value,
  onChange,
  disabled,
}: {
  field: AgreementField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) => {
  const wrapperClass =
    field.type === "textarea" ? "md:col-span-2 space-y-2" : "space-y-2";
  const labelNode = (
    <Label className="font-body">
      {field.label}
      {field.required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  );
  const helpNode = field.helpText ? (
    <p className="font-body text-xs text-muted-foreground">{field.helpText}</p>
  ) : null;

  switch (field.type) {
    case "textarea":
      return (
        <div className={wrapperClass}>
          {labelNode}
          <Textarea
            rows={4}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="font-body"
          />
          {helpNode}
        </div>
      );
    case "select":
      return (
        <div className={wrapperClass}>
          {labelNode}
          <Select value={String(value ?? "")} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className="font-body">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.length === 0 ? (
                <SelectItem value="__none" disabled className="font-body">
                  (no options configured)
                </SelectItem>
              ) : (
                field.options.map((opt) => (
                  <SelectItem key={opt} value={opt} className="font-body">
                    {opt}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {helpNode}
        </div>
      );
    case "radio":
      return (
        <div className={wrapperClass}>
          {labelNode}
          <RadioGroup
            value={String(value ?? "")}
            onValueChange={onChange}
            disabled={disabled}
            className="flex flex-col gap-2 pt-1"
          >
            {field.options.length === 0 ? (
              <p className="font-body text-xs italic text-muted-foreground">
                (no options configured)
              </p>
            ) : (
              field.options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`prev-${field.key}-${opt}`} />
                  <Label
                    htmlFor={`prev-${field.key}-${opt}`}
                    className="font-body font-normal cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))
            )}
          </RadioGroup>
          {helpNode}
        </div>
      );
    case "checkbox":
      return (
        <div className={wrapperClass}>
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id={`prev-${field.key}-cb`}
              checked={!!value}
              onCheckedChange={(c) => onChange(!!c)}
              disabled={disabled}
            />
            <Label
              htmlFor={`prev-${field.key}-cb`}
              className="font-body font-normal cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          </div>
          {helpNode}
        </div>
      );
    case "multiselect": {
      const selected = toArray(value);
      const toggle = (opt: string) => {
        if (disabled) return;
        onChange(
          selected.includes(opt)
            ? selected.filter((s) => s !== opt)
            : [...selected, opt],
        );
      };
      return (
        <div className={wrapperClass}>
          {labelNode}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="font-body w-full justify-between font-normal"
              >
                <span className={selected.length ? "" : "text-muted-foreground"}>
                  {selected.length ? selected.join(", ") : "Select one or more..."}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
              {field.options.length === 0 ? (
                <p className="font-body text-xs text-muted-foreground p-2">
                  No options configured.
                </p>
              ) : (
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {field.options.map((opt) => (
                    <label
                      key={opt}
                      htmlFor={`prev-${field.key}-ms-${opt}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer font-body text-sm"
                    >
                      <Checkbox
                        id={`prev-${field.key}-ms-${opt}`}
                        checked={selected.includes(opt)}
                        onCheckedChange={() => toggle(opt)}
                        disabled={disabled}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          {helpNode}
        </div>
      );
    }
    case "checkbox_group": {
      const selected = toArray(value);
      const toggle = (opt: string) => {
        if (disabled) return;
        onChange(
          selected.includes(opt)
            ? selected.filter((s) => s !== opt)
            : [...selected, opt],
        );
      };
      return (
        <div className={wrapperClass}>
          {labelNode}
          <div className="flex flex-col gap-2 pt-1">
            {field.options.length === 0 ? (
              <p className="font-body text-xs italic text-muted-foreground">
                (no options configured)
              </p>
            ) : (
              field.options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`prev-${field.key}-cbg-${opt}`}
                    checked={selected.includes(opt)}
                    onCheckedChange={() => toggle(opt)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`prev-${field.key}-cbg-${opt}`}
                    className="font-body font-normal cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))
            )}
          </div>
          {helpNode}
        </div>
      );
    }
    case "date":
      return (
        <div className={wrapperClass}>
          {labelNode}
          <Input
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="font-body"
          />
          {helpNode}
        </div>
      );
    case "text":
    default:
      return (
        <div className={wrapperClass}>
          {labelNode}
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="font-body"
          />
          {helpNode}
        </div>
      );
  }
};

const AgreementTemplatePreview = ({ fields, terms, interactive = true }: Props) => {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [signature, setSignature] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-lg font-bold">
            Mentorship Agreement — Sample Mentee &amp; Sample Mentor
          </h3>
          <p className="font-body text-xs text-muted-foreground">
            This is exactly what mentors and mentees will see. Nothing here is saved.
          </p>
        </div>
        <Badge className="font-body capitalize bg-amber-100 text-amber-800 hover:bg-amber-100">
          pending details
        </Badge>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Agreement details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.length === 0 ? (
            <p className="md:col-span-2 font-body text-sm text-muted-foreground">
              No fields configured yet.
            </p>
          ) : (
            fields.map((f, i) => (
              <PreviewField
                key={`${f.key}-${i}`}
                field={f}
                value={responses[f.key]}
                onChange={(v) =>
                  interactive && setResponses((prev) => ({ ...prev, [f.key]: v }))
                }
                disabled={!interactive}
              />
            ))
          )}
          {interactive && fields.length > 0 && (
            <div className="md:col-span-2 flex justify-end">
              <Button disabled className="font-body">
                Save details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Standard terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 font-body text-sm leading-relaxed">
          {terms.length === 0 ? (
            <p className="text-muted-foreground">No terms sections configured.</p>
          ) : (
            terms.map((t, i) => (
              <div key={`${t.heading}-${i}`}>
                <p className="sora-semibold text-foreground">{t.heading}</p>
                <RenderBody text={t.body} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="font-body sora-semibold text-sm">Mentee — Sample Mentee</p>
            <Label className="font-body text-xs text-muted-foreground">
              Type your full name to sign
            </Label>
            <div className="flex flex-wrap gap-2">
              <Input
                value={signature}
                onChange={(e) => interactive && setSignature(e.target.value)}
                placeholder="Your full name"
                className="font-body flex-1 min-w-[200px]"
                disabled={!interactive}
              />
              <Button disabled className="font-body">
                Sign agreement
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-body sora-semibold text-sm">Mentor — Sample Mentor</p>
            <p className="font-body text-sm text-muted-foreground italic mt-1">
              Awaiting signature
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementTemplatePreview;