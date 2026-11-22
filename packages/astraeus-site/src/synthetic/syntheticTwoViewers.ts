// O-092 T-427: two viewers of one made-up scene on one page, for the two-viewers browser step (dev page only, ARCH-01: no real mission, name or data).
// The scene uses every picture viewers drew from a shared copy before O-092: a halo (the Sun's glow), round dots (the dust belt), anchor marks (the marker's twelve anchors) and a body picture (Earth).
// The first viewer is the site's own; `addSecondViewer` is the site's `hostControl` seam: it mounts a second viewer below it, exposes its handle as `window.astraeusSecondHost`, and returns what removes it.
import { mount, type MountedScene, type Scene } from "astraeus";
import { dataSource as pictureData } from "astraeus-data";
import { BELT_START_UTC_MS, startSunScene } from "./syntheticBeltScene";

const MINUTE_MS = 60_000;
const SAMPLE_COUNT = 49;
const ORBIT_RADIUS_KM = 20_000;
const ANCHOR_COUNT = 12;

/** The Sun, Earth and the dust belt, plus an invented marker on a circle about Earth with anchors: halo, dots, anchors and a body picture in one scene. */
export function buildSyntheticTwoViewersScene(): Scene {
  const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const angle = (index / (SAMPLE_COUNT - 1)) * 2 * Math.PI;
    return {
      time: BELT_START_UTC_MS + index * 30 * MINUTE_MS,
      positionKm: [ORBIT_RADIUS_KM * Math.cos(angle), ORBIT_RADIUS_KM * Math.sin(angle), 0],
    };
  });
  return startSunScene(60).addTrajectory({
    id: "two-viewers-marker",
    label: "Marker",
    color: "#ffb347",
    center: "earth",
    samples,
    provenance: {
      sourceType: "illustrative",
      sources: ["Made up for the two-viewer browser check; not a real object"],
      accuracy: "None claimed. A circle about Earth invented for this fixture.",
      notes: "Exists so the scene has anchor marks beside the belt's dots, the Sun's halo and Earth's picture.",
    },
    description: "An invented object on a circle about Earth.",
    knownLimitations: ["Made up; not a real object."],
    anchors: Array.from({ length: ANCHOR_COUNT }, (_, index) => ({
      id: `two-viewers-mark-${index + 1}`,
      time: BELT_START_UTC_MS + (index + 1) * 90 * MINUTE_MS,
    })),
  });
}

/** Halves the first viewer's element, mounts a second viewer of the same made-up scene in a sibling below it and exposes its handle; returns what takes the second one down and gives the first its height back. */
export function addSecondViewer(host: HTMLElement): () => void {
  const previousHeight = host.style.height;
  host.style.height = "50%";
  const second = document.createElement("div");
  second.style.cssText = "position: relative; overflow: hidden; height: 50%; background: #000;";
  host.after(second);
  const handle: MountedScene = mount(second, buildSyntheticTwoViewersScene(), { data: [pictureData] });
  (window as unknown as { astraeusSecondHost?: MountedScene }).astraeusSecondHost = handle;
  return () => {
    handle.unmount();
    second.remove();
    host.style.height = previousHeight;
  };
}
