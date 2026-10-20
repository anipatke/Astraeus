// Shower bodies: the system composition, planet ids and the shell objects for the bodies.
import { catalogueItem } from "../../app/catalogueItem";
import { EARTH_EPHEMERIS } from "../../app/ephemerisProvenance";
import type { BodyId } from "../../core/body";
import { rootBodyId } from "../../assets/catalogue";
import { createComposition, type SystemComposition } from "../../assets/compositions";
import type { ExperienceObject } from "../../shell/experience";
import { BEYOND_SHOWER_VIEWS, LABEL_PRIORITY, showerCatalogue } from "./showerBasics";
import type { ShowerSettings } from "./showerSettings";

/** The Sun, the catalogue's planets (Earth included) and this shower's parent, as the catalogue holds them. */
export function showerComposition(settings: ShowerSettings): SystemComposition {
  const catalogue = showerCatalogue(settings);
  const root = rootBodyId();
  const circling = catalogue.ids().filter((id) => catalogue.get(id).definition.parentId === root);
  if (!circling.includes(settings.parentBodyId)) {
    throw new RangeError(`parentBodyId "${settings.parentBodyId}" is not a catalogued body that circles the Sun (${circling.join(", ")})`);
  }
  // The Sun, the planets and this shower's own parent. A "planet" is a Sun-circling body drawn as a sphere (the catalogue has no category field; a marker body is a
  // comet or asteroid), so another shower's parent is never mounted here.
  const around = circling.filter((id) => id === settings.parentBodyId || (catalogue.get(id).visual.kind === "sphere" && !BEYOND_SHOWER_VIEWS.includes(id)));
  return createComposition(catalogue, { id: `${settings.id}-sun-system`, bodies: [root, ...around], defaultCenter: root });
}

/** The composition's planets: every drawn sphere except the Sun and the parent (a comet is a marker; its nucleus is under a pixel at any scale). */
export function planetIdsOf(composition: SystemComposition, settings: ShowerSettings): BodyId[] {
  const catalogue = showerCatalogue(settings);
  return composition.bodies.filter((id) => id !== rootBodyId() && id !== settings.parentBodyId && catalogue.get(id).visual.kind === "sphere");
}

/** The shell items of the composition's bodies: the Sun, Earth and the parent have their own words, every other body is whatever the catalogue holds. */
export function bodyObjects(settings: ShowerSettings, composition: SystemComposition): ExperienceObject[] {
  const reach = settings.look.cameraFar;
  return composition.bodies.map((id) => withLabelSetting(settings, bodyObject(settings, composition, id, reach)));
}

function withLabelSetting(settings: ShowerSettings, object: ExperienceObject): ExperienceObject {
  const shown = settings.labels[object.id];
  return shown === undefined ? object : { ...object, showLabel: shown };
}

function bodyObject(settings: ShowerSettings, _composition: SystemComposition, id: BodyId, reach: number): ExperienceObject {
  {
    const catalogue = showerCatalogue(settings);
    const { definition } = catalogue.get(id);
    if (id === rootBodyId()) {
      return catalogueItem(id, {
        labelPriority: LABEL_PRIORITY.sun,
        labelMaxDistance: reach,
        description: "The Sun, the centre of the scene. The stream and the planets' paths circle it.",
        knownLimitations: ["The Sun is drawn as an emissive sphere at its true radius with a soft halo; the halo is a drawing aid sized on screen, not part of the Sun.", ...(catalogue.get(id).definition.accuracy.orientationLimitations ?? [])],
      }, catalogue);
    }
    if (id === "earth") {
      return catalogueItem(id, {
        color: "#9fd8ff",
        labelPriority: LABEL_PRIORITY.earth,
        labelMaxDistance: reach,
        description: `The planet that crosses the stream of the ${settings.label}.`,
        knownLimitations: [
          ...EARTH_EPHEMERIS.knownLimitations,
          `In the Solar system scale Earth is drawn ${settings.look.planetExaggeration} times larger than life so it can be seen; distances stay true.`,
        ],
      }, catalogue);
    }
    if (id === settings.parentBodyId) {
      return catalogueItem(id, {
        labelPriority: LABEL_PRIORITY.parent,
        labelMaxDistance: reach,
        description: `${definition.label}, the parent of the ${settings.label}, at its position on the date shown. Its whole orbit is drawn.`,
      }, catalogue);
    }
    return catalogueItem(id, {
      labelPriority: LABEL_PRIORITY.planet,
      labelMaxDistance: reach,
      description: `${definition.label}, at its catalogued position about the Sun on the date shown.`,
      knownLimitations: [
        ...(definition.accuracy.orientationLimitations ?? []),
        `In the Solar system scale ${definition.label} is drawn ${settings.look.planetExaggeration} times larger than life so it can be seen; distances stay true.`,
      ],
    }, catalogue);
  }
}
