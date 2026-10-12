import type { AstronomyAdapter } from "./astronomyAdapter";
import type { CenterId } from "./body";
import type { Trajectory } from "./trajectory";
import { moonOrientationFromOrbit } from "./bodyOrientation";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";

const ORIENTATION_SAMPLE_SECONDS = 1800;

/** The Moon in its one native centre, Earth. Any other centre is the state resolver's composition, not this provider's. */
export class MoonTrajectory implements Trajectory {
  readonly body = "moon" as const;

  constructor(private readonly adapter: AstronomyAdapter) {}

  stateAt(timeUtcMs: number, center: CenterId = "earth"): State {
    assertUtcUnixMs(timeUtcMs);
    if (center !== "earth") throw new RangeError("Moon trajectory center must be Earth; the state resolver recentres it");
    const moonFromEarthKm = this.adapter.moonPositionKm(timeUtcMs);
    const earlier = this.adapter.moonPositionKm(timeUtcMs - ORIENTATION_SAMPLE_SECONDS * 1000);
    const later = this.adapter.moonPositionKm(timeUtcMs + ORIENTATION_SAMPLE_SECONDS * 1000);
    const orientation = moonOrientationFromOrbit(moonFromEarthKm, earlier, later);
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
