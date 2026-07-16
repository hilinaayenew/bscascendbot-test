import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Star, StarOff, Trash2, ExternalLink, Search } from "lucide-react";
import { deleteProjectMedia } from "@/lib/projectMedia";

const AdminProjects = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const fetchAll = async () => {
    setBusy(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    const list = (data || []) as any[];
    if (list.length) {
      const ids = Array.from(new Set(list.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      list.forEach((r) => (r.submitter_name = map.get(r.user_id) || "Unknown"));
    }
    setRows(list);
    setBusy(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggle = async (id: string, patch: any) => {
    const { error } = await supabase.from("projects").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    fetchAll();
  };

  const remove = async (p: any) => {
    if (!confirm(`Delete "${p.title}" permanently?`)) return;
    const paths = [p.cover_image_url, p.pdf_url, ...(p.slide_urls || [])].filter(Boolean) as string[];
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await deleteProjectMedia(paths);
    toast.success("Project deleted.");
    fetchAll();
  };

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.submitter_name?.toLowerCase().includes(q) ||
      r.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, submitter, or tag..."
            className="pl-9 font-body"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="font-body">
          Refresh
        </Button>
      </div>

      {busy && <p className="font-body text-sm text-muted-foreground">Loading...</p>}
      {!busy && filtered.length === 0 && (
        <p className="font-body text-muted-foreground text-center py-8">No projects yet.</p>
      )}

      {filtered.map((p) => (
        <Card key={p.id} className="shadow-card">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-body font-semibold truncate">{p.title}</p>
                {p.is_featured && (
                  <Badge className="font-body text-xs">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                  </Badge>
                )}
                {p.is_hidden && (
                  <Badge variant="destructive" className="font-body text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">
                by {p.submitter_name} · {new Date(p.created_at).toLocaleDateString()}
              </p>
              {p.tagline && (
                <p className="font-body text-sm text-muted-foreground truncate mt-1">{p.tagline}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                <Link to={`/dashboard/projects/${p.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title={p.is_featured ? "Unfeature" : "Feature"}
                onClick={() => toggle(p.id, { is_featured: !p.is_featured })}
              >
                {p.is_featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title={p.is_hidden ? "Unhide" : "Hide"}
                onClick={() => toggle(p.id, { is_hidden: !p.is_hidden })}
              >
                {p.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => remove(p)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminProjects;