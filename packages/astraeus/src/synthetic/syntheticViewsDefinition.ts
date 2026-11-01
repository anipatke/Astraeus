// O-051 T-221: a made-up scene with views, built only through the public Scene API (ARCH-01: no real mission, name or data).
// Two invented probes circle Earth (a on a flat 40,000 km circle, one lap in 6 hours; b on a tilted 70,000 km circle, one lap in 9 hours). Earth is shared by every view.
// Three views, each with a different camera rule: "a" stays (the camera holds where it was), "b" follows probe b and "both" frames probe a (a focus: start with framing). The scene opens on view "a" following probe a.
// A rule applies only when the object the camera follows or focuses on is not in the view switched to, so here it is "a" (coming from b) and "b" (coming from a) that show it at work; "both" hides nothing and its rule is only resolved.
// A new scene rather than the synthetic journey gaining views: the journey is a historical probe through the real planets, and views need two simple paths, a shared body and distinct events and panels that
// no other check depends on (the journey's checks and its Object list stay exactly as they were).
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { Scene } from "../api/scene";
import { ViewerLink } from "../api/viewerLink";
import { earth } from "../api/bodies";
import { trueScale } from "../core/scalePolicy";

export const VIEWS_START_UTC_MS = Date.parse("2026-01-01T00:00:00Z");
const HOUR_MS = 3_600_000;
const SPAN_H = 24;
const madeUp = { sourceType: "illustrative", sources: ["Made up for the views test; not a real spacecraft"], accuracy: "None claimed.", notes: "A circle about Earth, not a real flight." } as const;

/** A circle about Earth in the plane tilted `tiltDeg` about x, one lap in `lapH` hours, a sample every 5 minutes over the whole timeline. */
function circle(radiusKm: number, lapH: number, tiltDeg: number) {
  const tilt = (tiltDeg * Math.PI) / 180;
  return Array.from({ length: SPAN_H * 12 + 1 }, (_, i) => {
    const angle = (2 * Math.PI * i) / (lapH * 12);
    const y = radiusKm * Math.sin(angle);
    return { time: VIEWS_START_UTC_MS + i * 300_000, positionKm: [radiusKm * Math.cos(angle), y * Math.cos(tilt), y * Math.sin(tilt)] };
  });
}

const panel = (id: string, title: string, hour: number) => ({ id, at: { utc: new Date(VIEWS_START_UTC_MS + hour * HOUR_MS).toISOString() }, title, body: ["A made-up line."], badge: "illustrative" as const, sources: ["Made up for the views test"] });

const scene = new Scene()
  .addBody(earth, { description: "The planet both made-up probes circle; shown in every view." })
  .addTrajectory({ id: "probe-a", label: "Probe A", samples: circle(40_000, 6, 0), provenance: madeUp, description: "A made-up probe on a flat circle.", knownLimitations: ["Made up; not a real spacecraft."] })
  .addTrajectory({ id: "probe-b", label: "Probe B", samples: circle(70_000, 9, 35), provenance: madeUp, description: "A made-up probe on a tilted circle.", knownLimitations: ["Made up; not a real spacecraft."] })
  .addEvents([
    { id: "event-a", label: "Probe A event", time: VIEWS_START_UTC_MS + 3 * HOUR_MS },
    { id: "event-b", label: "Probe B event", time: VIEWS_START_UTC_MS + 9 * HOUR_MS },
    { id: "event-shared", label: "Shared event", time: VIEWS_START_UTC_MS + 21 * HOUR_MS },
  ], { provenance: madeUp })
  .addStoryPanels({ panels: [panel("panel-a", "About probe A", 10), panel("panel-b", "About probe B", 15), panel("panel-shared", "About both", 20)] })
  .setViews([
    { id: "a", label: "Probe A", paths: ["probe-a"], events: ["event-a"], panels: ["panel-a"], camera: "stay" },
    { id: "b", label: "Probe B", paths: ["probe-b"], events: ["event-b"], panels: ["panel-b"], camera: { follow: "probe-b" } },
    { id: "both", label: "Both", paths: ["probe-a", "probe-b"], events: ["event-a", "event-b"], panels: ["panel-a", "panel-b"], camera: { focus: "probe-a" } },
  ], { place: "top-bar" })
  .setTimeline({ start: VIEWS_START_UTC_MS, end: VIEWS_START_UTC_MS + SPAN_H * HOUR_MS, rates: [60, 600, 3600], rate: 600 })
  .setScale(trueScale, { only: true })
  .setTime(VIEWS_START_UTC_MS);
scene.camera.follow("probe-a", { distance: 14 });

export const syntheticViewsDefinition: ExperienceDefinition = scene.toDefinition();

/** The host link a host page gets from `mount`, for the dev page: kept on `window.astraeusHost` so a browser check can call `setView` and read what the viewer tells a host. */
export function createViewsHost(): ViewerLink {
  const link = new ViewerLink();
  (window as unknown as { astraeusHost?: ViewerLink }).astraeusHost = link;
  return link;
}
