import { jsPDF } from "jspdf";
import type { AgreementTemplate } from "./agreementTemplate";
import { DEFAULT_TEMPLATE } from "./agreementTemplate";
import { parseBodyBlocks } from "./agreementBody";

export interface AgreementPdfData {
  menteeName: string;
  mentorName: string;
  meeting_day?: string | null;
  meeting_time?: string | null;
  meeting_frequency?: string | null;
  meeting_platform?: string | null;
  mentee_goals?: string | null;
  additional_notes?: string | null;
  form_responses?: Record<string, unknown> | null;
  responses?: Record<string, unknown> | null;
  template?: AgreementTemplate;
  mentee_signature?: string | null;
  mentee_signed_at?: string | null;
  mentor_signature?: string | null;
  mentor_signed_at?: string | null;
  status: string;
  created_at?: string | null;
}

const PRIMARY = "#4B0A2D";
const TEXT = "#1f1f1f";
const MUTED = "#666666";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function buildAgreementPdf(data: AgreementPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeHeading = (text: string, size = 14) => {
    ensureSpace(size + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(PRIMARY);
    doc.text(text, margin, y);
    y += size + 6;
    doc.setTextColor(TEXT);
  };

  const writeBody = (text: string, opts: { italic?: boolean; muted?: boolean } = {}) => {
    doc.setFont("helvetica", opts.italic ? "italic" : "normal");
    doc.setFontSize(11);
    doc.setTextColor(opts.muted ? MUTED : TEXT);
    const blocks = parseBodyBlocks(text || "");
    if (blocks.length === 0) {
      const lines = doc.splitTextToSize("—", contentW);
      for (const line of lines) {
        ensureSpace(16);
        doc.text(line, margin, y);
        y += 14;
      }
      return;
    }
    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi];
      if (bi > 0) y += 4;
      if (block.kind === "p") {
        const lines = doc.splitTextToSize(block.lines.join(" "), contentW);
        for (const line of lines) {
          ensureSpace(16);
          doc.text(line, margin, y);
          y += 14;
        }
      } else {
        for (const item of block.items) {
          const wrap = doc.splitTextToSize(item, contentW - 14);
          for (let li = 0; li < wrap.length; li++) {
            ensureSpace(16);
            if (li === 0) doc.text("•", margin + 2, y);
            doc.text(wrap[li], margin + 14, y);
            y += 14;
          }
        }
      }
    }
  };

  const writeLabelValue = (label: string, value?: string | null) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(label.toUpperCase(), margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    const lines = doc.splitTextToSize(value && value.trim() ? value : "—", contentW);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 4;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY);
  doc.text("BSC Ascendency", margin, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(TEXT);
  doc.text("Mentorship Agreement", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(MUTED);
  doc.text(`${data.menteeName}  &  ${data.mentorName}`, margin, y);
  y += 14;
  doc.text(`Status: ${data.status.replace(/_/g, " ")}`, margin, y);
  y += 20;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  const template = data.template ?? DEFAULT_TEMPLATE;
  const responses: Record<string, unknown> = {
    ...((data.form_responses as Record<string, unknown>) || {}),
    ...((data.responses as Record<string, unknown>) || {}),
  };
  // Backfill from legacy flat columns when responses don't have the key
  for (const k of ["meeting_day","meeting_time","meeting_frequency","meeting_platform","mentee_goals","additional_notes"]) {
    if ((responses[k] === undefined || responses[k] === "" || responses[k] === null) && (data as any)[k]) {
      responses[k] = (data as any)[k];
    }
  }

  writeHeading("Agreement details");
  for (const field of template.fields) {
    const v = responses[field.key];
    let display: string;
    if (v === undefined || v === null || v === "") display = "—";
    else if (typeof v === "boolean") display = v ? "Yes" : "No";
    else if (Array.isArray(v)) display = v.join(", ");
    else display = String(v);
    writeLabelValue(field.label, display);
  }

  writeHeading("Standard terms");
  for (const term of template.terms) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    doc.text(term.heading, margin, y);
    y += 14;
    writeBody(term.body);
    y += 4;
  }

  ensureSpace(80);
  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  writeHeading("Signatures");

  writeLabelValue(
    "Mentee signature",
    data.mentee_signature
      ? `${data.mentee_signature} — signed ${fmtDate(data.mentee_signed_at)}`
      : "Not signed",
  );
  writeLabelValue(
    "Mentor signature",
    data.mentor_signature
      ? `${data.mentor_signature} — signed ${fmtDate(data.mentor_signed_at)}`
      : "Not signed",
  );

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(
      `Generated ${fmtDate(new Date().toISOString())}  ·  Page ${i} of ${pageCount}`,
      margin,
      pageH - 24,
    );
  }

  return doc;
}

export function downloadAgreementPdf(data: AgreementPdfData) {
  const doc = buildAgreementPdf(data);
  const safe = `${data.menteeName}-${data.mentorName}`.replace(/[^a-z0-9-]+/gi, "_");
  doc.save(`mentorship-agreement-${safe}.pdf`);
}