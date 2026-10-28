/**
 * Jupiter's core data files as they are read (O-025 Decision 8: moon data is core): the moon list by family (data/moons/jupiter.json,
 * T-097) and the ring bands (data/rings/jupiter.json). Raw JSON: src/assets parses and checks them (layer rule: assets reach data
 * through core).
 */
import moonCatalogueFile from "../../../data/moons/jupiter.json" with { type: "json" };
import ringFile from "../../../data/rings/jupiter.json" with { type: "json" };

export const JUPITER_MOON_CATALOGUE_FILE: unknown = moonCatalogueFile;
export const JUPITER_RING_FILE: unknown = ringFile;
