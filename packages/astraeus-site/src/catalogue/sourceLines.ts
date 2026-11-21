// O-080 T-335: the two lines of an example the catalogue page shows beside it, cut from the example's own text (so the shown lines are the run lines): its imports from "astraeus" and its `scene.addParts(...)` statement.

/** The example's `import ... from "astraeus"` lines. */
export function importLines(source: string): string {
  return source.split("\n").filter((line) => /^import\b.*\bfrom\s+"astraeus";?\s*$/.test(line)).join("\n");
}

/** The index just past the `)` that closes the `(` at `open`, skipping strings, template text and comments; -1 when it never closes. Layout-free: it reads brackets, not lines. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let at = open; at < text.length; at++) {
    const ch = text[at]!;
    if (ch === '"' || ch === "'" || ch === "`") {
      for (at++; at < text.length && text[at] !== ch; at++) if (text[at] === "\\") at++;
    } else if (ch === "/" && text[at + 1] === "/") {
      while (at < text.length && text[at] !== "\n") at++;
    } else if (ch === "/" && text[at + 1] === "*") {
      at = text.indexOf("*/", at + 2);
      if (at < 0) return -1;
      at++;
    } else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return at + 1;
  }
  return -1;
}

/** The example's `scene.addParts(` statement, from its first line to the `);` that closes its call (found by matching brackets, so any line layout works), left-aligned. Empty when there is none. */
export function addPartsStatement(source: string): string {
  const match = /^([ \t]*)scene\.addParts\(/m.exec(source);
  if (match === null) return "";
  const open = match.index + match[0].length - 1;
  const close = closingParen(source, open);
  if (close < 0 || source[close] !== ";") return "";
  const indent = match[1]!;
  return source
    .slice(match.index, close + 1)
    .split("\n")
    .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
    .join("\n");
}
