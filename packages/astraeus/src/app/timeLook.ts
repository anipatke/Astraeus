// The zone and precision of the viewer's times: one look for every visitor-facing time (clock bar, slider text, bound dates, event list, event and window cards). It reaches them as a prop
// of the shell, with no address parameter, the way the label style does (T-316).
import { DEFAULT_TIME_LOOK, type TimeLook } from "../shell/timelineModel";

export { DEFAULT_TIME_LOOK };
export type { TimeLook };

/** The time look in force: the look's `time`, every part not named at its default. */
export function timeLookOf(look: { readonly time?: Partial<TimeLook> }): TimeLook {
  return { ...DEFAULT_TIME_LOOK, ...look.time };
}
