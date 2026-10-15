// Turns plain text typed in the dashboard into simple page blocks.

export type Block = { kind: "heading"; text: string } | { kind: "list"; items: string[] } | { kind: "paragraph"; text: string };

/** Very small formatter: "## " starts a heading, "- " starts a bullet, blank lines separate paragraphs. */
export function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    // Drop lines like "Email:" whose value is empty.
    const lines = chunk
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.trim() && !/^[A-Za-z]+:\s*$/.test(l.trim()));
    if (!lines.length) continue;
    let rest = lines;
    if (rest[0].startsWith("## ")) {
      blocks.push({ kind: "heading", text: rest[0].slice(3).trim() });
      rest = rest.slice(1);
    }
    if (!rest.length) continue;
    if (rest.every((l) => /^\s*[-•]\s+/.test(l))) {
      blocks.push({ kind: "list", items: rest.map((l) => l.replace(/^\s*[-•]\s+/, "")) });
    } else {
      blocks.push({ kind: "paragraph", text: rest.join("\n") });
    }
  }
  return blocks;
}
