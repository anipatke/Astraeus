import { SimulationClock } from "../core/clock";
import type { ExperienceDefinition } from "./experienceDefinition";

/**
 * The clock a mounted experience opens with: at its start moment and rate (or at the moment a copied link carried), playing unless the definition says
 * `clock.playing: false`, which leaves it frozen there.
 */
export function openClock(definition: Pick<ExperienceDefinition, "clock">, linkedTimeUtcMs?: number): SimulationClock {
  const clock = new SimulationClock(definition.clock.startUtcMs);
  clock.setRate(definition.clock.rate);
  if (linkedTimeUtcMs !== undefined) clock.seek(linkedTimeUtcMs);
  if (definition.clock.playing !== false) clock.play();
  return clock;
}
