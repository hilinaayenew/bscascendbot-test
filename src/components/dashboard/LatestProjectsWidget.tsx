import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import ProjectCoverImage from "@/components/projects/ProjectCoverImage";

interface Row {
  id: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  user_id: string;
  submitter_name?: string;
}

const LatestProjectsWidget = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, tagline, cover_image_url, user_id")
        .eq("is_hidden", false)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);
      const list = (data || []) as Row[];
      if (list.length) {
        const ids = Array.from(new Set(list.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
        list.forEach((r) => (r.submitter_name = map.get(r.user_id) || undefined));
      }
      setRows(list);
      setLoading(false);
    })();
  }, []);

  if (loading || rows.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Project Wall
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="font-body">
          <Link to="/dashboard/projects">
            View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rows.map((p) => (
            <Link key={p.id} to={`/dashboard/projects/${p.id}`} className="group block space-y-1.5">
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <ProjectCoverImage
                  coverPath={p.cover_image_url}
                  title={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="font-body text-sm font-medium line-clamp-1">{p.title}</p>
              {p.submitter_name && (
                <p className="font-body text-xs text-muted-foreground line-clamp-1">by {p.submitter_name}</p>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestProjectsWidget;