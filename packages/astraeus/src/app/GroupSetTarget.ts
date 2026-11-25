// Several point groups taken as one thing the camera can focus and frame (a host label that selects several groups, `Scene.addLabels`).
import type { ScalePolicy } from "../presentation/scalePolicy";
import type { PointsView } from "./PointsView";
import type { RenderVector } from "./renderCoordinates";

export class GroupSetTarget {
  constructor(
    readonly id: string,
    readonly views: readonly PointsView[],
  ) {}

  /** Whether any of the groups is inside its time bounds now. */
  get drawn(): boolean {
    return this.views.some((view) => view.drawn);
  }

  /** The groups that count now: the drawn ones, or all of them when none is. */
  #counted(): readonly PointsView[] {
    const drawn = this.views.filter((view) => view.drawn);
    return drawn.length === 0 ? this.views : drawn;
  }

  /** The mean of the groups' centroids, each weighted by its member count. */
  absolute(): RenderVector {
    const sum: [number, number, number] = [0, 0, 0];
    let total = 0;
    for (const view of this.#counted()) {
      const weight = view.layer.group.count;
      const at = view.absolute();
      for (let k = 0; k < 3; k++) sum[k] += weight * at[k]!;
      total += weight;
    }
    return total === 0 ? [0, 0, 0] : [sum[0] / total, sum[1] / total, sum[2] / total];
  }

  /** The radius of the sphere around `absolute()` that holds every counted group's dots. */
  extentUnits(policy: ScalePolicy): number {
    const mean = this.absolute();
    let widest = 0;
    for (const view of this.#counted()) {
      const at = view.absolute();
      widest = Math.max(
        widest,
        Math.hypot(at[0] - mean[0], at[1] - mean[1], at[2] - mean[2]) + view.extentUnits(policy),
      );
    }
    return widest;
  }
}
