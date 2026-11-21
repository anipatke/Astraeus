// O-080 T-335: the two lines of an example the catalogue page shows beside it, cut from the example's own text (so the shown lines are the run lines): its imports from "astraeus" and its `scene.addParts(...)` statement.

/** The example's `import ... from "astraeus"` lines. */
export function importLines(source: string): string {
  return source.split("\n").filter((line) => /^import\b.*\bfrom\s+"astraeus";?\s*$/.test(line)).join("\n");
}

/** The example's `scene.addParts(` statement, from its first line to the line that closes it at the same indent, left-aligned. Empty when there is none. */
export function addPartsStatement(source: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => /^\s*scene\.addParts\(/.test(line));
  if (start < 0) return "";
  const indent = /^\s*/.exec(lines[start]!)![0];
  const end = lines.findIndex((line, index) => index > start && line === `${indent}]);`);
  if (end < 0) return "";
  return lines.slice(start, end + 1).map((line) => line.slice(indent.length)).join("\n");
}
