import { assertCenterId, type BodyId, type CenterId } from "./body";
import { createProvenance, type Provenance } from "./provenance";
import { assertUtcUnixMs, createState, EQJ, type FrameId, type State } from "./state";
import type { TimeBounds, Trajectory } from "./trajectory";

export interface TrajectorySample {
  readonly timeUtcMs: number;
  readonly positionKm: ArrayLike<number>;
  readonly velocityKmS?: ArrayLike<number>;
}

export interface SampledTrajectoryInput {
  readonly body: BodyId;
  readonly center: CenterId;
  readonly frame?: FrameId;
  readonly samples: readonly TrajectorySample[];
  readonly provenance?: Provenance;
}

export class TrajectoryOutOfRangeError extends RangeError {
  constructor(timeUtcMs: number, bounds: TimeBounds) {
    super(`time ${timeUtcMs} is outside the trajectory bounds [${bounds.startUtcMs}, ${bounds.endUtcMs}]`);
    this.name = "TrajectoryOutOfRangeError";
  }
}

function finiteVector(value: ArrayLike<number>, label: string): Float64Array {
  if (value.length !== 3) throw new TypeError(`${label} must contain exactly three coordinates`);
  const copy = Float64Array.from(value);
  if (copy.some((component) => !Number.isFinite(component))) throw new TypeError(`${label} must be finite`);
  return copy;
}

/** A bounded trajectory of discrete samples: cubic Hermite with velocity, linear without. */
export class SampledTrajectory implements Trajectory {
  readonly body: BodyId;
  readonly bounds: TimeBounds;
  readonly provenance?: Provenance;
  readonly #center: CenterId;
  readonly #times: Float64Array;
  readonly #positions: Float64Array[];
  readonly #velocities: Float64Array[] | null;

  constructor(input: SampledTrajectoryInput) {
    if (input.body.length === 0) throw new TypeError("body id must be non-empty");
    assertCenterId(input.center);
    if ((input.frame ?? EQJ) !== EQJ) throw new RangeError("sampled trajectories use the EQJ frame only");
    const { samples } = input;
    if (samples.length < 2) throw new RangeError("a sampled trajectory needs at least two samples");
    const withVelocity = samples.filter((sample) => sample.velocityKmS !== undefined).length;
    if (withVelocity !== 0 && withVelocity !== samples.length) {
      throw new TypeError("velocity must be present on every sample or on none");
    }
    this.body = input.body;
    this.#center = input.center;
    this.#times = new Float64Array(samples.length);
    this.#positions = [];
    const velocities: Float64Array[] = [];
    samples.forEach((sample, index) => {
      assertUtcUnixMs(sample.timeUtcMs);
      if (index > 0 && sample.timeUtcMs <= this.#times[index - 1]) {
        throw new RangeError("sample times must be strictly increasing");
      }
      this.#times[index] = sample.timeUtcMs;
      this.#positions.push(finiteVector(sample.positionKm, "positionKm"));
      if (sample.velocityKmS !== undefined) velocities.push(finiteVector(sample.velocityKmS, "velocityKmS"));
    });
    this.#velocities = withVelocity === 0 ? null : velocities;
    this.bounds = Object.freeze({ startUtcMs: this.#times[0], endUtcMs: this.#times[samples.length - 1] });
    if (input.provenance !== undefined) this.provenance = createProvenance(input.provenance);
  }

  stateAt(timeUtcMs: number, center: CenterId = this.#center): State {
    assertUtcUnixMs(timeUtcMs);
    if (center !== this.#center) {
      throw new RangeError(`sampled trajectory holds center "${this.#center}", not "${center}"`);
    }
    if (timeUtcMs < this.bounds.startUtcMs || timeUtcMs > this.bounds.endUtcMs) {
      throw new TrajectoryOutOfRangeError(timeUtcMs, this.bounds);
    }
    const upper = this.#upperIndex(timeUtcMs);
    const lower = this.#times[upper] === timeUtcMs ? upper : upper - 1;
    const { position, velocity } = lower === upper
      ? { position: this.#positions[lower], velocity: this.#velocities?.[lower] }
      : this.#interpolate(lower, timeUtcMs);
    return createState({
      body: this.body,
      center: this.#center,
      timeUtcMs,
      frame: EQJ,
      positionKm: position,
      ...(velocity === undefined ? {} : { velocityKmS: velocity }),
      orientation: null,
    });
  }

  /** Index of the first sample whose time is >= timeUtcMs. */
  #upperIndex(timeUtcMs: number): number {
    let low = 0;
    let high = this.#times.length - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (this.#times[middle] < timeUtcMs) low = middle + 1;
      else high = middle;
    }
    return low;
  }

  #interpolate(lower: number, timeUtcMs: number): { position: Float64Array; velocity?: Float64Array } {
    const t0 = this.#times[lower];
    const spanS = (this.#times[lower + 1] - t0) / 1000;
    const u = (timeUtcMs - t0) / 1000 / spanS;
    const p0 = this.#positions[lower];
    const p1 = this.#positions[lower + 1];
    const position = new Float64Array(3);
    if (this.#velocities === null) {
      for (let i = 0; i < 3; i += 1) position[i] = p0[i] + (p1[i] - p0[i]) * u;
      return { position };
    }
    const v0 = this.#velocities[lower];
    const v1 = this.#velocities[lower + 1];
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    const velocity = new Float64Array(3);
    for (let i = 0; i < 3; i += 1) {
      position[i] = h00 * p0[i] + h10 * spanS * v0[i] + h01 * p1[i] + h11 * spanS * v1[i];
      const dh00 = 6 * u2 - 6 * u;
      const dh10 = 3 * u2 - 4 * u + 1;
      const dh01 = -6 * u2 + 6 * u;
      const dh11 = 3 * u2 - 2 * u;
      velocity[i] = (dh00 * p0[i] + dh01 * p1[i]) / spanS + dh10 * v0[i] + dh11 * v1[i];
    }
    return { position, velocity };
  }
}
