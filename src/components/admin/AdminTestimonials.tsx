import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Row = {
  id: string;
  content: string;
  role: string;
  user_id: string;
  display_on_homepage: boolean;
  created_at: string;
  full_name?: string | null;
  email?: string | null;
};

const AdminTestimonials = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials" as any)
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data as any[]) || [];
    let enriched: Row[] = list as Row[];
    if (list.length > 0) {
      const ids = list.map((r) => r.user_id);
      const [profilesRes, contactsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
        supabase.rpc("admin_get_profile_contacts", { _user_ids: ids as any }),
      ]);
      const pMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const cMap = new Map(((contactsRes.data as any[]) || []).map((c: any) => [c.user_id, c]));
      enriched = list.map((r) => ({
        ...r,
        full_name: pMap.get(r.user_id)?.full_name || null,
        email: cMap.get(r.user_id)?.email || null,
      }));
    }
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleDisplay = async (id: string, next: boolean) => {
    const { error } = await supabase.from("testimonials" as any).update({ display_on_homepage: next }).eq("id", id);
    if (error) return toast.error("Update failed.");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, display_on_homepage: next } : r)));
    toast.success(next ? "Now showing on homepage." : "Hidden from homepage.");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials" as any).delete().eq("id", id);
    if (error) return toast.error("Delete failed.");
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Testimonial deleted.");
  };

  if (loading) return <p className="font-body text-muted-foreground py-8 text-center">Loading...</p>;
  if (rows.length === 0)
    return <p className="font-body text-muted-foreground py-8 text-center">No testimonials submitted yet.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="shadow-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body font-semibold">{r.full_name || "Unknown user"}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {r.email} · <Badge variant="secondary" className="font-body text-xs ml-1 capitalize">{r.role}</Badge>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Switch checked={r.display_on_homepage} onCheckedChange={(v) => toggleDisplay(r.id, v)} />
                  <span className="font-body text-xs text-muted-foreground">Homepage</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="font-body text-sm text-foreground/85 italic border-l-2 border-primary/30 pl-3">
              "{r.content}"
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Submitted {new Date(r.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminTestimonials;