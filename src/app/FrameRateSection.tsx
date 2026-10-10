import { FRAME_BUDGET_MS, fpsTone, frameTone, type FrameSnapshot, type Tone } from "./frameStats";

export interface GroupFill {
  readonly id: string;
  count: number;
}

/** Developer tools section: how smoothly this browser is drawing the scene. Presentation only. */
const GRAPH_WIDTH = 300;
const GRAPH_HEIGHT = 110;
const PLOT = { left: 34, right: 292, top: 10, bottom: 86 } as const;
const GRID_STEP_FPS = 30;

/** Top of the vertical axis: a multiple of 30 fps, at least 60, so the line never leaves the plot. */
export function fpsAxisTop(history: readonly number[]): number {
  return Math.max(60, Math.ceil(Math.max(0, ...history) / GRID_STEP_FPS) * GRID_STEP_FPS);
}

/** Vertical position of an fps value inside the plot area. */
export function fpsY(fps: number, top: number): number {
  return PLOT.bottom - (fps / top) * (PLOT.bottom - PLOT.top);
}

/** Polyline points for the readings, oldest on the left, newest on the right. */
export function fpsGraphPoints(history: readonly number[], top = fpsAxisTop(history)): string {
  const step = history.length > 1 ? (PLOT.right - PLOT.left) / (history.length - 1) : 0;
  return history.map((fps, i) => `${(PLOT.left + i * step).toFixed(1)},${fpsY(fps, top).toFixed(1)}`).join(" ");
}

function FpsGraph({ history }: { readonly history: readonly number[] }) {
  const top = fpsAxisTop(history);
  const ticks: number[] = [];
  for (let fps = 0; fps <= top; fps += GRID_STEP_FPS) ticks.push(fps);
  const latest = history[history.length - 1];
  const segments = fpsGraphPoints(history, top).split(" ").map((point) => point.split(",").map(Number));
  return (
    <svg className="fps-graph" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} role="img" aria-label="Frames per second over the last 15 seconds" data-testid="fps-graph">
      <rect className="tone-good" x={PLOT.left} y={fpsY(top, top)} width={PLOT.right - PLOT.left} height={fpsY(50, top) - fpsY(top, top)} fillOpacity={0.1} />
      <rect className="tone-warn" x={PLOT.left} y={fpsY(50, top)} width={PLOT.right - PLOT.left} height={fpsY(30, top) - fpsY(50, top)} fillOpacity={0.1} />
      <rect className="tone-bad" x={PLOT.left} y={fpsY(30, top)} width={PLOT.right - PLOT.left} height={fpsY(0, top) - fpsY(30, top)} fillOpacity={0.1} />
      {ticks.map((fps) => (
        <g key={fps}>
          <line x1={PLOT.left} x2={PLOT.right} y1={fpsY(fps, top)} y2={fpsY(fps, top)} stroke="currentColor" strokeOpacity={fps === 0 ? 0.7 : 0.25} strokeWidth="0.6" />
          <text x={PLOT.left - 4} y={fpsY(fps, top) + 2.5} textAnchor="end" fontSize="7" fill="currentColor">{fps}</text>
        </g>
      ))}
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} stroke="currentColor" strokeOpacity={0.7} strokeWidth="0.6" />
      <text x={PLOT.left} y={PLOT.top - 3} fontSize="7" fill="currentColor">frames per second</text>
      {segments.slice(1).map((end, i) => (
        <line key={i} className={`tone-${fpsTone(history[i + 1])}`} x1={segments[i][0]} y1={segments[i][1]} x2={end[0]} y2={end[1]} strokeWidth="1.6" strokeLinecap="round" stroke="currentColor" />
      ))}
      <circle className={`tone-${fpsTone(latest)}`} cx={PLOT.right} cy={fpsY(latest, top)} r="2.4" fill="currentColor" />
      <text x={PLOT.left} y={PLOT.bottom + 11} fontSize="7" fill="currentColor">{Math.round((history.length - 1) / 4)} s ago</text>
      <text className={`tone-${fpsTone(latest)}`} x={PLOT.right} y={PLOT.bottom + 11} fontSize="7" textAnchor="end" fill="currentColor">now ({latest.toFixed(0)} fps)</text>
      <text x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 22} fontSize="7" textAnchor="middle" fill="currentColor">time, one reading every quarter second</text>
    </svg>
  );
}

function overTone(frames: FrameSnapshot): Tone {
  return frames.overBudget === 0 ? "good" : frames.overBudget * 10 <= frames.frames ? "warn" : "bad";
}

export function FrameRateSection({ frames, fills, fpsHistory = [] }: { readonly frames: FrameSnapshot | null; readonly fills: readonly GroupFill[]; readonly fpsHistory?: readonly number[] }) {
  return (
    <section className="hud-section" aria-labelledby="developer-frame-rate-heading" data-testid="frame-rate">
      <h3 id="developer-frame-rate-heading">Frame rate</h3>
      {frames === null || frames.frames === 0 ? <p>Measuring…</p> : (
        <dl className="frame-readouts" aria-label="Frame timing">
          <div><dt>Frames per second</dt><dd data-frame-fps className={`tone-${fpsTone(frames.fps)}`}>{frames.fps.toFixed(1)}</dd></div>
          <div><dt>Longest recent frame</dt><dd data-frame-longest className={`tone-${frameTone(frames.longestMs)}`}>{frames.longestMs.toFixed(1)} ms</dd></div>
          <div><dt>Frames over {FRAME_BUDGET_MS} ms</dt><dd data-frame-over className={`tone-${overTone(frames)}`}>{frames.overBudget} of {frames.frames}</dd></div>
          {fills.map((fill) => <div key={fill.id}><dt>Position fills: {fill.id}</dt><dd data-fill-count={fill.id}>{fill.count}</dd></div>)}
        </dl>
      )}
      {fpsHistory.length > 1 && <FpsGraph history={fpsHistory} />}
      {fpsHistory.length > 1 && (
        <p className="fps-graph-key"><span className="tone-good">● smooth, 50+</span><span className="tone-warn">● uneven, 30–50</span><span className="tone-bad">● rough, under 30</span></p>
      )}
      <p>These figures are for this browser and machine, measured over the last second or so.</p>
    </section>
  );
}
