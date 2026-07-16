import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartAvatarImage } from "@/components/SmartAvatarImage";
import { toast } from "sonner";
import { ExternalLink, ArrowLeft, Pencil, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toEmbedUrl, getProjectMediaUrl, deleteProjectMedia } from "@/lib/projectMedia";
import ProjectCoverImage from "@/components/projects/ProjectCoverImage";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [submitter, setSubmitter] = useState<any>(null);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true);
      const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (!data) {
        setBusy(false);
        return;
      }
      setProject(data);
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, bio")
        .eq("user_id", data.user_id)
        .maybeSingle();
      setSubmitter(prof);
      const [slides, pdf] = await Promise.all([
        Promise.all((data.slide_urls || []).map((p: string) => getProjectMediaUrl(p))),
        getProjectMediaUrl(data.pdf_url),
      ]);
      setSlideUrls(slides.filter(Boolean) as string[]);
      setPdfUrl(pdf);
      setBusy(false);
    })();
  }, [id]);

  const isOwner = user && project && project.user_id === user.id;
  const isAdmin = roles.includes("admin");
  const canEdit = isOwner || isAdmin;

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm("Delete this project permanently?")) return;
    const paths = [project.cover_image_url, project.pdf_url, ...(project.slide_urls || [])].filter(
      Boolean,
    ) as string[];
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      toast.error("Failed to delete project.");
      return;
    }
    await deleteProjectMedia(paths);
    toast.success("Project deleted.");
    navigate("/dashboard/projects");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const embedUrl = toEmbedUrl(project?.video_embed_url);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")} className="font-body">
            <ArrowLeft className="h-4 w-4 mr-1" /> Project Wall
          </Button>
          {canEdit && project && (
            <div className="flex gap-2">
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}
                  className="font-body"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete} className="font-body">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>

        {busy ? (
          <p className="font-body text-muted-foreground text-center py-12">Loading project...</p>
        ) : !project ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center font-body text-muted-foreground">
              Project not found.
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {project.is_featured && <Badge className="font-body text-xs">Featured</Badge>}
                {project.is_hidden && (
                  <Badge variant="destructive" className="font-body text-xs">
                    Hidden
                  </Badge>
                )}
                {project.tags?.map((t: string) => (
                  <Badge key={t} variant="secondary" className="font-body text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">{project.title}</h1>
              {project.tagline && (
                <p className="font-body text-lg text-muted-foreground mt-2">{project.tagline}</p>
              )}
            </div>

            {embedUrl ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted shadow-card">
                <iframe
                  src={embedUrl}
                  title={project.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : project.cover_image_url ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted shadow-card">
                <ProjectCoverImage
                  coverPath={project.cover_image_url}
                  title={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {slideUrls.length > 0 && (
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    <img
                      src={slideUrls[slideIdx]}
                      alt={`Slide ${slideIdx + 1}`}
                      className="w-full h-full object-contain"
                    />
                    {slideUrls.length > 1 && (
                      <>
                        <button
                          onClick={() => setSlideIdx((i) => (i === 0 ? slideUrls.length - 1 : i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                          aria-label="Previous slide"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSlideIdx((i) => (i === slideUrls.length - 1 ? 0 : i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                          aria-label="Next slide"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 font-body text-xs">
                          {slideIdx + 1} / {slideUrls.length}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-body text-sm hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" /> View slide deck (PDF)
              </a>
            )}

            <Card className="shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-semibold mb-3">About this project</h2>
                <p className="font-body text-foreground whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              {project.external_url && (
                <Button asChild className="font-body">
                  <a href={project.external_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View full project
                  </a>
                </Button>
              )}
            </div>

            {submitter && (
              <Card className="shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <SmartAvatarImage avatarUrl={submitter.avatar_url} />
                    <AvatarFallback>{submitter.full_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium truncate">Submitted by {submitter.full_name}</p>
                    {submitter.bio && (
                      <p className="font-body text-sm text-muted-foreground line-clamp-1">{submitter.bio}</p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="font-body">
                    <Link to={`/dashboard/profile/${submitter.user_id}`}>View profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;