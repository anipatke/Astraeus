import type { AstronomyAdapter } from "./astronomyAdapter";
import type { CenterId } from "./body";
import type { Trajectory } from "./trajectory";
import { MOON_ROTATION } from "./bodies/moon";
import { iauOrientation } from "./iauRotation";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";

/** The Moon in its one native centre, Earth. Any other centre is the state resolver's composition, not this provider's. */
export class MoonTrajectory implements Trajectory {
  readonly body = "moon" as const;

  constructor(private readonly adapter: AstronomyAdapter) {}

  stateAt(timeUtcMs: number, center: CenterId = "earth"): State {
    assertUtcUnixMs(timeUtcMs);
    if (center !== "earth") throw new RangeError("Moon trajectory center must be Earth; the state resolver recentres it");
    const moonFromEarthKm = this.adapter.moonPositionKm(timeUtcMs);
    const orientation = iauOrientation(MOON_ROTATION, this.adapter.daysSinceJ2000Tt(timeUtcMs));
    return createState({
      body: "moon",
      center: "earth",
      timeUtcMs,
      frame: EQJ,
      positionKm: moonFromEarthKm,
      orientation,
    });
  }
}
