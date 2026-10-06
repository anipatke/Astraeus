/** Natural bodies that can serve as a reference center. */
export type CenterId = "earth" | "moon" | "sun";

/** Any State subject: a natural body or any other non-empty id, such as a spacecraft. */
export type BodyId = string;

const CENTER_IDS: readonly string[] = ["earth", "moon", "sun"];

export function isCenterId(id: BodyId): id is CenterId {
  return CENTER_IDS.includes(id);
}

export function assertCenterId(id: BodyId): asserts id is CenterId {
  if (!isCenterId(id)) throw new RangeError(`"${id}" is not a natural body that can serve as a reference center`);
}

export interface Body {
  readonly id: BodyId;
  readonly radiusKm: number;
  readonly parentId?: CenterId;
}

// Volumetric mean radii in km from NASA NSSDC's Earth and Moon fact sheets.
export const EARTH: Body = Object.freeze({ id: "earth", radiusKm: 6371.0 });
export const MOON: Body = Object.freeze({ id: "moon", radiusKm: 1737.4, parentId: "earth" });
