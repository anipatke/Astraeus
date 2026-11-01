import { SimulationClock } from "../core/clock";
import { pacedRate, type ShownEvents } from "../core/pacing";
import type { ExperienceDefinition } from "./experienceDefinition";

/**
 * The clock a mounted experience opens with: at its start moment and rate (or at the moment a copied link carried), playing unless the definition says
 * `clock.playing: false`, which leaves it frozen there. `shown`: the opening view's events, whose zones alone pace it.
 */
export function openClock(definition: Pick<ExperienceDefinition, "clock" | "pacing">, linkedTimeUtcMs?: number, shown?: ShownEvents): SimulationClock {
  const clock = new SimulationClock(definition.clock.startUtcMs);
  clock.setRate(definition.clock.rate);
  if (linkedTimeUtcMs !== undefined) clock.seek(linkedTimeUtcMs);
  if (definition.pacing !== undefined) clock.setRate(pacedRate(definition.pacing, clock.now(), shown));
  if (definition.clock.playing !== false) clock.play();
  return clock;
}
