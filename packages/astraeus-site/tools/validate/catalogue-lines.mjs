// The catalogue journey's "shown code is run code" comparison (O-080 I-188), kept out of the journey so a fast test proves it without a browser.
// The Add box shows the `scene.addParts` statement left-aligned (src/catalogue/sourceLines.ts); the whole example shows it at its indent. So the two are compared line by line with each
// line's leading space removed: the add lines must be a run of consecutive lines of the code, word for word otherwise.

/** Whether `code` holds the lines of `addLines` one after another, each line compared without its leading space. False for empty add lines. */
export function holdsAddLines(code, addLines) {
  const strip = (text) => text.split("\n").map((line) => line.trimStart());
  const want = strip(addLines.trim());
  const lines = strip(code);
  if (want.length === 0 || want[0] === "") return false;
  return lines.some((_, start) => want.every((line, offset) => lines[start + offset] === line));
}
