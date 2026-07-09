import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function resolveAvatarUrl(avatarUrl: string | null) {
  if (!avatarUrl) return null;

  // Handle full HTTP URLs
  if (avatarUrl.startsWith("http")) {
    // Convert Google Drive view links to direct image links
    if (avatarUrl.includes("drive.google.com")) {
      const fileIdMatch = avatarUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || avatarUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }
    return avatarUrl;
  }

  // Handle Supabase storage paths
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
}
