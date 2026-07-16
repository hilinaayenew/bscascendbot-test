/**
 * Mentorship agreement page — shared between mentor and mentee.
 * Routed at /dashboard/agreement/:pairingId.
 */
import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Download, Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { RenderBody } from "@/lib/agreementBody";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import {
  loadAgreementTemplate,
  seedResponsesFromLegacy,
  getMissingRequired,
  type AgreementTemplate,
  type AgreementField,
} from "@/lib/agreementTemplate";
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

const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

const MultiSelectDropdown = ({
  field,
  value,
  disabled,
  onChange,
  idPrefix = "",
}: {
  field: AgreementField;
  value: unknown;
  disabled?: boolean;
  onChange: (v: string[]) => void;
  idPrefix?: string;
}) => {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="font-body w-full justify-between font-normal"
        >
          <span className={selected.length ? "" : "text-muted-foreground"}>
            {selected.length
              ? selected.join(", ")
              : "Select one or more..."}
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
                htmlFor={`${idPrefix}${field.key}-ms-${opt}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer font-body text-sm"
              >
                <Checkbox
                  id={`${idPrefix}${field.key}-ms-${opt}`}
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
  );
};

type AgreementRow = {
  id: string;
  pairing_id: string;
  mentee_id: string;
  mentor_id: string;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_frequency: string | null;
  meeting_platform: string | null;
  mentee_goals: string | null;
  additional_notes: string | null;
  form_responses: Record<string, unknown> | null;
  mentee_signature: string | null;
  mentee_signed_at: string | null;
  mentor_signature: string | null;
  mentor_signed_at: string | null;
  status: "pending_details" | "pending_signatures" | "complete";
  created_at: string;
};

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const Agreement = () => {
  const { pairingId } = useParams();
  const { user, profile, loading } = useAuth();

  const [agreement, setAgreement] = useState<AgreementRow | null>(null);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [menteeName, setMenteeName] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [signatureInput, setSignatureInput] = useState("");
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  const isMentor = !!(user && agreement && user.id === agreement.mentor_id);
  const isMentee = !!(user && agreement && user.id === agreement.mentee_id);
  const isParty = isMentor || isMentee;
  const isComplete = agreement?.status === "complete";
  const sharedLocked = isComplete;
  const otherSigned = !!agreement && (
    (isMentor && !!agreement.mentee_signature) ||
    (isMentee && !!agreement.mentor_signature)
  );

  const missingRequired = useMemo(
    () => (template ? getMissingRequired(template, responses) : []),
    [template, responses],
  );
  const detailsComplete = missingRequired.length === 0;

  const load = async () => {
    if (!pairingId) return;
    setFetching(true);
    const [{ data, error }, tmpl] = await Promise.all([
      supabase
        .from("agreements" as any)
        .select("*")
        .eq("pairing_id", pairingId)
        .maybeSingle(),
      loadAgreementTemplate(),
    ]);
    setTemplate(tmpl);
    if (error) {
      toast.error("Could not load agreement.");
      setFetching(false);
      return;
    }
    const row = (data as unknown) as AgreementRow | null;
    setAgreement(row);
    if (row) {
      const seeded = seedResponsesFromLegacy(
        (row.form_responses as Record<string, unknown>) || {},
        {
          meeting_day: row.meeting_day || "",
          meeting_time: row.meeting_time || "",
          meeting_frequency: row.meeting_frequency || "",
          meeting_platform: row.meeting_platform || "",
          mentee_goals: row.mentee_goals || "",
          additional_notes: row.additional_notes || "",
        },
      );
      setResponses(seeded);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", [row.mentee_id, row.mentor_id]);
      const m = new Map((profs || []).map((p: any) => [p.user_id, p.full_name as string]));
      setMenteeName(m.get(row.mentee_id) || "Mentee");
      setMentorName(m.get(row.mentor_id) || "Mentor");
    }
    setFetching(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pairingId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agreement) {
    return (
      <DashboardLayout>
        <Card className="shadow-card">
          <CardContent className="p-8 text-center font-body">
            <p className="text-muted-foreground">Agreement not found for this pairing.</p>
            <Link to="/dashboard/pairings" className="text-primary underline mt-4 inline-block">
              Back to pairings
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!isParty) {
    return (
      <DashboardLayout>
        <Card className="shadow-card">
          <CardContent className="p-8 text-center font-body">
            <p className="text-muted-foreground">You don't have access to this agreement.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handleSave = async () => {
    if (sharedLocked) return;
    setSaving(true);
    // Mirror the four legacy meeting columns so existing reports/exports stay populated
    // when the relevant keys exist in the template.
    const legacyMirror: Record<string, unknown> = {};
    for (const k of ["meeting_day","meeting_time","meeting_frequency","meeting_platform","mentee_goals","additional_notes"]) {
      if (responses[k] !== undefined) legacyMirror[k] = typeof responses[k] === "string" ? responses[k] : JSON.stringify(responses[k]);
    }
    const { error } = await supabase
      .from("agreements" as any)
      .update({ form_responses: responses, ...legacyMirror })
      .eq("id", agreement.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save changes.");
      return;
    }
    toast.success("Agreement details saved.");
    load();
  };

  const handleSign = async () => {
    if (!signatureInput.trim()) {
      toast.error("Type your full name to sign.");
      return;
    }
    if (!detailsComplete) {
      toast.error(`Please fill in required fields: ${missingRequired.join(", ")}`);
      return;
    }
    setSigning(true);
    const patch: Record<string, unknown> = {};
    if (isMentor) {
      patch.mentor_signature = signatureInput.trim();
    } else if (isMentee) {
      patch.mentee_signature = signatureInput.trim();
    }
    const { error } = await supabase
      .from("agreements" as any)
      .update(patch)
      .eq("id", agreement.id);
    setSigning(false);
    if (error) {
      toast.error(error.message || "Could not record signature.");
      return;
    }
    toast.success("Agreement signed.");
    setSignatureInput("");
    load();
  };

  const pdfData = () => ({
    menteeName,
    mentorName,
    ...agreement,
    responses,
    template: template || undefined,
  });

  const handleDownload = () => {
    downloadAgreementPdf(pdfData());
  };

  const handleEmailMe = async () => {
    if (!profile?.email) {
      toast.error("No email on file for your account.");
      return;
    }
    setEmailing(true);
    const url = `${window.location.origin}/dashboard/agreement/${agreement.pairing_id}`;
    const otherPartyName = isMentor ? menteeName : mentorName;
    const signedDate =
      agreement.mentee_signed_at && agreement.mentor_signed_at
        ? fmt(
            new Date(agreement.mentee_signed_at) > new Date(agreement.mentor_signed_at)
              ? agreement.mentee_signed_at
              : agreement.mentor_signed_at,
          )
        : undefined;
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "agreement-link",
        recipientEmail: profile.email,
        idempotencyKey: `agreement-link-${agreement.id}-${user.id}-${Date.now()}`,
        templateData: {
          name: profile.full_name || undefined,
          otherPartyName,
          agreementUrl: url,
          status: agreement.status,
          signedDate,
        },
      },
    });
    setEmailing(false);
    if (error) {
      toast.error("Could not send email. Please try again.");
      return;
    }
    toast.success(`Link sent to ${profile.email}.`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link
              to="/dashboard/pairings"
              className="font-body text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to pairings
            </Link>
            <h1 className="font-display text-2xl font-bold mt-1">
              Mentorship Agreement — {menteeName} &amp; {mentorName}
            </h1>
          </div>
          <Badge
            className={`font-body capitalize ${
              isComplete
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
            }`}
          >
            {agreement.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {isComplete && (
          <Alert className="bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <AlertDescription className="font-body text-emerald-900">
              Agreement signed by both parties on{" "}
              {fmt(
                new Date(agreement.mentee_signed_at!) > new Date(agreement.mentor_signed_at!)
                  ? agreement.mentee_signed_at
                  : agreement.mentor_signed_at,
              )}
              .
            </AlertDescription>
          </Alert>
        )}

        {otherSigned && !isComplete && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="font-body">
              The other party has signed. You can still edit details before signing, but any edits to shared details will clear their signature and they will need to sign again.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Agreement details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(template?.fields || []).map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={responses[field.key]}
                disabled={sharedLocked}
                onChange={(v) => setResponses((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
            {!sharedLocked && (template?.fields?.length ?? 0) > 0 && (
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="font-body">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
          <CardContent className="space-y-4 font-body text-sm leading-relaxed text-foreground">
            {(template?.terms || []).map((t) => (
              <div key={t.heading}>
                <p className="sora-semibold text-foreground">{t.heading}</p>
                <RenderBody text={t.body} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignatureBlock
              label={`Mentee — ${menteeName}`}
              signature={agreement.mentee_signature}
              signedAt={agreement.mentee_signed_at}
              canSign={isMentee && !agreement.mentee_signature}
              isYou={isMentee}
              signatureInput={signatureInput}
              setSignatureInput={setSignatureInput}
              onSign={handleSign}
              signing={signing}
              detailsComplete={detailsComplete}
              showWhenSelf={isMentee}
            />
            <SignatureBlock
              label={`Mentor — ${mentorName}`}
              signature={agreement.mentor_signature}
              signedAt={agreement.mentor_signed_at}
              canSign={isMentor && !agreement.mentor_signature}
              isYou={isMentor}
              signatureInput={signatureInput}
              setSignatureInput={setSignatureInput}
              onSign={handleSign}
              signing={signing}
              detailsComplete={detailsComplete}
              showWhenSelf={isMentor}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5 flex flex-wrap items-center gap-3 justify-between">
            <p className="font-body text-sm text-muted-foreground">
              Keep a copy of this agreement for your records.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleEmailMe} disabled={emailing} className="font-body">
                {emailing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Email me the link
              </Button>
              <Button onClick={handleDownload} className="font-body">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const Field = ({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <Label className="font-body">{label}</Label>
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="font-body"
    />
  </div>
);

const DynamicField = ({
  field,
  value,
  disabled,
  onChange,
}: {
  field: AgreementField;
  value: unknown;
  disabled?: boolean;
  onChange: (v: unknown) => void;
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
          <Select
            value={String(value ?? "")}
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
          >
            <SelectTrigger className="font-body">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-body">
                  {opt}
                </SelectItem>
              ))}
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
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
            className="flex flex-col gap-2 pt-1"
          >
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${field.key}-${opt}`} />
                <Label htmlFor={`${field.key}-${opt}`} className="font-body font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {helpNode}
        </div>
      );
    case "checkbox":
      return (
        <div className={wrapperClass}>
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id={`${field.key}-cb`}
              checked={!!value}
              onCheckedChange={(c) => onChange(!!c)}
              disabled={disabled}
            />
            <Label htmlFor={`${field.key}-cb`} className="font-body font-normal cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          </div>
          {helpNode}
        </div>
      );
    case "multiselect":
      return (
        <div className={wrapperClass}>
          {labelNode}
          <MultiSelectDropdown
            field={field}
            value={value}
            disabled={disabled}
            onChange={(v) => onChange(v)}
          />
          {helpNode}
        </div>
      );
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
                    id={`${field.key}-cbg-${opt}`}
                    checked={selected.includes(opt)}
                    onCheckedChange={() => toggle(opt)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`${field.key}-cbg-${opt}`}
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

const SignatureBlock = ({
  label,
  signature,
  signedAt,
  canSign,
  isYou,
  signatureInput,
  setSignatureInput,
  onSign,
  signing,
  detailsComplete,
  showWhenSelf,
}: {
  label: string;
  signature: string | null;
  signedAt: string | null;
  canSign: boolean;
  isYou: boolean;
  signatureInput: string;
  setSignatureInput: (v: string) => void;
  onSign: () => void;
  signing: boolean;
  detailsComplete: boolean;
  showWhenSelf: boolean;
}) => {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-body sora-semibold text-sm">{label}</p>
        {isYou && <Badge variant="secondary" className="font-body text-[10px]">You</Badge>}
      </div>

      {signature ? (
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <p className="font-body text-sm">
            <span className="sora-semibold italic">{signature}</span>
            <span className="text-muted-foreground"> — signed {fmt(signedAt)}</span>
          </p>
        </div>
      ) : showWhenSelf && canSign ? (
        <div className="space-y-2">
          <Label className="font-body text-xs text-muted-foreground">
            Type your full name to sign
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              value={signatureInput}
              onChange={(e) => setSignatureInput(e.target.value)}
              placeholder="Your full name"
              className="font-body flex-1 min-w-[200px]"
            />
            <Button onClick={onSign} disabled={signing || !detailsComplete} className="font-body">
              {signing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign agreement
            </Button>
          </div>
          {!detailsComplete && (
            <p className="font-body text-xs text-muted-foreground">
              Fill in meeting day, time, frequency and platform before signing.
            </p>
          )}
        </div>
      ) : (
        <p className="font-body text-sm text-muted-foreground italic">Awaiting signature</p>
      )}
    </div>
  );
};

export default Agreement;