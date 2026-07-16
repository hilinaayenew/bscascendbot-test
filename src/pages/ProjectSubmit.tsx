import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, X, Upload, Loader2 } from "lucide-react";
import {
  MEDIA_LIMITS,
  deleteProjectMedia,
  toEmbedUrl,
  uploadProjectMedia,
  validateFile,
} from "@/lib/projectMedia";
import ProjectCoverImage from "@/components/projects/ProjectCoverImage";

const projectSchema = z.object({
  title: z.string().trim().min(3, "Title required").max(120),
  tagline: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(10000),
  external_url: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  video_embed_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !!toEmbedUrl(v), {
      message: "Must be a YouTube, Vimeo, or Loom URL",
    }),
});

const ProjectSubmit = () => {
  const { id } = useParams();
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const isMentee = roles.includes("mentee");

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [slidePaths, setSlidePaths] = useState<string[]>([]);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProject, setLoadingProject] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (!data) {
        toast.error("Project not found.");
        navigate("/dashboard/projects");
        return;
      }
      setTitle(data.title);
      setTagline(data.tagline || "");
      setDescription(data.description);
      setExternalUrl(data.external_url || "");
      setVideoUrl(data.video_embed_url || "");
      setTags(data.tags || []);
      setCoverPath(data.cover_image_url);
      setSlidePaths(data.slide_urls || []);
      setPdfPath(data.pdf_url);
      setLoadingProject(false);
    })();
  }, [id, isEdit, navigate]);

  if (loading || loadingProject)
    return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;
  if (!isMentee && !isEdit) {
    return (
      <DashboardLayout>
        <Card className="shadow-card max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center space-y-3">
            <p className="font-body">Only mentees can submit projects to the Project Wall.</p>
            <Button onClick={() => navigate("/dashboard/projects")} className="font-body">
              Back to wall
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.length >= 8) {
      toast.error("Up to 8 tags.");
      return;
    }
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, MEDIA_LIMITS.coverMB, "image");
    if (err) return toast.error(err);
    setUploading(true);
    try {
      if (coverPath) await deleteProjectMedia([coverPath]);
      const path = await uploadProjectMedia(user.id, file, "cover");
      setCoverPath(path);
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "unknown"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (slidePaths.length + files.length > MEDIA_LIMITS.maxSlides) {
      toast.error(`Max ${MEDIA_LIMITS.maxSlides} slide images.`);
      return;
    }
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const f of files) {
        const err = validateFile(f, MEDIA_LIMITS.slideMB, "image");
        if (err) {
          toast.error(`${f.name}: ${err}`);
          continue;
        }
        const p = await uploadProjectMedia(user.id, f, "slide");
        newPaths.push(p);
      }
      setSlidePaths((prev) => [...prev, ...newPaths]);
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "unknown"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeSlide = async (path: string) => {
    await deleteProjectMedia([path]);
    setSlidePaths((prev) => prev.filter((p) => p !== path));
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, MEDIA_LIMITS.pdfMB, "pdf");
    if (err) return toast.error(err);
    setUploading(true);
    try {
      if (pdfPath) await deleteProjectMedia([pdfPath]);
      const path = await uploadProjectMedia(user.id, file, "pdf");
      setPdfPath(path);
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "unknown"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    const parsed = projectSchema.safeParse({
      title,
      tagline,
      description,
      external_url: externalUrl,
      video_embed_url: videoUrl,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      tagline: tagline.trim() || null,
      description: description.trim(),
      external_url: externalUrl.trim() || null,
      video_embed_url: videoUrl.trim() || null,
      cover_image_url: coverPath,
      slide_urls: slidePaths,
      pdf_url: pdfPath,
      tags,
    };

    if (isEdit && id) {
      const { error } = await supabase.from("projects").update(payload).eq("id", id);
      if (error) {
        toast.error(error.message || "Failed to save.");
        setSaving(false);
        return;
      }
      toast.success("Project updated.");
      navigate(`/dashboard/projects/${id}`);
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
      if (error) {
        toast.error(error.message || "Failed to submit.");
        setSaving(false);
        return;
      }
      toast.success("Project submitted!");
      navigate(`/dashboard/projects/${data.id}`);
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")} className="font-body">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isEdit ? "Edit Project" : "Submit a Project"}
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            Share your work with the Ascendency community.
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-body text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className="font-body"
                placeholder="My awesome project"
              />
            </div>
            <div>
              <Label className="font-body">Tagline</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={200}
                className="font-body"
                placeholder="One-line pitch"
              />
            </div>
            <div>
              <Label className="font-body">Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={10000}
                rows={8}
                className="font-body"
                placeholder="What did you build? Why? What did you learn?"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                {description.length} / 10000
              </p>
            </div>
            <div>
              <Label className="font-body">External link</Label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="font-body"
                placeholder="https://your-project.com"
              />
            </div>
            <div>
              <Label className="font-body">Video URL (YouTube / Vimeo / Loom)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="font-body"
                placeholder="https://youtu.be/..."
              />
            </div>
            <div>
              <Label className="font-body">Tags (max 8)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="font-body"
                  placeholder="e.g. ai, design, mobile"
                />
                <Button type="button" variant="outline" onClick={addTag} className="font-body">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-body">
                      {t}
                      <button
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-body text-base">Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="font-body">Cover image (max {MEDIA_LIMITS.coverMB}MB)</Label>
              {coverPath && (
                <div className="mt-2 aspect-video w-full max-w-sm rounded-md overflow-hidden bg-muted">
                  <ProjectCoverImage coverPath={coverPath} title="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 mt-2 cursor-pointer rounded-md border border-border px-4 py-2 font-body text-sm hover:bg-muted">
                <Upload className="h-4 w-4" />
                {coverPath ? "Replace cover" : "Upload cover"}
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </label>
            </div>

            <div>
              <Label className="font-body">
                Slide images (up to {MEDIA_LIMITS.maxSlides}, max {MEDIA_LIMITS.slideMB}MB each)
              </Label>
              {slidePaths.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {slidePaths.map((p) => (
                    <div key={p} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                      <ProjectCoverImage coverPath={p} title="Slide" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeSlide(p)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex items-center gap-2 mt-2 cursor-pointer rounded-md border border-border px-4 py-2 font-body text-sm hover:bg-muted">
                <Upload className="h-4 w-4" /> Add slide images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleSlides} />
              </label>
            </div>

            <div>
              <Label className="font-body">Slide deck PDF (max {MEDIA_LIMITS.pdfMB}MB)</Label>
              {pdfPath && (
                <p className="font-body text-sm text-muted-foreground mt-2">
                  PDF uploaded
                  <button
                    onClick={async () => {
                      await deleteProjectMedia([pdfPath]);
                      setPdfPath(null);
                    }}
                    className="ml-2 text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </p>
              )}
              <label className="inline-flex items-center gap-2 mt-2 cursor-pointer rounded-md border border-border px-4 py-2 font-body text-sm hover:bg-muted">
                <Upload className="h-4 w-4" /> {pdfPath ? "Replace PDF" : "Upload PDF"}
                <input type="file" accept="application/pdf" className="hidden" onChange={handlePdf} />
              </label>
            </div>

            {uploading && (
              <p className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate("/dashboard/projects")} className="font-body">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || uploading} className="font-body">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Submit project"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectSubmit;