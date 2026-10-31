# Astraeus 0.6.0

## astraeus 0.6.0 (2026-11-01)

First download of the packed example (`npm run measure:example`): 1,638,245 bytes raw, 468,717 bytes gzip (code and styles loaded on first open).

Every listed moon can be added by id (O-049, G-014), from a third finding sent back by the outside interplanetary probe app built on 0.5.1: Uranus's main moons had positions but no bodies.

- Every moon in the engine's moon lists (458 across Mars, Jupiter, Saturn, Uranus, Neptune and Pluto) now carries a sidereal orbit period from the JPL Planetary Satellite Mean Elements table (O-049 T-210, I-122), and a small generated lookup (`core/bodies/listedMoons`: id, label, mean radius, parent, period, data package, fit-set body) lets a later step add any listed moon by id without loading the full lists. Importing the lookup from the entry adds 17,716 bytes raw and 7,126 bytes gzip to the first download (`npm run measure:example`, measured with the lookup consulted from `addBody`); the full lists stay out of it.
- `scene.addBody(id)` takes every moon in the moon lists, not only the ready-made ones (O-049 T-211, I-122). One rule: the listed moon becomes a grey sphere at its JPL mean radius (the picture pack's picture when it holds one under the moon's id), positioned from its planet's fits in `astraeus-data-<planet>`, with `{ orbit: true }` drawing one lap of its JPL period about the planet; a moon without a period throws `no-orbit`, a missing package `missing-data`, a window outside its fit years `out-of-span`. The detailed moons (Io to Callisto, Saturn's seven, Triton, Charon, Phobos, Deimos) keep their own definitions. A moon is defined only when a scene adds it, so an unused moon costs nothing at run time. New `listedMoons(planet?)` lists every addable moon with the data package it needs (`requires`); the `unknown-body` message names the built-in ids and `listedMoons(planet)` rather than hundreds of ids. With the lookup used, the first download of the packed example is 1,638,245 bytes raw, 468,717 bytes gzip (+19,682 raw, +7,617 gzip on 0.5.1; re-measured after T-212 with `npm run build` and `node tools/measure-example.mjs`).
- Proof on the packed package (O-049 T-212, I-122): `npm run check:node-consumer` adds Miranda and Titania by id with `{ orbit: true }` and lists Uranus's moons; the made-up synthetic journey now passes Uranus on 24 January 1986 and adds its five main moons, checked by `npm run check:browser`. No change to the package's code or size.

## astraeus-data 0.6.0 (2026-11-01)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.6.0 to keep the version numbers together; the six moon-position packages are unchanged, and every moon they hold can now be added by id with `scene.addBody` (see the `astraeus` 0.6.0 changelog).
