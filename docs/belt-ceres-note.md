# Note for the belt app: switching Ceres to the engine's built-in body

Astraeus 0.13 makes Ceres a built-in body with a mapped globe (USGS Dawn map) and positions fitted from JPL Horizons.
`addBodyFromElements("ceres")` is now a duplicate-id error, so the belt's elements Ceres in `src/belt/famous.ts` must change.

1. Replace the elements Ceres (`addBodyFromElements` with id "ceres") with:
   `scene.addBody(ceres, { ...the same card options... })`, using `import { ceres } from "astraeus"`.
2. Mount with the picture and position package, since Ceres needs its data:
   `import { dataSource } from "astraeus-data"` and `mount(el, scene, { data: [dataSource, ...] })`.
   Without it the scene fails with `missing-data` naming `astraeus-data`.
3. Add its places from the body package:
   `scene.addPlaces("ceres", { categories, places })` from `astraeus-data/bodies/ceres/categories.json` and `features.json`
   (the planets demo's `placesOf` in `astraeus-demo-planets/src/experiences/planets/planetScene.ts` shows the conversion).
4. The existing "Fly to Ceres" action needs no change; it now lands on the mapped globe, with Occator Crater and Ahuna Mons as places.

Facts and positions:
- Keep the SBDB facts as card facts on the belt's own card.
- Ceres's position now comes from the engine's Horizons fit (valid 1950 to 2045), not from the belt file's orbital elements;
  a window outside those years is rejected with `out-of-span`.
  Other belt asteroids keep their elements.
- Check that the timeline window the belt uses lies within 1950 to 2045.
