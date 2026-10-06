import type { AstronomyAdapter } from "./astronomyAdapter";
import type { CenterId } from "./body";
import type { Trajectory } from "./trajectory";
import { moonOrientationFromOrbit } from "./bodyOrientation";
import { composeCenteredPositions, earthStateAt } from "./referenceCenters";
import { assertUtcUnixMs, createCenteredPosition, createState, EQJ, type State } from "./state";

const ORIENTATION_SAMPLE_SECONDS = 1800;

export class MoonTrajectory implements Trajectory {
  readonly body = "moon" as const;

  constructor(private readonly adapter: AstronomyAdapter) {}

  stateAt(timeUtcMs: number, center: CenterId = "earth"): State {
    assertUtcUnixMs(timeUtcMs);
    if (center !== "earth" && center !== "sun") throw new RangeError("Moon trajectory center must be Earth or Sun");
    const moonFromEarthKm = this.adapter.moonPositionKm(timeUtcMs);
    const earlier = this.adapter.moonPositionKm(timeUtcMs - ORIENTATION_SAMPLE_SECONDS * 1000);
    const later = this.adapter.moonPositionKm(timeUtcMs + ORIENTATION_SAMPLE_SECONDS * 1000);
    const orientation = moonOrientationFromOrbit(moonFromEarthKm, earlier, later);
    const moonFromEarth = createState({
      body: "moon",
      center: "earth",
      timeUtcMs,
      frame: EQJ,
      positionKm: moonFromEarthKm,
      orientation,
    });
    if (center === "earth") return moonFromEarth;

    const earthFromSun = earthStateAt(this.adapter, timeUtcMs);
    return recenterMoon(moonFromEarth, createCenteredPosition({
      body: earthFromSun.body,
      center: earthFromSun.center,
      timeUtcMs,
      frame: earthFromSun.frame,
      positionKm: earthFromSun.positionKm,
    }));
  }
}

function recenterMoon(moonFromEarth: State, earthFromSun: ReturnType<typeof createCenteredPosition>): State {
  const composed = composeCenteredPositions(moonFromEarth, earthFromSun);
  return createState({
    body: "moon",
    center: "sun",
    timeUtcMs: composed.timeUtcMs,
    frame: EQJ,
    positionKm: composed.positionKm,
    orientation: moonFromEarth.orientation,
  });
}
