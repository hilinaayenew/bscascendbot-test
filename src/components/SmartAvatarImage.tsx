import * as React from "react";
import { AvatarImage } from "@/components/ui/avatar";
import { useSignedAvatar } from "@/hooks/useSignedAvatar";

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarImage>;

interface SmartAvatarImageProps extends Omit<AvatarImageProps, "src"> {
  avatarUrl?: string | null;
}

/**
 * Drop-in replacement for <AvatarImage> that resolves the avatar reference
 * (storage path or external URL) into a short-lived signed URL via the
 * `get-avatar` edge function. Renders nothing while loading so the
 * <AvatarFallback> stays visible.
 */
export const SmartAvatarImage = ({ avatarUrl, ...rest }: SmartAvatarImageProps) => {
  const url = useSignedAvatar(avatarUrl ?? null);
  if (!url) return null;
  return <AvatarImage src={url} {...rest} />;
};

/**
 * Same idea but for a plain <img> tag (used in carousels / cards that don't
 * use the Radix Avatar primitive).
 */
interface SmartImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  avatarUrl?: string | null;
}

export const SmartAvatarImg = ({ avatarUrl, ...rest }: SmartImgProps) => {
  const url = useSignedAvatar(avatarUrl ?? null);
  if (!url) return null;
  return <img src={url} {...rest} />;
};