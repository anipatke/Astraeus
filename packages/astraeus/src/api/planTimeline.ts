import type { TimelineEvent } from "../core/events";
import type { TimeBounds } from "../core/trajectory";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";
import { pacingFor, timelineOf, type TimelineInput, type TimelineSetting } from "./story";

const DAY_MS = 86_400_000;

/** What a `Scene` has planned for its timeline: the opening time, the timeline setting, and from them the span, clock, rates and pacing. */
export class TimelinePlan {
  #timeUtcMs: number | undefined;
  /** The timeline the caller set, if any. */
  setting: TimelineSetting | undefined;

  setTime(time: TimeInput): void {
    this.#timeUtcMs = toUtcMs(time, "setTime");
  }

  setTimeline(timeline: TimelineInput): void {
    this.setting = timelineOf(timeline);
  }

  /** The speeds offered: the caller's, else 1 minute, 1 hour and 1 day per second. */
  rates(): readonly number[] {
    return this.setting?.rates ?? [60, 3_600, DAY_MS / 1000];
  }

  /** The timeline span and the moment the clock opens at; a moment outside a span the caller set is a `bad-timeline`. */
  span(tracked: readonly TimeBounds[]): { readonly window: TimeBounds; readonly startUtcMs: number } {
    const timeline = this.setting;
    const setTime = (timeline?.none === true ? timeline.atUtcMs : undefined) ?? this.#timeUtcMs;
    // With nothing setting a span or a moment, the month window is centred on now and the clock opens at now (not at the window's start).
    const now = setTime === undefined && timeline?.window === undefined && tracked.length === 0 ? Date.now() : undefined;
    const window = timeline?.window ?? windowOf(tracked, setTime ?? now);
    if (timeline?.window !== undefined && setTime !== undefined && (setTime < window.startUtcMs || setTime > window.endUtcMs)) {
      throw new SceneError("bad-timeline", `setTime ${new Date(setTime).toISOString()} is outside the timeline (${new Date(window.startUtcMs).toISOString()} to ${new Date(window.endUtcMs).toISOString()})`);
    }
    return { window, startUtcMs: setTime ?? now ?? window.startUtcMs };
  }

  /** The clock's opening: 60 times real time unless set; with no timeline and no rate, frozen. */
  clock(startUtcMs: number): ExperienceDefinition["clock"] {
    const timeline = this.setting;
    return { startUtcMs, rate: timeline?.rate ?? 60, ...(timeline?.none === true && timeline.rate === undefined ? { playing: false } : {}) };
  }

  /** The pacing the timeline asked for, laid over the scene's events; a rule naming an event type with no events throws `bad-timeline`. */
  pacing(events: readonly TimelineEvent[]): Pick<ExperienceDefinition, "pacing"> {
    const timeline = this.setting;
    const pacing = timeline === undefined ? undefined : pacingFor(timeline, events, timeline.rate ?? 60);
    return pacing === undefined ? {} : { pacing };
  }
}

/** The timeline span: the union of the trajectories' and activities' spans, else a month about the chosen time (or about now). */
function windowOf(tracked: readonly TimeBounds[], timeUtcMs: number | undefined): TimeBounds {
  if (tracked.length > 0) {
    const start = Math.min(...tracked.map((bounds) => bounds.startUtcMs));
    const end = Math.max(...tracked.map((bounds) => bounds.endUtcMs));
    if (timeUtcMs === undefined || (timeUtcMs >= start && timeUtcMs <= end)) return { startUtcMs: start, endUtcMs: end };
  }
  const centre = timeUtcMs ?? Date.now();
  return { startUtcMs: centre - 15 * DAY_MS, endUtcMs: centre + 15 * DAY_MS };
}
