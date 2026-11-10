import type { LookRead } from "../../src/api/look";

/** The presentation part of a stand-in viewer reading (the scale, the looks and the switches), for tests that fake a `ViewerControl`. */
export const FAKE_LOOK: LookRead = { starBrightness: 1, milkyWay: false, milkyWayBrightness: 1, skyVisible: true, markerSwapRadiusPx: 3, featureMinBodyPx: 60, loadFadeSeconds: 0.6, desktopPictures: false, skyLines: { figure: "#8fb4ff", label: "#cfe0ff", boundary: "#5f7a9c", ecliptic: "#e0b25a", equator: "#7fd1b9", traced: "#ffd166", faded: "#44546d" }, labels: { fontFamily: "inherit", sizePx: 12 } };
export const FAKE_PRESENTATION = { scale: "true-scale", look: FAKE_LOOK, switches: {} } as const;

/** The presentation part of a stand-in `ViewerControl`. */
export const FAKE_PRESENTATION_CONTROL = { scales: ["true-scale", "readable-scale"], setScale: () => undefined, setLook: () => undefined, setSwitch: () => undefined, traceSkyFigure: () => undefined, clearSkyTrace: () => undefined, setSelected: () => undefined } as const;
