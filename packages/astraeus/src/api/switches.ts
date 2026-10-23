import { DISPLAY_SWITCH_IDS, DISPLAY_SWITCH_PLACES, type DisplaySwitchId, type DisplaySwitchPlace, type DisplaySwitchSettings } from "../app/displaySwitches";
import { SceneError } from "./errors";

/**
 * Where each display switch shows, and whether it starts on. `orbitLines` is the orbit ring, the trailing arc and the moon orbits as one switch; `labels` is body labels and
 * anchor labels; `milkyWay` is the sky picture. `place` is `"top-bar"` (a button in the bar), `"panel"` (a row in one switch panel opened from the bar) or `"developer"`
 * (only in the Developer drawer, where every switch stays). `on` is the starting state (default on).
 */
export type SwitchesInput = { readonly [id in DisplaySwitchId]?: { readonly place: DisplaySwitchPlace; readonly on?: boolean } };

/** Checks a `setSwitches` argument against the switch names and places; returns the settings laid over the ones already set. */
export function switchesOf(input: SwitchesInput, known: DisplaySwitchSettings = {}): DisplaySwitchSettings {
  const bad = (message: string) => new SceneError("bad-switch", `setSwitches: ${message}`);
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw bad(`give an object such as { orbitLines: { place: "top-bar" } } (switches: ${DISPLAY_SWITCH_IDS.join(", ")})`);
  const settings: Record<string, { place: DisplaySwitchPlace; on?: boolean }> = { ...known };
  for (const [id, setting] of Object.entries(input)) {
    if (!(DISPLAY_SWITCH_IDS as readonly string[]).includes(id)) throw bad(`"${id}" is not a switch (known: ${DISPLAY_SWITCH_IDS.join(", ")})`);
    if (typeof setting !== "object" || setting === null || !(DISPLAY_SWITCH_PLACES as readonly unknown[]).includes(setting.place)) throw bad(`${id}.place must be one of ${DISPLAY_SWITCH_PLACES.join(", ")}, got ${JSON.stringify((setting as { place?: unknown } | null)?.place)}`);
    if (setting.on !== undefined && typeof setting.on !== "boolean") throw bad(`${id}.on must be true or false, got ${JSON.stringify(setting.on)}`);
    settings[id] = { place: setting.place, ...(setting.on === undefined ? {} : { on: setting.on }) };
  }
  return settings;
}
