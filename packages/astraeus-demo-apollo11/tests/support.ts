// What the Apollo tests read: the rebuilt story through the public result (`toDefinition()`), never the demo's internals.
import type { StateResolver } from "astraeus/core/stateResolver";
import type { Metric } from "astraeus/shell/metrics";
import { apollo11Definition } from "../src/experiences/apollo11/apollo11Definition";

export { apollo11Definition };
export { APOLLO11_STATEMENT } from "../src/experiences/apollo11/apollo11Scene";
/** The experience part of the definition: objects, camera menu, events, window, rates, story panels. */
export const apollo11Experience = apollo11Definition.experience;
/** The two spacecraft paths, as the app draws them. */
export const spacecraft = apollo11Definition.trackedBodies!;
/** The scene's info-card rows for an object at a time, read through the resolver the app would give it. */
export const apolloMetrics = (resolver: StateResolver): ((objectId: string, timeUtcMs: number) => readonly Metric[]) =>
  apollo11Definition.createMetrics!({ resolver, clock: undefined as never, catalogue: undefined as never });

/** The story's parts as the older tests read them: the paths, the events and the timeline, all from the definition. */
export const apollo11Mission = {
  bodies: spacecraft,
  events: apollo11Experience.events,
  window: apollo11Experience.window,
  rates: apollo11Experience.rates,
};
