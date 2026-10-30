import { createProvenance, type Provenance } from "../core/provenance";
import { createWindows, rateAt, type TimelineWindow } from "../core/timeWindow";
import type { RateMetric } from "../shell/metrics";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";

/** One point of an activity curve: a rate at a moment. Between points the rate is a straight line. */
export interface ActivitySampleInput {
  readonly time: TimeInput;
  /** How many per unit of time, never negative. */
  readonly value: number;
}

/** Where a stretch of the curve comes from; stretches are sorted, do not overlap and lie inside the activity. */
export interface ActivitySourceInput {
  readonly start: TimeInput;
  readonly end: TimeInput;
  readonly provenance: Provenance;
}

/**
 * A period of activity on the timeline: a rate curve (the timeline glows brighter where the rate is higher) with an optional peak, and where each stretch of the curve comes from.
 * The id is unique among the scene's activities and is what a group's `{ kind: "rate" }` readout can name.
 */
export interface ActivityInput {
  readonly id: string;
  /** Name shown on the timeline and with the rate bar. */
  readonly label: string;
  /** What the rate counts, per unit of time, such as "events per hour". */
  readonly unit: string;
  /** The first and last moment of the activity. The curve's samples lie inside it, and the rate is unavailable outside it. */
  readonly start: TimeInput;
  readonly end: TimeInput;
  /** The moment of the peak, marked on the timeline; inside the activity. */
  readonly peak?: TimeInput;
  /** At least two points, sorted by time, one per moment. */
  readonly samples: readonly ActivitySampleInput[];
  /** Where each stretch of the curve comes from, shown with the activity. Absent: no source is stated. */
  readonly provenance?: readonly ActivitySourceInput[];
  /** A free word the timeline may group by, such as "meteor-shower". */
  readonly type?: string;
  /** Name of the peak mark on the rate bar; "Peak" when absent. */
  readonly peakLabel?: string;
}

/** A validated activity: the engine's window, and the peak the rate bar compares with. */
export interface PlannedActivity {
  readonly window: TimelineWindow;
  readonly peakValue: number;
  readonly peakLabel: string;
}

const bad = (id: unknown, message: string): SceneError => new SceneError("bad-activity", `addActivity("${String(id)}"): ${message}`);

const isText = (value: unknown): boolean => typeof value === "string" && value !== "";

/** Checks the plain fields and returns the id. */
function checkFields(input: ActivityInput): string {
  const id = input?.id;
  if (!isText(id)) throw bad(id, "the activity needs a non-empty id");
  if (!isText(input.label)) throw bad(id, "the activity needs a non-empty label");
  if (!isText(input.unit)) throw bad(id, "the activity needs a unit such as \"events per hour\"");
  if (!Array.isArray(input.samples) || input.samples.length < 2) throw bad(id, "the curve needs at least two samples");
  if (input.peakLabel !== undefined && !isText(input.peakLabel)) throw bad(id, "peakLabel must be a non-empty text");
  return id;
}

/** Checks an activity and builds its window; any fault is a `bad-activity` naming the activity. */
export function planActivity(input: ActivityInput): PlannedActivity {
  const id = checkFields(input);
  const moment = (time: TimeInput, what: string): number => toUtcMs(time, `addActivity("${id}") ${what}`);
  const samples = input.samples.map((sample, index) => ({ timeUtcMs: moment(sample?.time, `sample ${index} time`), value: sample?.value as number }));
  try {
    const peakUtcMs = input.peak === undefined ? undefined : moment(input.peak, "peak");
    const [window] = createWindows([{
      id,
      label: input.label,
      ...(input.type === undefined ? {} : { type: input.type }),
      startUtcMs: moment(input.start, "start"),
      endUtcMs: moment(input.end, "end"),
      ...(peakUtcMs === undefined ? {} : { peakUtcMs }),
      rate: { unit: input.unit, samples },
      ...(input.provenance === undefined ? {} : { provenance: input.provenance.map((span, index) => ({ startUtcMs: moment(span?.start, `provenance ${index} start`), endUtcMs: moment(span?.end, `provenance ${index} end`), provenance: createProvenance(span?.provenance) })) }),
    }]);
    const atPeak = peakUtcMs === undefined ? null : rateAt(window!, peakUtcMs);
    return { window: window!, peakValue: atPeak ?? Math.max(...samples.map((sample) => sample.value)), peakLabel: input.peakLabel ?? "Peak" };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw bad(id, error instanceof Error ? error.message : String(error));
  }
}

/** The live rate bar of an activity at a moment: the rate (unavailable outside the activity) against its peak. */
export function rateMetricOf(groupId: string, activity: PlannedActivity, timeUtcMs: number): RateMetric {
  const { window } = activity;
  return {
    kind: "rate",
    id: `${groupId}-rate`,
    label: "Activity rate",
    value: rateAt(window, timeUtcMs),
    unit: window.rate?.unit ?? "",
    digits: activity.peakValue >= 10 ? 0 : 1,
    context: window.label,
    unavailable: "outside the activity",
    peak: { label: activity.peakLabel, value: activity.peakValue },
  };
}
