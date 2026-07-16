/**
 * Admin view of all mentorship agreements.
 * Read-only: lists status, parties, signed dates; allows PDF export.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Eye, Loader2, FileSignature } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import {
  loadAgreementTemplate,
  seedResponsesFromLegacy,
  type AgreementTemplate,
} from "@/lib/agreementTemplate";

type Row = {
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
  menteeName?: string;
  mentorName?: string;
};

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const statusClass: Record<string, string> = {
  pending_details: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  pending_signatures: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  complete: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

const AdminAgreements = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Row | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data }, tmpl] = await Promise.all([
        supabase
          .from("agreements" as any)
          .select("*")
          .order("created_at", { ascending: false }),
        loadAgreementTemplate(),
      ]);
      setTemplate(tmpl);
      const list = ((data as unknown) as Row[]) || [];
      if (list.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const ids = Array.from(new Set(list.flatMap((r) => [r.mentor_id, r.mentee_id])));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name as string]));
      setRows(
        list.map((r) => ({
          ...r,
          menteeName: map.get(r.mentee_id) || "Unknown mentee",
          mentorName: map.get(r.mentor_id) || "Unknown mentor",
        })),
      );
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.menteeName, r.mentorName, r.status].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const handleDownload = (r: Row) => {
    downloadAgreementPdf({
      menteeName: r.menteeName || "Mentee",
      mentorName: r.mentorName || "Mentor",
      ...r,
      template: template || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Mentorship agreements
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            All agreements across active pairings. Read-only.
          </p>
        </div>
        <Input
          placeholder="Search by name or status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="font-body max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center font-body text-muted-foreground">
            No agreements yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-[200px]">
                  <p className="font-body sora-semibold">
                    {r.menteeName} <span className="text-muted-foreground">&amp;</span> {r.mentorName}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Mentee signed: {fmt(r.mentee_signed_at)} · Mentor signed: {fmt(r.mentor_signed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`font-body text-[10px] capitalize ${statusClass[r.status] ?? ""}`}>
                    {r.status.replace(/_/g, " ")}
                  </Badge>
                  <Button variant="outline" size="sm" className="font-body" onClick={() => setViewing(r)}>
                    <Eye className="h-3.5 w-3.5 mr-2" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body"
                    disabled={r.status !== "complete"}
                    onClick={() => handleDownload(r)}
                  >
                    <Download className="h-3.5 w-3.5 mr-2" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {viewing?.menteeName} &amp; {viewing?.mentorName}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-5 font-body text-sm">
              <div className="flex items-center gap-2">
                <Badge className={`font-body text-[10px] capitalize ${statusClass[viewing.status] ?? ""}`}>
                  {viewing.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">Created {fmt(viewing.created_at)}</span>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agreement details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  {(() => {
                    const merged = seedResponsesFromLegacy(
                      (viewing.form_responses as Record<string, unknown>) || {},
                      {
                        meeting_day: viewing.meeting_day || "",
                        meeting_time: viewing.meeting_time || "",
                        meeting_frequency: viewing.meeting_frequency || "",
                        meeting_platform: viewing.meeting_platform || "",
                        mentee_goals: viewing.mentee_goals || "",
                        additional_notes: viewing.additional_notes || "",
                      },
                    );
                    const fields = template?.fields ?? [];
                    if (fields.length === 0)
                      return (
                        <p className="col-span-2 text-muted-foreground">No template fields configured.</p>
                      );
                    return fields.map((f) => {
                      const v = merged[f.key];
                      const display =
                        v === undefined || v === null || v === ""
                          ? null
                          : typeof v === "boolean"
                          ? v ? "Yes" : "No"
                          : Array.isArray(v)
                          ? v.join(", ")
                          : String(v);
                      const full = f.type === "textarea";
                      return <Detail key={f.key} label={f.label} value={display} full={full} />;
                    });
                  })()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Standard terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(template?.terms ?? []).map((t) => (
                    <div key={t.heading}>
                      <p className="sora-semibold">{t.heading}</p>
                      <p className="text-muted-foreground text-xs mt-1">{t.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Signatures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="sora-semibold">Mentee:</span>{" "}
                    {viewing.mentee_signature ? (
                      <span className="italic">
                        {viewing.mentee_signature} — {fmt(viewing.mentee_signed_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not signed</span>
                    )}
                  </p>
                  <p>
                    <span className="sora-semibold">Mentor:</span>{" "}
                    {viewing.mentor_signature ? (
                      <span className="italic">
                        {viewing.mentor_signature} — {fmt(viewing.mentor_signed_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not signed</span>
                    )}
                  </p>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button onClick={() => handleDownload(viewing)} className="font-body">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({ label, value, full }: { label: string; value?: string | null; full?: boolean }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground sora-semibold">{label}</p>
    <p className="text-sm mt-0.5 whitespace-pre-wrap">{value && value.trim() ? value : "—"}</p>
  </div>
);

export default AdminAgreements;