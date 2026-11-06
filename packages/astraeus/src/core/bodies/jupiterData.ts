/**
 * Jupiter's core ring file as it is read (O-025 Decision 8: planet data is core): the ring bands (data/rings/jupiter.json). Raw JSON: src/assets
 * parses and checks it (layer rule: assets reach data through core). The moon lists live in the planets' data packages (O-059 T-270).
 */
import ringFile from "../../../data/rings/jupiter.json" with { type: "json" };

export const JUPITER_RING_FILE: unknown = ringFile;
