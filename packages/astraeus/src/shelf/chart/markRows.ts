// Part: the chart's mark-label row layout, one pure function. Labels keep their anchors (left half starts at the line, right half ends at it), are moved inside the chart, and drop to a further row when they would overlap.
export interface MarkLabel {
  /** The mark line's x, in chart units. */
  readonly x: number;
  /** The label's width, in chart units. */
  readonly width: number;
}
export interface MarkPlacement {
  /** 0 is nearest the plot. */
  readonly row: number;
  /** The label's left and right edges, in chart units. */
  readonly left: number;
  readonly right: number;
}

/** The space kept between two labels in one row, in chart units. */
export const LABEL_GAP = 4;

/** Places each label (results in input order): anchored, kept inside 0..chartWidth, then in the lowest row where it clears every box already there. A label wider than the chart stays clipped at the left edge. */
export function placeMarkRows(labels: readonly MarkLabel[], chartWidth: number): MarkPlacement[] {
  const boxes = labels.map((label) => {
    const start = label.x > chartWidth / 2 ? label.x - label.width : label.x;
    const left = Math.max(0, Math.min(start, chartWidth - label.width));
    return { left, right: left + label.width };
  });
  const rows: { left: number; right: number }[][] = [];
  const result: MarkPlacement[] = new Array<MarkPlacement>(labels.length);
  const order = labels.map((_, index) => index).sort((a, b) => labels[a].x - labels[b].x || a - b);
  for (const index of order) {
    const box = boxes[index];
    let row = rows.findIndex((placed) =>
      placed.every((other) => box.left >= other.right + LABEL_GAP || box.right <= other.left - LABEL_GAP),
    );
    if (row < 0) {
      row = rows.length;
      rows.push([]);
    }
    rows[row].push(box);
    result[index] = { row, ...box };
  }
  return result;
}
