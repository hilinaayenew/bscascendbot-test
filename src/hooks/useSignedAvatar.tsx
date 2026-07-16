import { useEffect, useState } from "react";
import { resolveSignedAvatarUrl } from "@/lib/avatar";

/**
 * Resolves an avatar reference (storage path, full Supabase URL, or external URL)
 * into a short-lived URL safe to put on an <img> tag. Returns null while loading
 * or if there is no avatar.
 */
export function useSignedAvatar(avatarUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!avatarUrl) {
      setUrl(null);
      return;
    }
    resolveSignedAvatarUrl(avatarUrl).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);

  return url;
}