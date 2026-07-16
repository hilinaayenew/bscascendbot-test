import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartAvatarImage } from "@/components/SmartAvatarImage";
import { Plus, Search, Star, Sparkles, ExternalLink, Play } from "lucide-react";
import ProjectCoverImage from "@/components/projects/ProjectCoverImage";

interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  video_embed_url: string | null;
  external_url: string | null;
  tags: string[];
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
  submitter?: { full_name: string | null; avatar_url: string | null; username: string | null };
}

const Projects = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const isMentee = roles.includes("mentee");

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      setBusy(true);
      const { data } = await supabase
        .from("projects")
        .select("id, user_id, title, tagline, cover_image_url, video_embed_url, external_url, tags, is_featured, is_hidden, created_at")
        .order("is_featured", { ascending: false })
        .order("featured_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      const rows = (data || []) as ProjectRow[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, username")
          .in("user_id", userIds);
        const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        rows.forEach((r) => (r.submitter = map.get(r.user_id) as any));
      }
      setProjects(rows);
      setBusy(false);
    };
    fetchProjects();
  }, [user]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (p.is_hidden && p.user_id !== user?.id && !roles.includes("admin")) return false;
      if (tag && !p.tags?.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.tagline || "").toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, query, tag, user, roles]);

  const featured = filtered.filter((p) => p.is_featured);
  const rest = filtered.filter((p) => !p.is_featured);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Project Wall</h1>
            <p className="font-body text-muted-foreground mt-1">
              A showcase of work by mentees on Ascendency. Explore, get inspired, and share your own.
            </p>
          </div>
          {isMentee && (
            <Button onClick={() => navigate("/dashboard/projects/new")} className="font-body">
              <Plus className="h-4 w-4 mr-2" /> Submit Project
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 font-body"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                variant={tag === null ? "default" : "outline"}
                onClick={() => setTag(null)}
                className="cursor-pointer font-body"
              >
                All
              </Badge>
              {allTags.slice(0, 12).map((t) => (
                <Badge
                  key={t}
                  variant={tag === t ? "default" : "outline"}
                  onClick={() => setTag(tag === t ? null : t)}
                  className="cursor-pointer font-body"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {busy ? (
          <p className="font-body text-muted-foreground text-center py-12">Loading projects...</p>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center space-y-3">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="font-body text-muted-foreground">No projects yet.</p>
              {isMentee && (
                <Button onClick={() => navigate("/dashboard/projects/new")} className="font-body">
                  <Plus className="h-4 w-4 mr-2" /> Be the first to submit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary" /> Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featured.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section className="space-y-3">
                {featured.length > 0 && <h2 className="font-display text-lg font-semibold">All Projects</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const ProjectCard = ({ project }: { project: ProjectRow }) => {
  return (
    <Link
      to={`/dashboard/projects/${project.id}`}
      className="group block"
    >
      <Card className="shadow-card hover:shadow-elevated transition-shadow overflow-hidden h-full flex flex-col">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <ProjectCoverImage
            coverPath={project.cover_image_url}
            title={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {project.video_embed_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
              <div className="h-12 w-12 rounded-full bg-background/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}
          {project.is_featured && (
            <Badge className="absolute top-2 left-2 font-body text-xs">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </Badge>
          )}
          {project.is_hidden && (
            <Badge variant="destructive" className="absolute top-2 right-2 font-body text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
          <h3 className="font-display font-semibold text-base line-clamp-1">{project.title}</h3>
          {project.tagline && (
            <p className="font-body text-sm text-muted-foreground line-clamp-2">{project.tagline}</p>
          )}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <Avatar className="h-6 w-6">
              <SmartAvatarImage avatarUrl={project.submitter?.avatar_url ?? null} />
              <AvatarFallback className="text-[10px]">
                {project.submitter?.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-body text-xs text-muted-foreground truncate">
              {project.submitter?.full_name || "Unknown"}
            </span>
            {project.external_url && (
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            )}
          </div>
          {project.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="font-body text-[10px] px-1.5 py-0">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default Projects;