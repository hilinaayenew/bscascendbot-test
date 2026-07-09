import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle, XCircle, AlertCircle, FileText, Copy, Trash2 } from "lucide-react";
import { MENTOR_POOL_DATA, type MentorImportData } from "@/data/mentorPoolData";

interface ImportResult {
  email: string;
  status: "success" | "exists" | "error" | "skipped";
  reason?: string;
}

const AdminMentorImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [parsedMentors, setParsedMentors] = useState<MentorImportData[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseCSV = (text: string): MentorImportData[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    return dataRows
      .map((row) => {
        // Basic comma split (doesn't handle commas in quotes, but matches request for simple internal script)
        const values = row.split(",").map((v) => v.trim());
        const entry: any = {};

        headers.forEach((header, index) => {
          const val = values[index];
          // Prioritise the plain "email" column; treat "alternate email" (or any other
          // column whose header contains "email") as a fallback only.
          if (header === "email") {
            entry.email = val;
          } else if (header.includes("email") && !entry.email) {
            // alt / secondary email — only use if no primary email captured yet
            entry.email = val;
          } else if (header.includes("name")) entry.full_name = val;
          else if (header.includes("expertise")) entry.expertise = val ? val.split(";").map((s) => s.trim()) : [];
          else if (header.includes("linkedin")) entry.linkedin_url = val || null;
          else if (header.includes("phone")) entry.phone = val || null;
          else if (header.includes("country")) entry.country = val || null;
          else if (header.includes("avatar")) entry.avatar_url = val || null;
        });

        return entry as MentorImportData;
      })
      .filter((m) => m.email && m.full_name);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const mentors = parseCSV(text);
      if (mentors.length > 0) {
        // Deduplicate by email
        const seenEmails = new Set<string>();
        const uniqueMentors: MentorImportData[] = [];
        let duplicates = 0;

        mentors.forEach((m) => {
          if (seenEmails.has(m.email.toLowerCase())) {
            duplicates++;
          } else {
            seenEmails.add(m.email.toLowerCase());
            uniqueMentors.push(m);
          }
        });

        setParsedMentors(uniqueMentors);
        setDuplicateCount(duplicates);

        if (duplicates > 0) {
          toast.success(`Successfully parsed ${uniqueMentors.length} mentors. Removed ${duplicates} duplicates.`);
        } else {
          toast.success(`Successfully parsed ${uniqueMentors.length} mentors from ${file.name}`);
        }
      } else {
        toast.error("Could not parse any valid mentor data from the file.");
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileName(null);
    setParsedMentors([]);
    setDuplicateCount(0);
    setSummary(null);
    setResults([]);
  };

  const copyAsTS = () => {
    const dataToFormat = parsedMentors.length > 0 ? parsedMentors : MENTOR_POOL_DATA;

    // Custom formatting to match the user's style (unquoted keys)
    const formattedData = JSON.stringify(dataToFormat, null, 2).replace(/"([^"]+)":/g, "$1:"); // Remove quotes from keys

    const formatted = `export const MENTOR_POOL_DATA: MentorImportData[] = ${formattedData};`;
    navigator.clipboard.writeText(formatted);
    toast.success("TypeScript code copied to clipboard!");
  };

  const runImport = async () => {
    const mentorsToImport = parsedMentors.length > 0 ? parsedMentors : MENTOR_POOL_DATA;
    setImporting(true);
    setResults([]);
    setSummary(null);
    setProgress(0);

    try {
      // Send mentors in batches of 10 to avoid timeouts
      const batchSize = 10;
      const allResults: ImportResult[] = [];

      for (let i = 0; i < mentorsToImport.length; i += batchSize) {
        const batch = mentorsToImport.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke("import-mentors", {
          body: { mentors: batch },
        });

        if (error) {
          console.error("Batch error:", error);
          // Mark all in this batch as failed
          batch.forEach((m) => {
            allResults.push({ email: m.email, status: "error", reason: error.message });
          });
        } else if (data?.details) {
          allResults.push(...data.details);
        }

        setResults([...allResults]);
        setProgress(Math.min(100, Math.round(((i + batchSize) / mentorsToImport.length) * 100)));
      }

      const finalSummary = {
        total: mentorsToImport.length,
        success: allResults.filter((r) => r.status === "success").length,
        exists: allResults.filter((r) => r.status === "exists").length,
        errors: allResults.filter((r) => r.status === "error").length,
        skipped: allResults.filter((r) => r.status === "skipped").length,
      };
      setSummary(finalSummary);

      if (finalSummary.errors === 0) {
        toast.success(
          `Import complete! ${finalSummary.success} mentors invited, ${finalSummary.exists} already existed.`,
        );
      } else {
        toast.warning(`Import finished with ${finalSummary.errors} errors. Check the results below.`);
      }
    } catch (err: any) {
      toast.error("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import Mentor Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            You can either use the built-in mentor pool or upload a CSV file to import.
            {parsedMentors.length > 0 ? (
              <span>
                {" "}
                Ready to import <strong>{parsedMentors.length} mentors</strong> from <code>{fileName}</code>.
              </span>
            ) : (
              <span>
                {" "}
                This will use the default <strong>{MENTOR_POOL_DATA.length} mentors</strong> from the pool.
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="csv-upload"
              />
              <Button variant="outline" className="font-body">
                <FileText className="h-4 w-4 mr-2" />
                {fileName ? "Change CSV" : "Upload CSV"}
              </Button>
            </div>

            {fileName && (
              <Button variant="ghost" onClick={clearFile} className="text-destructive font-body">
                <Trash2 className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}

            {!importing && !summary && (
              <Button onClick={runImport} className="font-body">
                <Upload className="h-4 w-4 mr-2" />
                {parsedMentors.length > 0 ? "Import Uploaded CSV" : "Import Default Pool"}
              </Button>
            )}

            {(parsedMentors.length > 0 || !summary) && (
              <Button variant="secondary" onClick={copyAsTS} className="font-body">
                <Copy className="h-4 w-4 mr-2" /> Copy as TS Code
              </Button>
            )}

            {duplicateCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                <AlertCircle className="h-3 w-3 mr-1" /> {duplicateCount} duplicates removed
              </Badge>
            )}
          </div>

          {parsedMentors.length > 0 && !importing && !summary && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preview ({parsedMentors.length} records)
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-sm font-body">
                  <thead className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-4 py-2 border-b">Name</th>
                      <th className="px-4 py-2 border-b">Email</th>
                      <th className="px-4 py-2 border-b">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedMentors.map((m, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 border-b">{m.full_name}</td>
                        <td className="px-4 py-2 border-b">{m.email}</td>
                        <td className="px-4 py-2 border-b">{m.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-body text-sm">Importing mentors... {progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-md bg-green-50">
                <p className="font-display text-lg font-bold text-green-700">{summary.success}</p>
                <p className="font-body text-xs text-green-600">Invited</p>
              </div>
              <div className="text-center p-3 rounded-md bg-blue-50">
                <p className="font-display text-lg font-bold text-blue-700">{summary.exists}</p>
                <p className="font-body text-xs text-blue-600">Already exist</p>
              </div>
              <div className="text-center p-3 rounded-md bg-red-50">
                <p className="font-display text-lg font-bold text-red-700">{summary.errors}</p>
                <p className="font-body text-xs text-red-600">Errors</p>
              </div>
              <div className="text-center p-3 rounded-md bg-gray-50">
                <p className="font-display text-lg font-bold text-gray-700">{summary.skipped}</p>
                <p className="font-body text-xs text-gray-600">Skipped</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-body text-base">Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {r.status === "success" && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                  {r.status === "exists" && <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />}
                  {r.status === "error" && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                  {r.status === "skipped" && <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />}
                  <span className="font-body text-sm truncate">{r.email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={r.status === "success" ? "default" : r.status === "exists" ? "secondary" : "destructive"}
                  >
                    {r.status}
                  </Badge>
                  {r.reason && <span className="font-body text-xs text-muted-foreground">{r.reason}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMentorImport;
