import type { LookRead } from "../../src/api/look";

/** The presentation part of a stand-in viewer reading (the scale, the looks and the switches), for tests that fake a `ViewerControl`. */
export const FAKE_LOOK: LookRead = { starBrightness: 1, milkyWay: false, milkyWayBrightness: 1, skyVisible: true, markerSwapRadiusPx: 3, featureMinBodyPx: 60, loadFadeSeconds: 0.6 };
export const FAKE_PRESENTATION = { scale: "true-scale", look: FAKE_LOOK, switches: {} } as const;

/** The presentation part of a stand-in `ViewerControl`. */
export const FAKE_PRESENTATION_CONTROL = { scales: ["true-scale", "readable-scale"], setScale: () => undefined, setLook: () => undefined, setSwitch: () => undefined } as const;
