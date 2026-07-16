import { useSignedProjectMedia } from "@/hooks/useSignedProjectMedia";
import { ImageIcon } from "lucide-react";

interface ProjectCoverImageProps {
  coverPath: string | null | undefined;
  title: string;
  className?: string;
}

const ProjectCoverImage = ({ coverPath, title, className }: ProjectCoverImageProps) => {
  const url = useSignedProjectMedia(coverPath);
  if (!coverPath) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-muted`}>
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }
  if (!url) return <div className={`${className ?? ""} bg-muted animate-pulse`} />;
  return <img src={url} alt={title} className={className} />;
};

export default ProjectCoverImage;