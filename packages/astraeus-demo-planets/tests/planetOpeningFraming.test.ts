import { describe, expect, it } from "vitest";
import pluto from "../data/planets/pluto.json";
import saturn from "../data/planets/saturn.json";
import uranus from "../data/planets/uranus.json";
import neptune from "../data/planets/neptune.json";

// I-053: each outer planet's single opening view must keep its planet, its rings and (Pluto) Charon in view on a portrait phone as well as a
// laptop. Pure geometry: the camera looks at the focus from `distance` Earth radii with the scene's 45 degree vertical field of view.
const FOV_DEG = 45;
const EARTH_RADIUS_KM = 6371;
const PHONE = 390 / 844;
const DESKTOP = 1280 / 800;

/** Worst-case share of the half-width used by a sphere of `radiusKm` whose centre is `awayKm` from the focus in any direction (1 or more is out of view). */
function worstHalfWidthShare(distance: number, awayKm: number, radiusKm: number, aspect: number): number {
  const half = Math.tan((FOV_DEG * Math.PI) / 360) * aspect;
  let worst = 0;
  for (let deg = 0; deg <= 180; deg += 1) {
    const phi = (deg * Math.PI) / 180;
    const lateral = (awayKm * Math.sin(phi)) / EARTH_RADIUS_KM + radiusKm / EARTH_RADIUS_KM;
    const depth = distance - (awayKm * Math.cos(phi)) / EARTH_RADIUS_KM;
    worst = Math.max(worst, lateral / (depth * half));
  }
  return worst;
}

describe("outer planet opening views keep their subjects in view (I-053)", () => {
  // Pluto-Charon separation 19,596 km (the system's mean), Charon radius 606 km, Pluto radius 1,188 km.
  it("Pluto opens with Pluto and Charon in view at phone and desktop aspect", () => {
    const d = pluto.startView.distance;
    for (const aspect of [PHONE, DESKTOP]) {
      expect(worstHalfWidthShare(d, 0, 1188, aspect)).toBeLessThan(0.2);
      expect(worstHalfWidthShare(d, 19_596, 606, aspect)).toBeLessThan(1);
    }
  });

  // Outermost ring or planet edge: Saturn A ring 136,775 km (F ring 140,180), Uranus epsilon 51,149 km, Neptune Adams 62,933 km.
  const planets = [["saturn", saturn, 140_180], ["uranus", uranus, 51_149], ["neptune", neptune, 62_933]] as const;
  for (const [name, file, extentKm] of planets) {
    it(`${name} opens with its whole planet and rings in view at phone and desktop aspect`, () => {
      for (const aspect of [PHONE, DESKTOP]) expect(worstHalfWidthShare(file.startView.distance, 0, extentKm, aspect)).toBeLessThan(1);
    });
  }
});
