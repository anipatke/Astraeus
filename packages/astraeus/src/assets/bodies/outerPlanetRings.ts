import { NEPTUNE_RING_FILE, SATURN_RING_FILE, URANUS_RING_FILE } from "../../core/bodies/outerPlanetRingData";
import { parseRingSystem, type RingSystem } from "../rings";

/** Ring bands from the NASA NSSDC ring fact sheets with the donor's looks (data/rings/<planet>.json, T-118). Pluto has none. Core data: the planet's catalogue visual carries them. */
export const SATURN_RINGS: RingSystem = parseRingSystem(SATURN_RING_FILE);
export const URANUS_RINGS: RingSystem = parseRingSystem(URANUS_RING_FILE);
export const NEPTUNE_RINGS: RingSystem = parseRingSystem(NEPTUNE_RING_FILE);
