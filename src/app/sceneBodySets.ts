// Readouts of the body sets on the canvas for the browser checks: members held and drawn, a few members' places on screen (so a check can
// point at a dot), the orbit colour per family, and whether a ball is wider than its dot.
import type { BodySetView } from "./BodySetView";
import { familyColorOf, type BodySetLook } from "./bodySet";
import type { OrbitSetView } from "./OrbitSetView";

/** Members sampled for `data-body-set-sample`: on screen, at least this far from every other sampled member, so a pointer finds only it. */
const SAMPLE_SEPARATION_PX = 30;
const SAMPLE_SIZE = 6;

/** Readouts are refreshed every this many frames (they are for checks, not for drawing). */
const PUBLISH_EVERY_FRAMES = 10;
const frames = new WeakMap<HTMLCanvasElement, number>();

export function publishBodySets(canvas: HTMLCanvasElement, views: readonly BodySetView[], orbits: readonly OrbitSetView[], look: BodySetLook): void {
  if (views.length === 0) return;
  const frame = (frames.get(canvas) ?? 0) + 1;
  frames.set(canvas, frame);
  if (frame % PUBLISH_EVERY_FRAMES !== 1) return;
  const data = canvas.dataset;
  data.bodySetMembers = String(views.reduce((sum, view) => sum + view.count, 0));
  data.bodySetDrawn = String(views.reduce((sum, view) => sum + (view.drawn ? view.count : 0), 0));
  const sample: { id: string; x: number; y: number; radiusPx: number }[] = [];
  let widest: { id: string; radiusPx: number } | null = null;
  for (const view of views) {
    view.screen.forEach((screen, index) => {
      if (!screen.visible) return;
      const id = view.layer.members[index].id;
      if (widest === null || screen.radiusPx > widest.radiusPx) widest = { id, radiusPx: screen.radiusPx };
      const crowded = view.screen.some((other, j) => j !== index && other.visible && Math.hypot(other.x - screen.x, other.y - screen.y) < SAMPLE_SEPARATION_PX);
      if (!crowded && sample.length < SAMPLE_SIZE) sample.push({ id, x: Math.round(screen.x), y: Math.round(screen.y), radiusPx: Number(screen.radiusPx.toFixed(3)) });
    });
  }
  data.bodySetSample = JSON.stringify(sample);
  data.bodySetWidest = widest === null ? "" : JSON.stringify(widest);
  data.bodySetDotPx = String(look.dotPx);
  data.bodySetOrbits = String(orbits.reduce((sum, view) => sum + (look.orbitsOn ? view.count : 0), 0));
  const colours: Record<string, string> = {};
  for (const view of views) for (const family of view.layer.families) colours[family.id] = familyColorOf(view.layer, look, family.id);
  data.bodySetFamilyColors = JSON.stringify(colours);
}
