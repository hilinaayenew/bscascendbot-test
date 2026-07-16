import { Fragment } from "react";

/**
 * Parse a textarea body that may contain bullet lines (starting with `-`, `*`,
 * or `•`) into a mix of paragraphs and unordered lists. Blank lines separate
 * blocks. Used by both the signer view and the admin preview so admins can
 * format terms with bullet points straight from the template editor.
 */
type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] };

const BULLET_RE = /^\s*([-*•])\s+(.*)$/;

export function parseBodyBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", lines: para });
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.length) blocks.push({ kind: "ul", items: list });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    const m = line.match(BULLET_RE);
    if (m) {
      flushPara();
      if (!list) list = [];
      list.push(m[2]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function RenderBody({
  text,
  className = "text-muted-foreground mt-1",
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBodyBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className={className}>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          {b.kind === "p" ? (
            <p className={i > 0 ? "mt-2" : ""}>{b.lines.join(" ")}</p>
          ) : (
            <ul className={`list-disc pl-5 space-y-1 ${i > 0 ? "mt-2" : ""}`}>
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          )}
        </Fragment>
      ))}
    </div>
  );
}