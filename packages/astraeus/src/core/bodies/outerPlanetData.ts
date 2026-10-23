/**
 * Saturn's, Uranus's, Neptune's and Pluto's core data files as they are read (O-033 T-118; moon data is core): the moon lists by family
 * (data/moons/<planet>.json, T-115) and the ring bands (data/rings/<planet>.json). Raw JSON: src/assets parses and checks them (layer rule:
 * assets reach data through core), as `jupiterData.ts` does for Jupiter.
 */
import neptuneMoons from "../../../data/moons/neptune.json";
import plutoMoons from "../../../data/moons/pluto.json";
import saturnMoons from "../../../data/moons/saturn.json";
import uranusMoons from "../../../data/moons/uranus.json";
import neptuneRings from "../../../data/rings/neptune.json";
import saturnRings from "../../../data/rings/saturn.json";
import uranusRings from "../../../data/rings/uranus.json";

export const SATURN_MOON_CATALOGUE_FILE: unknown = saturnMoons;
export const URANUS_MOON_CATALOGUE_FILE: unknown = uranusMoons;
export const NEPTUNE_MOON_CATALOGUE_FILE: unknown = neptuneMoons;
export const PLUTO_MOON_CATALOGUE_FILE: unknown = plutoMoons;
export const SATURN_RING_FILE: unknown = saturnRings;
export const URANUS_RING_FILE: unknown = uranusRings;
export const NEPTUNE_RING_FILE: unknown = neptuneRings;
