import { isPlanetId } from "../core/planetSeries";
import { mountedBodiesOf, sceneCenterOf, type ExperienceDefinition } from "./experienceDefinition";

/** Whether the experience mounts a planet (or is centred on one), so the planet series must be loaded before it runs. */
export function needsPlanetSeries(definition: ExperienceDefinition): boolean {
  return mountedBodiesOf(definition).some(isPlanetId) || isPlanetId(sceneCenterOf(definition));
}
