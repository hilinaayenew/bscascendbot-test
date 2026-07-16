import { supabase } from "@/integrations/supabase/client";

/**
 * Parse a YouTube / Vimeo / Loom URL into an embeddable iframe URL.
 * Returns null if the URL isn't a recognised video provider.
 */
export function toEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  }

  // Vimeo
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === "player.vimeo.com") return rawUrl;

  // Loom
  if (host === "loom.com" || host === "www.loom.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("share");
    const id = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
    return id ? `https://www.loom.com/embed/${id}` : null;
  }

  return null;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Get a signed URL for a file in the project-media bucket.
 * Cached for ~50 minutes.
 */
export async function getProjectMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;
  const { data, error } = await supabase.storage
    .from("project-media")
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 60 * 60 * 1000 });
  return data.signedUrl;
}

export async function getProjectMediaUrls(paths: (string | null | undefined)[]): Promise<string[]> {
  const results = await Promise.all(paths.map((p) => getProjectMediaUrl(p)));
  return results.filter((u): u is string => Boolean(u));
}

export async function uploadProjectMedia(
  userId: string,
  file: File,
  kind: "cover" | "slide" | "pdf",
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-media")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteProjectMedia(paths: string[]): Promise<void> {
  const valid = paths.filter(Boolean);
  if (valid.length === 0) return;
  await supabase.storage.from("project-media").remove(valid);
}

export const MEDIA_LIMITS = {
  coverMB: 5,
  slideMB: 5,
  pdfMB: 15,
  maxSlides: 20,
};

export function validateFile(file: File, maxMB: number, accept: "image" | "pdf"): string | null {
  if (file.size > maxMB * 1024 * 1024) return `File must be under ${maxMB}MB`;
  if (accept === "image" && !file.type.startsWith("image/")) return "Must be an image";
  if (accept === "pdf" && file.type !== "application/pdf") return "Must be a PDF";
  return null;
}