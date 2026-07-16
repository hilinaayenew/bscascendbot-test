import { supabase } from "@/integrations/supabase/client";

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();
const SIGN_TTL_MS = 55 * 60 * 1000; // 55 min, edge function signs for 60

/**
 * Resolve a stored avatar value into something <img> can render.
 * - External URLs (incl. Google Drive) are passed through (with Drive normalization).
 * - Supabase storage paths/URLs are fetched via the `get-avatar` edge function
 *   which returns a short-lived signed URL.
 * Results are cached in-memory by storage path.
 */
export async function resolveSignedAvatarUrl(
  avatarUrl: string | null | undefined,
): Promise<string | null> {
  if (!avatarUrl) return null;
  const ref = parseAvatarRef(avatarUrl);
  if (!ref) return null;
  if (ref.type === "external") return ref.url;

  const path = ref.path;
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase.functions.invoke("get-avatar", {
      body: { path },
    });
    if (error || !data?.signedUrl) return null;
    const url = data.signedUrl as string;
    cache.set(path, { url, expiresAt: Date.now() + SIGN_TTL_MS });
    return url;
  })();
  inflight.set(path, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(path);
  }
}

type AvatarRef =
  | { type: "external"; url: string }
  | { type: "storage"; path: string };

function parseAvatarRef(raw: string): AvatarRef | null {
  const s = raw.trim();
  if (!s) return null;

  if (s.startsWith("http")) {
    // Convert Google Drive view links to direct image links
    if (s.includes("drive.google.com")) {
      const idMatch = s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return { type: "external", url: `https://drive.google.com/uc?export=view&id=${idMatch[1]}` };
      }
    }
    // Detect Supabase storage URLs (public, sign, or authenticated paths).
    const m = s.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/avatars\/([^?]+)/);
    if (m) return { type: "storage", path: decodeURIComponent(m[1]) };
    return { type: "external", url: s };
  }

  // Bare storage path stored in the DB.
  return { type: "storage", path: s.replace(/^\/+/, "").replace(/^avatars\//, "") };
}