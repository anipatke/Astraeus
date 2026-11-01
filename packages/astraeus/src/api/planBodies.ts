import type { BodyId } from "../core/body";
import { solarSystemScale, type ScalePolicy } from "../core/scalePolicy";
import { catalogue as builtInCatalogue, extendCatalogue, extendCatalogueWithMoons, rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import { buildElementsBody, ElementsBodyError, parseElementsBodyRecord, type ElementsBodyRecord } from "../core/elementsBody";
import type { CompositionPath } from "../assets/compositions";
import type { ExperienceDefinition, PathLayer, VisualOverride } from "../app/experienceDefinition";
import type { ExperienceObject } from "../shell/experience";
import { catalogueItem } from "../app/catalogueItem";
import type { EccentricSampling } from "../core/sunCentredSources";
import { circlesTheSun, sunOrbitIdOf, sunOrbitLayer } from "./sunOrbit";
import { listedMoonBodyOf } from "../core/bodies/listedMoonBodies";
import { readyMade, type BodyRef } from "./bodies";
import type { DataSource } from "./data";
import { SceneError } from "./errors";
import { checkLabelReach } from "./planPaths";
import type { AddBodyOptions } from "./scene";


type Shape = Pick<AddBodyOptions, "enlarge" | "showLabel">;

/**
 * The orbit line of a catalogued moon, by one rule: one lap of the period its catalogue definition carries (`orbitPeriodDays`, read once from the record or mean
 * elements), drawn about its parent. Undefined where the definition gives no period. A moon closes its loop (Io's look) unless its definition says its line fades (the Moon's, as before).
 */
function moonOrbitPath(catalogue: BodyCatalogue, id: BodyId): Omit<CompositionPath, "body"> | undefined {
  if (!catalogue.has(id)) return undefined;
  const { orbitPeriodDays, orbitLineFades, parentId } = catalogue.get(id).definition;
  if (orbitPeriodDays === undefined || parentId === undefined) return undefined;
  return { spanMs: orbitPeriodDays * 86_400_000, ...(orbitLineFades === true ? {} : { look: { endFadeOn: false } }) };
}

/** The enlargements the scene asked for, as the engine's per-body overrides. */
function visualOverridesEntry(shape: ReadonlyMap<BodyId, Shape>): Pick<ExperienceDefinition, "visualOverrides"> {
  const overrides: Record<BodyId, VisualOverride> = {};
  for (const [id, { enlarge }] of shape) if (enlarge !== undefined) overrides[id] = { exaggeration: enlarge };
  return Object.keys(overrides).length === 0 ? {} : { visualOverrides: overrides };
}

/** Parses an elements record, naming the field a mistake is in. */
function parseRecord(record: ElementsBodyRecord): ElementsBodyRecord {
  try {
    return parseElementsBodyRecord(record, "addBodyFromElements");
  } catch (error) {
    if (error instanceof ElementsBodyError) throw new SceneError("bad-element", error.message);
    throw error;
  }
}

/** Checks the colour, known limits and label reach given to `addBody`. */
function checkBodyLook(id: string, options: AddBodyOptions): void {
  if (options.labelReach !== undefined) checkLabelReach(options.labelReach, new SceneError("bad-body", `addBody("${id}"): labelReach ${String(options.labelReach)} must be a positive finite number`));
  if (options.enlarge !== undefined && !(typeof options.enlarge === "number" && Number.isFinite(options.enlarge) && options.enlarge >= 1)) throw new SceneError("bad-body", `addBody("${id}"): enlarge ${String(options.enlarge)} must be a number of at least 1`);
  if (options.showLabel !== undefined && typeof options.showLabel !== "boolean") throw new SceneError("bad-body", `addBody("${id}"): showLabel must be true or false`);
  if (options.color !== undefined && !(typeof options.color === "string" && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(options.color))) throw new SceneError("bad-body", `addBody("${id}"): color "${String(options.color)}" is not a hex colour such as "#9fd8ff"`);
  const limits = options.knownLimitations;
  if (limits !== undefined && !(Array.isArray(limits) && limits.every((line) => typeof line === "string" && line !== ""))) throw new SceneError("bad-body", `addBody("${id}"): knownLimitations must be a list of non-empty texts`);
}

/** The camera facts the label rule reads. */
export interface LabelCamera {
  readonly fitted: string | undefined;
  readonly reach: number | undefined;
}

/** What a `Scene` has planned for its bodies: the bodies, their options and the scene's catalogue. */
export class BodyPlan {
  readonly bodies = new Map<BodyId, BodyRef>();
  readonly orbits = new Set<BodyId>();
  readonly own = new Map<BodyId, EccentricSampling>();
  readonly labelReaches = new Map<string, number>();
  readonly shape = new Map<BodyId, Shape>();
  readonly notes = new Map<BodyId, string>();
  readonly looks = new Map<BodyId, Pick<AddBodyOptions, "color" | "knownLimitations">>();
  catalogue: BodyCatalogue = builtInCatalogue;
  readonly #taken: (id: string) => boolean;
  readonly #firstBody: (id: BodyId) => void;

  /** `taken` says whether the scene already holds an id; `firstBody` runs when the scene's first body arrives (it is a built-in one). */
  constructor(taken: (id: string) => boolean, firstBody: (id: BodyId) => void) {
    this.#taken = taken;
    this.#firstBody = firstBody;
  }

  addBody(body: BodyRef | BodyId, options: AddBodyOptions): void {
    const id = typeof body === "string" ? body : body.id;
    const before = this.catalogue;
    this.#addListedMoon(id);
    try {
      this.#register("addBody", id, typeof body === "string" ? readyMade(id) ?? { id, label: this.catalogue.has(id) ? this.catalogue.get(id).definition.label : id } : body, options);
    } catch (error) {
      this.catalogue = before;
      throw error;
    }
  }

  addFromElements(record: ElementsBodyRecord, options: AddBodyOptions): void {
    if (record?.id === "auto") throw new SceneError("bad-element", `addBodyFromElements("auto"): "auto" is reserved (it is lineFixedTo's automatic choice) and cannot be a body id`);
    const parsed = parseRecord(record);
    if (this.#taken(parsed.id) || this.catalogue.has(parsed.id)) throw new SceneError("duplicate-id", `addBodyFromElements("${parsed.id}"): that id is already in the scene or the catalogue`);
    const root = builtInCatalogue.get(rootBodyId()).definition;
    const before = this.catalogue;
    this.catalogue = extendCatalogue(before, [parsed]);
    try {
      this.#register("addBodyFromElements", parsed.id, { id: parsed.id, label: parsed.label }, options);
    } catch (error) {
      this.catalogue = before;
      throw error;
    }
    this.own.set(parsed.id, buildElementsBody(parsed, { id: root.id, gmKm3S2: root.gmKm3S2! }).sampling);
  }

  /** A moon in the listed-moon table that the built-in catalogue does not define by hand is defined now, by the one rule, and joins this scene's catalogue only (an unused moon costs nothing). */
  #addListedMoon(id: BodyId): void {
    if (this.catalogue.has(id)) return;
    const moon = listedMoonBodyOf(id);
    if (moon !== undefined && this.catalogue.has(moon.definition.parentId!)) this.catalogue = extendCatalogueWithMoons(this.catalogue, [moon]);
  }

  #register(call: string, id: BodyId, ref: BodyRef, options: AddBodyOptions): void {
    if (options.orbit === true && moonOrbitPath(this.catalogue, id) === undefined && !(circlesTheSun(this.catalogue, id))) throw new SceneError("no-orbit", `${call}("${id}", { orbit: true }): the engine draws the orbit line of any catalogued moon whose data give a period about its planet and of any body that circles the Sun (every planet: its own source over a full turn where the source covers one, else the two-body ellipse osculating at the opening time)`);
    if (!this.catalogue.has(id)) throw new SceneError("unknown-body", `${call}("${id}"): not a catalogued body (known: ${builtInCatalogue.ids().join(", ")}; any moon in the moon lists is added by its id, and \`listedMoons(planet)\` names them with the data package each needs)`);
    if (this.#taken(id)) throw new SceneError("duplicate-id", `${call}("${id}"): already in the scene`);
    checkBodyLook(id, options);
    if (options.labelReach !== undefined) this.labelReaches.set(id, options.labelReach);
    if (options.orbit === true) this.orbits.add(id);
    if (options.color !== undefined || options.knownLimitations !== undefined) this.looks.set(id, { ...(options.color === undefined ? {} : { color: options.color }), ...(options.knownLimitations === undefined ? {} : { knownLimitations: options.knownLimitations }) });
    if (options.enlarge !== undefined || options.showLabel !== undefined) this.shape.set(id, { ...(options.enlarge === undefined ? {} : { enlarge: options.enlarge }), ...(options.showLabel === undefined ? {} : { showLabel: options.showLabel }) });
    if (options.description !== undefined) this.notes.set(id, options.description);
    this.bodies.set(id, ref);
    if (this.bodies.size === 1 && builtInCatalogue.has(id)) this.#firstBody(id);
  }

  /** The data packages the added bodies need that `data` does not provide. */
  missingData(data: readonly DataSource[]): readonly string[] {
    const have = new Set(data.flatMap((source) => source.provides));
    const named = new Set(data.map((source) => source.name));
    return [...new Set([...this.bodies.values()].filter((body) => body.requires !== undefined && !have.has(body.id) && !named.has(body.requires)).map((body) => body.requires!))];
  }

  /** Throws `missing-data` naming the bodies whose data package was not passed. */
  checkData(data: readonly DataSource[]): void {
    const missing = this.missingData(data);
    if (missing.length === 0) return;
    const names = [...this.bodies.values()].filter((body) => body.requires !== undefined && missing.includes(body.requires)).map((body) => body.id);
    throw new SceneError("missing-data", `${names.join(", ")} needs the ${missing.join(", ")} package: install it and pass it as mount(element, scene, { data: [...] })`);
  }

  /** The engine's own orbit loops (the Moon's and Io's) the scene asked for. */
  moonPaths(): readonly CompositionPath[] {
    return [...this.orbits].filter((id) => moonOrbitPath(this.catalogue, id) !== undefined).map((id): CompositionPath => {
      const orbit = moonOrbitPath(this.catalogue, id)!;
      const parent = this.catalogue.get(id).definition.parentId;
      if (parent === undefined || !this.bodies.has(parent)) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about ${parent}, which has not been added to the scene`);
      return { body: id, ...orbit };
    });
  }

  /** The bodies that asked for a Sun-orbit line, checked: the Sun must be in the scene and the line's id free. */
  sunOrbitIds(ids: readonly BodyId[]): readonly BodyId[] {
    return [...this.orbits].filter((id) => moonOrbitPath(this.catalogue, id) === undefined).map((id) => {
      if (!ids.includes(rootBodyId(this.catalogue))) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about the Sun, which has not been added to the scene`);
      if (this.#taken(sunOrbitIdOf(id))) throw new SceneError("duplicate-id", `addBody("${id}", { orbit: true }): the orbit line's id "${sunOrbitIdOf(id)}" is already in the scene`);
      return id;
    });
  }

  /** One Sun-orbit line: one full turn from the opening time (an own body from its periapsis). Reads planet positions, so the planet series must be loaded. */
  sunPath(id: BodyId, openUtcMs: number): PathLayer {
    const layer = sunOrbitLayer(this.catalogue, id, openUtcMs, this.looks.get(id)?.color ?? "", this.own.get(id));
    if (layer === undefined) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): "${id}" completes no turn within thirty years and its position and the Sun's gravity do not give a bound ellipse; add it with addBodyFromElements to draw its whole orbit`);
    return layer;
  }

  /** The Sun-orbit lines that can be drawn now: `loaded` (the planet series are in) draws all of them, else none (they are drawn in `prepare`). */
  earlySunPaths(orbitIds: readonly BodyId[], openUtcMs: number, loaded: boolean): PathLayer[] {
    return loaded ? orbitIds.map((id) => this.sunPath(id, openUtcMs)) : [];
  }

  /** Whether the scene is centred on the Sun. */
  checkSunCentred(ids: readonly BodyId[]): boolean {
    return ids[0] === rootBodyId(this.catalogue);
  }

  checkSolarSystemScale(scale: ScalePolicy, sunCentred: boolean): void {
    if (scale.id === solarSystemScale.id && !this.enlargedInSun(sunCentred)) throw new SceneError("bad-scale", "setScale: the Solar system scale needs a Sun-centred scene with an enlarged body (addBody(x, { enlarge }))");
  }

  /** Whether a Sun-centred scene enlarges a body, which the viewer's solar-system scale draws. */
  enlargedInSun(sunCentred: boolean): boolean {
    return sunCentred && [...this.shape.values()].some((shape) => shape.enlarge !== undefined);
  }

  visualOverrides(): Pick<ExperienceDefinition, "visualOverrides"> {
    return visualOverridesEntry(this.shape);
  }

  /** How far a label shows, for bodies and paths alike: the item's own `labelReach` if given, else the shared rule: a Sun-centred scene, or one that fits the zoom-out to an orbit (`fitOrbit`, whose limit changes with the canvas), sets no limit; otherwise the camera reach, at least 500. */
  labelReach(id: string, sunCentred: boolean, camera: LabelCamera): { readonly labelMaxDistance?: number } {
    const own = this.labelReaches.get(id);
    if (own !== undefined) return { labelMaxDistance: own };
    return sunCentred || camera.fitted !== undefined ? {} : { labelMaxDistance: Math.max(500, camera.reach ?? 0) };
  }

  /** The shell item of a body: from the catalogue, with the scene's own words, look and label setting. Label reach is `labelReach`. */
  bodyObject(body: BodyRef, ids: readonly BodyId[], sunCentred: boolean, camera: LabelCamera): ExperienceObject {
    const own = { labelPriority: 100 - ids.indexOf(body.id), ...this.labelReach(body.id, sunCentred, camera), ...(this.shape.get(body.id)?.showLabel === undefined ? {} : { showLabel: this.shape.get(body.id)!.showLabel }), ...(this.notes.has(body.id) ? { description: this.notes.get(body.id) } : {}), ...this.looks.get(body.id) };
    return { ...catalogueItem(body.id, own, this.catalogue), label: body.label };
  }
}
