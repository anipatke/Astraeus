import type { DisplaySwitchItem } from "../shell/DisplaySwitches";
import type { OrbitLook } from "../assets/orbitLook";
import type { BodySetLook } from "./bodySet";

/** The display switches a story can place. Each one drives the same state as its Developer-drawer buttons, so the two never disagree. */
export const DISPLAY_SWITCH_IDS = ["orbitLines", "labels", "milkyWay"] as const;
export type DisplaySwitchId = (typeof DISPLAY_SWITCH_IDS)[number];

/** Where a switch shows: a button in the top bar, a row in the story switch panel opened from the bar, or only in the Developer drawer (where every switch stays). */
export const DISPLAY_SWITCH_PLACES = ["top-bar", "panel", "developer"] as const;
export type DisplaySwitchPlace = (typeof DISPLAY_SWITCH_PLACES)[number];

/** One switch's placement, and whether it starts on (absent: the scene's own start, which is on). */
export interface DisplaySwitchSetting {
  readonly place: DisplaySwitchPlace;
  readonly on?: boolean;
}
export type DisplaySwitchSettings = Readonly<Partial<Record<DisplaySwitchId, DisplaySwitchSetting>>>;

export const DISPLAY_SWITCH_LABELS: Readonly<Record<DisplaySwitchId, string>> = { orbitLines: "Orbit lines", labels: "Labels", milkyWay: "Milky Way" };

/** Orbit lines are on while the ring, the trailing arc or the moon orbits show: the Developer buttons for any of them keep the switch in step. */
export function orbitLinesOn(orbit: Pick<OrbitLook, "baseOn" | "arcOn"> | null, moonOrbitsOn: boolean | null): boolean {
  return (orbit !== null && (orbit.baseOn || orbit.arcOn)) || moonOrbitsOn === true;
}

/** Labels are on while anchor labels or any object's name shows. */
export function labelsOn(objectIds: readonly string[], hidden: ReadonlySet<string>, anchorLabels: boolean | null): boolean {
  return anchorLabels === true || objectIds.some((id) => !hidden.has(id));
}

/** The orbit-line state a start of `on` leaves; undefined: the scene's own start (on). */
export function orbitStart(setting: DisplaySwitchSetting | undefined): { readonly look: Pick<OrbitLook, "baseOn" | "arcOn">; readonly moonOrbitsOn: false } | undefined {
  return setting?.on === false ? { look: { baseOn: false, arcOn: false }, moonOrbitsOn: false } : undefined;
}

/** The pieces of live state the switches read and write; the setters write the scene's controls and the Developer drawer's state together. */
export interface SwitchBindings {
  readonly settings: DisplaySwitchSettings | undefined;
  readonly orbit: { readonly present: boolean; readonly look: Pick<OrbitLook, "baseOn" | "arcOn">; readonly set: (change: Partial<OrbitLook>) => void };
  readonly moons: { readonly present: boolean; readonly look: Pick<BodySetLook, "orbitsOn">; readonly set: (change: Partial<BodySetLook>) => void };
  readonly sky: { readonly present: boolean; readonly on: boolean; readonly set: (on: boolean) => void };
  readonly labels: { readonly objectIds: readonly string[]; readonly hidden: ReadonlySet<string>; readonly setHidden: (hidden: ReadonlySet<string>) => void; readonly anchorsPresent: boolean; readonly anchors: boolean; readonly setAnchors: (on: boolean) => void };
}

function setOrbitLines(bindings: SwitchBindings, on: boolean): void {
  if (bindings.orbit.present) bindings.orbit.set({ baseOn: on, arcOn: on });
  if (bindings.moons.present) bindings.moons.set({ orbitsOn: on });
}

function setLabels(bindings: SwitchBindings, on: boolean): void {
  const { labels } = bindings;
  labels.setHidden(on ? new Set() : new Set(labels.objectIds));
  if (labels.anchorsPresent) labels.setAnchors(on);
}

/** The switches to draw in the top bar and the switch panel: the placed ones the scene has something for, in the order orbit lines, labels, Milky Way. */
export function displaySwitchItems(bindings: SwitchBindings): readonly DisplaySwitchItem[] {
  const { settings } = bindings;
  if (settings === undefined) return [];
  const orbitOn = orbitLinesOn(bindings.orbit.present ? bindings.orbit.look : null, bindings.moons.present ? bindings.moons.look.orbitsOn : null);
  const labelsNow = labelsOn(bindings.labels.objectIds, bindings.labels.hidden, bindings.labels.anchorsPresent ? bindings.labels.anchors : null);
  const state: Record<DisplaySwitchId, { readonly applies: boolean; readonly on: boolean; readonly toggle: () => void }> = {
    orbitLines: { applies: bindings.orbit.present || bindings.moons.present, on: orbitOn, toggle: () => setOrbitLines(bindings, !orbitOn) },
    labels: { applies: bindings.labels.objectIds.length > 0 || bindings.labels.anchorsPresent, on: labelsNow, toggle: () => setLabels(bindings, !labelsNow) },
    milkyWay: { applies: bindings.sky.present, on: bindings.sky.on, toggle: () => bindings.sky.set(!bindings.sky.on) },
  };
  return DISPLAY_SWITCH_IDS.flatMap((id) => {
    const place = settings[id]?.place;
    if ((place !== "top-bar" && place !== "panel") || !state[id].applies) return [];
    return [{ id, label: DISPLAY_SWITCH_LABELS[id], place, on: state[id].on, onToggle: state[id].toggle }];
  });
}
