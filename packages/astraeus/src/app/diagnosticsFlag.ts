// The browser checks' opt-in: a page sets `globalThis.__ASTRAEUS_DIAGNOSTICS__ = true` before the viewer mounts to have the frame write its readouts onto the canvas.

/** Whether the page asked for the canvas readouts (read once per viewer, at frame-state creation). */
export function diagnosticsRequested(): boolean {
  return (globalThis as { __ASTRAEUS_DIAGNOSTICS__?: unknown }).__ASTRAEUS_DIAGNOSTICS__ === true;
}
