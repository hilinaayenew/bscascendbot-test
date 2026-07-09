import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Convert popular video URLs (YouTube, Vimeo, Loom, Wistia) into an embeddable
 * iframe `src`. Returns null if the URL doesn't look embeddable.
 */
const toEmbedUrl = (raw: string): string | null => {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch" && url.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
      }
      if (url.pathname.startsWith("/embed/")) return raw;
      if (url.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${url.pathname.split("/")[2]}`;
      }
    }
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.replace(/^\//, "")}`;
    }

    // Vimeo
    if (host === "vimeo.com") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return raw;

    // Loom
    if (host === "loom.com" || host === "www.loom.com") {
      if (url.pathname.startsWith("/share/")) {
        return raw.replace("/share/", "/embed/");
      }
      if (url.pathname.startsWith("/embed/")) return raw;
    }

    // Wistia
    if (host.endsWith("wistia.com") || host.endsWith("wistia.net")) return raw;

    // Generic: allow embed if path contains '/embed/' or it's already an iframe-friendly URL
    if (url.pathname.includes("/embed/")) return raw;

    return null;
  } catch {
    return null;
  }
};

const VideoEmbed = ({ url }: { url: string }) => {
  const src = toEmbedUrl(url);
  if (!src) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline font-body text-sm"
      >
        {url}
      </a>
    );
  }
  return (
    <div className="my-4 aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
      <iframe
        src={src}
        title="Embedded video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
};

interface Props {
  content: string;
  className?: string;
}

/**
 * Renders course lesson content as Markdown with GitHub-flavoured extensions.
 *
 * Special syntax for embedding videos (YouTube, Vimeo, Loom, Wistia, or any
 * `/embed/` URL): use a markdown link with the literal text "video" or "embed".
 * Examples:
 *   [video](https://www.youtube.com/watch?v=abc123)
 *   [embed](https://vimeo.com/123456)
 *
 * Standard markdown also works: headings (#, ##, ###), **bold**, *italic*,
 * `code`, lists (- or 1.), [links](url), ![alt](image-url), > blockquotes,
 * tables, --- horizontal rules, and blank lines for spacing.
 */
const LessonContent = ({ content, className = "" }: Props) => {
  return (
    <div className={`font-body text-foreground/90 leading-relaxed space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-2xl font-bold text-foreground mt-6 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-xl font-bold text-foreground mt-5 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-lg sora-semibold text-foreground mt-4 mb-1.5">{children}</h3>
          ),
          p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1 text-sm marker:text-primary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1 text-sm marker:text-primary">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-3">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs font-mono my-3">{children}</pre>
          ),
          img: ({ src, alt }) => (
            <img
              src={src as string}
              alt={alt || ""}
              loading="lazy"
              className="my-4 max-w-full rounded-md border border-border"
            />
          ),
          a: ({ href, children }) => {
            const url = (href as string) || "";
            const label = Array.isArray(children)
              ? children.join("")
              : (children as string)?.toString?.() || "";
            const isVideoLink = /^(video|embed)$/i.test(label.trim());
            if (isVideoLink && url) return <VideoEmbed url={url} />;
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 bg-muted text-left sora-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LessonContent;