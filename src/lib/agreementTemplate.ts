/**
 * Agreement template loader + types.
 * The template is admin-editable and stored in the `agreement_template` singleton row.
 */
import { supabase } from "@/integrations/supabase/client";

export type AgreementFieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "multiselect"
  | "checkbox_group"
  | "date";

export interface AgreementField {
  key: string;
  label: string;
  type: AgreementFieldType;
  required: boolean;
  options: string[];
  helpText?: string;
}

export interface AgreementTermBlock {
  heading: string;
  body: string;
}

export interface AgreementTemplate {
  fields: AgreementField[];
  terms: AgreementTermBlock[];
}

export const DEFAULT_TEMPLATE: AgreementTemplate = {
  fields: [
    { key: "meeting_day", label: "Meeting day", type: "select", required: true, options: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] },
    { key: "meeting_time", label: "Meeting time", type: "text", required: true, options: [], helpText: "e.g. 18:00 (your local time)" },
    { key: "meeting_frequency", label: "Meeting frequency", type: "select", required: true, options: ["Weekly","Fortnightly","Monthly","Ad-hoc"] },
    { key: "meeting_platform", label: "Meeting platform", type: "select", required: true, options: ["Google Meet","Zoom","Microsoft Teams","WhatsApp","Phone call","Other"] },
    { key: "mentee_goals", label: "Mentee goals", type: "textarea", required: false, options: [], helpText: "What the mentee wants to achieve in this mentorship." },
    { key: "additional_notes", label: "Additional notes", type: "textarea", required: false, options: [], helpText: "Anything else the pair want recorded." },
  ],
  terms: [],
};

function normaliseField(raw: any): AgreementField | null {
  if (!raw || typeof raw !== "object") return null;
  const key = String(raw.key || "").trim();
  if (!key) return null;
  const type = (raw.type as AgreementFieldType) || "text";
  return {
    key,
    label: String(raw.label || key),
    type,
    required: !!raw.required,
    options: Array.isArray(raw.options) ? raw.options.map((o: any) => String(o)) : [],
    helpText: raw.helpText ? String(raw.helpText) : undefined,
  };
}

function normaliseTerm(raw: any): AgreementTermBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const heading = String(raw.heading || "").trim();
  const body = String(raw.body || "").trim();
  if (!heading && !body) return null;
  return { heading, body };
}

export async function loadAgreementTemplate(): Promise<AgreementTemplate> {
  const { data } = await supabase
    .from("agreement_template" as any)
    .select("fields, terms")
    .maybeSingle();
  const row = (data as unknown) as { fields: any[]; terms: any[] } | null;
  if (!row) return DEFAULT_TEMPLATE;
  const fields = (row.fields || []).map(normaliseField).filter((f): f is AgreementField => !!f);
  const terms = (row.terms || []).map(normaliseTerm).filter((t): t is AgreementTermBlock => !!t);
  return {
    fields: fields.length ? fields : DEFAULT_TEMPLATE.fields,
    terms,
  };
}

/**
 * Validate a form_responses object against the template's required fields.
 * Returns an array of missing field labels (empty = OK).
 */
export function getMissingRequired(
  template: AgreementTemplate,
  responses: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  for (const f of template.fields) {
    if (!f.required) continue;
    const v = responses?.[f.key];
    if (v === undefined || v === null) {
      missing.push(f.label);
      continue;
    }
    if (typeof v === "string" && v.trim() === "") missing.push(f.label);
    else if (Array.isArray(v) && v.length === 0) missing.push(f.label);
    else if (typeof v === "boolean" && v === false) missing.push(f.label);
  }
  return missing;
}

/**
 * Seed form_responses from legacy columns when the row was created before
 * the dynamic template existed. Only fills keys missing from responses.
 */
export function seedResponsesFromLegacy(
  responses: Record<string, unknown>,
  legacy: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...responses };
  for (const k of ["meeting_day", "meeting_time", "meeting_frequency", "meeting_platform", "mentee_goals", "additional_notes"]) {
    if ((out[k] === undefined || out[k] === null || out[k] === "") && legacy[k]) {
      out[k] = legacy[k];
    }
  }
  return out;
}