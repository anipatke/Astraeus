import { JUPITER_RING_FILE } from "../../core/bodies/jupiterData";
import { parseRingSystem, type RingSystem } from "../rings";

/** Jupiter's four faint ring bands: NSSDC radii, Planetary Explorer's look (data/rings/jupiter.json). Core data: any experience may draw them. */
export const JUPITER_RINGS: RingSystem = parseRingSystem(JUPITER_RING_FILE);
