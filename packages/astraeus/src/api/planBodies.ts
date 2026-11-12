import type { BodyId } from "../core/body";
import { readableScale, solarSystemScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import { catalogue as builtInCatalogue, extendCatalogue, extendCatalogueWithMoons, rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import { buildElementsBody, ElementsBodyError, parseElementsBodyRecord, type ElementsBodyRecord } from "../core/elementsBody";
import type { CompositionPath } from "../assets/compositions";
import type { ExperienceDefinition, PathLayer, VisualOverride } from "../app/experienceDefinition";
import type { ExperienceObject, ShownSpan } from "../shell/experience";
import { planShownDuring } from "./shownDuring";
import { catalogueItem } from "../app/catalogueItem";
import type { EccentricSampling } from "../core/sunCentredSources";
import { circlesTheSun, sunOrbitIdOf, sunOrbitLayer } from "./sunOrbit";
import { listedMoonBodyOf } from "../core/bodies/listedMoonBodies";
import { readyMade, type BodyRef } from "./bodies";
import type { DataSource } from "./data";
import { SceneError } from "./errors";
import { rejectRenamed } from "./renamedInputs";
import { checkLabelReach } from "./planPaths";
import type { AddBodyOptions, CardFactInput, OrbitLapInput, ReadoutInput } from "./scene";
import { createProvenance, type Provenance } from "../core/provenance";
import { frozenCopy } from "./frozenCopy";
import { readoutsOf } from "./planPaths";
import { frozenList, type SceneBodyRead } from "./sceneReads";


type Shape = Pick<AddBodyOptions, "enlarge" | "showLabel">;

/**
 * The orbit line of a catalogued moon, by one rule: one lap of the period its catalogue definition carries (`orbitPeriodDays`, read once from the record or mean
 * elements), drawn about its parent. Undefined where the definition gives no period. A moon closes its loop (Io's look) unless its definition says its line fades (the Moon's, as before).
 */
function moonOrbitPath(catalogue: BodyCatalogue, id: BodyId, lap?: OrbitLapInput): Omit<CompositionPath, "body"> | undefined {
  if (!catalogue.has(id)) return undefined;
  const { orbitPeriodDays, orbitLineFades, parentId } = catalogue.get(id).definition;
  const days = lap?.lapDays ?? orbitPeriodDays;
  if (days === undefined || parentId === undefined) return undefined;
  return { spanMs: days * 86_400_000, ...((lap?.fades ?? orbitLineFades) === true ? {} : { look: { endFadeOn: false } }) };
}

/** Whether `orbit` is the lap form `{ lapDays, fades? }`. */
const isLap = (orbit: AddBodyOptions["orbit"]): orbit is OrbitLapInput => typeof orbit === "object" && orbit !== null;

/** Checks the card facts, extra sources, label priority, menu flag and lap form given to `addBody`. */
function checkBodyCard(id: string, options: AddBodyOptions): void {
  const bad = (message: string) => new SceneError("bad-body", `addBody("${id}"): ${message}`);
  if (options.listed !== undefined && typeof options.listed !== "boolean") throw bad("listed must be true or false");
  const { facts, sources, labelPriority, orbit } = options;
  if (facts !== undefined && !(Array.isArray(facts) && facts.every((fact: CardFactInput) => typeof fact?.label === "string" && fact.label !== "" && typeof fact.value === "string" && fact.value !== ""))) throw bad("facts must be a list of { label, value } with both texts non-empty");
  if (sources !== undefined && !(Array.isArray(sources) && sources.every((source) => typeof source === "string" && source !== ""))) throw bad("sources must be a list of non-empty texts");
  if (labelPriority !== undefined && !(typeof labelPriority === "number" && Number.isFinite(labelPriority))) throw bad(`labelPriority ${String(labelPriority)} must be a finite number`);
  checkOrbitOption(bad, orbit);
}

/** Checks the `orbit` option: true, false or the lap form. */
function checkOrbitOption(bad: (message: string) => SceneError, orbit: AddBodyOptions["orbit"]): void {
  if (orbit !== undefined && typeof orbit !== "boolean" && !isLap(orbit)) throw bad("orbit must be true, false or { lapDays, fades? }");
  if (isLap(orbit)) {
    if (!(typeof orbit.lapDays === "number" && Number.isFinite(orbit.lapDays) && orbit.lapDays > 0)) throw bad(`orbit.lapDays ${String(orbit.lapDays)} must be a positive finite number of days`);
    if (orbit.fades !== undefined && typeof orbit.fades !== "boolean") throw bad("orbit.fades must be true or false");
  }
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
  if (options.labelReachEarthRadii !== undefined) checkLabelReach(options.labelReachEarthRadii, new SceneError("bad-body", `addBody("${id}"): labelReachEarthRadii ${String(options.labelReachEarthRadii)} must be a positive finite number`));
  if (options.enlarge !== undefined && !(typeof options.enlarge === "number" && Number.isFinite(options.enlarge) && options.enlarge >= 1)) throw new SceneError("bad-body", `addBody("${id}"): enlarge ${String(options.enlarge)} must be a number of at least 1`);
  if (options.showLabel !== undefined && typeof options.showLabel !== "boolean") throw new SceneError("bad-body", `addBody("${id}"): showLabel must be true or false`);
  if (options.color !== undefined && !(typeof options.color === "string" && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(options.color))) throw new SceneError("bad-body", `addBody("${id}"): color "${String(options.color)}" is not a hex colour such as "#9fd8ff"`);
  const limits = options.knownLimitations;
  if (limits !== undefined && !(Array.isArray(limits) && limits.every((line) => typeof line === "string" && line !== ""))) throw new SceneError("bad-body", `addBody("${id}"): knownLimitations must be a list of non-empty texts`);
}

/** A provenance with more sources after its own. */
const withSources = (provenance: Provenance, sources: readonly string[]): Provenance => createProvenance({ ...provenance, sources: [...provenance.sources, ...sources] });

/** The camera facts the label rule reads. */
export interface LabelCamera {
  readonly fitted: string | undefined;
  readonly reachEarthRadii: number | undefined;
}

/** What a `Scene` has planned for its bodies: the bodies, their options and the scene's catalogue. */
export class BodyPlan {
  readonly bodies = new Map<BodyId, BodyRef>();
  readonly orbits = new Set<BodyId>();
  readonly own = new Map<BodyId, EccentricSampling>();
  readonly labelReaches = new Map<string, number>();
  readonly shape = new Map<BodyId, Shape>();
  readonly notes = new Map<BodyId, string>();
  readonly readouts = new Map<BodyId, readonly ReadoutInput[]>();
  readonly laps = new Map<BodyId, OrbitLapInput>();
  readonly cards = new Map<BodyId, Pick<AddBodyOptions, "listed" | "facts" | "sources" | "labelPriority">>();
  readonly looks = new Map<BodyId, Pick<AddBodyOptions, "color" | "knownLimitations">>();
  readonly shown = new Map<BodyId, ShownSpan>();
  catalogue: BodyCatalogue = builtInCatalogue;
  readonly #taken: (id: string) => boolean;
  readonly #firstBody: (id: BodyId) => void;

  /** `taken` says whether the scene already holds an id; `firstBody` runs when the scene's first body arrives (it is a built-in one). */
  constructor(taken: (id: string) => boolean, firstBody: (id: BodyId) => void) {
    this.#taken = taken;
    this.#firstBody = firstBody;
  }

  addBody(body: BodyRef | BodyId, input: AddBodyOptions): void {
    const options = frozenCopy(input);
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

  addFromElements(input: ElementsBodyRecord, inputOptions: AddBodyOptions): void {
    const record = frozenCopy(input);
    const options = frozenCopy(inputOptions);
    if (record?.id === "auto") throw new SceneError("bad-element", `addBodyFromElements("auto"): "auto" is reserved (it is lineFixedTo's automatic choice) and cannot be a body id`);
    rejectRenamed("ElementsBodyRecord", record, "addBodyFromElements");
    rejectRenamed("ElementsAccuracy", record?.accuracy, "addBodyFromElements: accuracy");
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

  /** Refuses an `orbit` the engine cannot draw: `true` needs a period about a parent or a Sun orbit; the lap form needs a parent that is not the Sun. */
  #checkOrbit(call: string, id: BodyId, options: AddBodyOptions): void {
    if (options.orbit === true && moonOrbitPath(this.catalogue, id) === undefined && !(circlesTheSun(this.catalogue, id))) throw new SceneError("no-orbit", `${call}("${id}", { orbit: true }): the engine draws the orbit line of any catalogued moon whose data give a period about its planet and of any body that circles the Sun (every planet: its own source over a full turn where the source covers one, else the two-body ellipse osculating at the opening time)`);
    const lap = isLap(options.orbit) ? options.orbit : undefined;
    if (lap !== undefined && this.catalogue.has(id) && (this.catalogue.get(id).definition.parentId === undefined || circlesTheSun(this.catalogue, id))) throw new SceneError("no-orbit", `${call}("${id}", { orbit: { lapDays } }): the lap form draws a moon's line about its parent; "${id}" has no parent in the catalogue or circles the Sun (use orbit: true)`);
  }

  /** Keeps what `addBody` asked for, option by option. */
  #remember(call: string, id: BodyId, options: AddBodyOptions): void {
    if (options.readouts !== undefined) this.readouts.set(id, readoutsOf(id, options.readouts, call));
    if (options.labelReachEarthRadii !== undefined) this.labelReaches.set(id, options.labelReachEarthRadii);
    const lap = isLap(options.orbit) ? options.orbit : undefined;
    if (options.orbit === true || lap !== undefined) this.orbits.add(id);
    if (lap !== undefined) this.laps.set(id, { lapDays: lap.lapDays, ...(lap.fades === undefined ? {} : { fades: lap.fades }) });
    this.#rememberCard(id, options);
  }

  /** Keeps the card, look, shape and words of one body. */
  #rememberCard(id: BodyId, options: AddBodyOptions): void {
    if (options.listed !== undefined || options.facts !== undefined || options.sources !== undefined || options.labelPriority !== undefined) this.cards.set(id, { ...(options.listed === undefined ? {} : { listed: options.listed }), ...(options.facts === undefined ? {} : { facts: options.facts.map(({ label, value }) => Object.freeze({ label, value })) }), ...(options.sources === undefined ? {} : { sources: [...options.sources] }), ...(options.labelPriority === undefined ? {} : { labelPriority: options.labelPriority }) });
    if (options.color !== undefined || options.knownLimitations !== undefined) this.looks.set(id, { ...(options.color === undefined ? {} : { color: options.color }), ...(options.knownLimitations === undefined ? {} : { knownLimitations: options.knownLimitations }) });
    if (options.enlarge !== undefined || options.showLabel !== undefined) this.shape.set(id, { ...(options.enlarge === undefined ? {} : { enlarge: options.enlarge }), ...(options.showLabel === undefined ? {} : { showLabel: options.showLabel }) });
    if (options.description !== undefined) this.notes.set(id, options.description);
  }

  #register(call: string, id: BodyId, ref: BodyRef, options: AddBodyOptions): void {
    rejectRenamed("AddBodyOptions", options, `${call}("${id}")`);
    checkBodyCard(id, options);
    this.#checkOrbit(call, id, options);
    if (!this.catalogue.has(id)) throw new SceneError("unknown-body", `${call}("${id}"): not a catalogued body (known: ${builtInCatalogue.ids().join(", ")}; any moon in the moon lists is added by its id, and \`listedMoons(planet)\` names them with the data package each needs)`);
    if (this.#taken(id)) throw new SceneError("duplicate-id", `${call}("${id}"): already in the scene`);
    checkBodyLook(id, options);
    const shown = planShownDuring(call, id, "bad-body", options.shownDuring);
    this.#remember(call, id, options);
    if (shown !== undefined) this.shown.set(id, shown);
    this.bodies.set(id, ref);
    if (this.bodies.size === 1 && builtInCatalogue.has(id)) this.#firstBody(id);
  }

  /** A body's position provenance as its card shows it: the catalogue's, with the sources `addBody` added after its own. */
  provenanceOf(id: BodyId): Provenance {
    const base = this.catalogue.get(id).definition.accuracy.position;
    const sources = this.cards.get(id)?.sources;
    return sources === undefined ? base : withSources(base, sources);
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
    return [...this.orbits].filter((id) => moonOrbitPath(this.catalogue, id, this.laps.get(id)) !== undefined).map((id): CompositionPath => {
      const orbit = moonOrbitPath(this.catalogue, id, this.laps.get(id))!;
      const parent = this.catalogue.get(id).definition.parentId;
      if (parent === undefined || !this.bodies.has(parent)) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about ${parent}, which has not been added to the scene`);
      return { body: id, ...orbit };
    });
  }

  /** The bodies that asked for a Sun-orbit line, checked: the Sun must be in the scene and the line's id free. */
  sunOrbitIds(ids: readonly BodyId[]): readonly BodyId[] {
    return [...this.orbits].filter((id) => moonOrbitPath(this.catalogue, id, this.laps.get(id)) === undefined).map((id) => {
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

  /** The bodies in the order added, as the public list states them. */
  reads(): readonly SceneBodyRead[] {
    return frozenList([...this.bodies.values()].map(({ id, label }): SceneBodyRead => {
      const parent = this.catalogue.has(id) ? this.catalogue.get(id).definition.parentId : undefined;
      const limits = this.catalogue.has(id) ? catalogueItem(id, { ...this.looks.get(id) }, this.catalogue).knownLimitations : undefined;
      const description = this.notes.get(id);
      const card = this.cards.get(id);
      const texture = this.catalogue.has(id) ? this.catalogue.get(id).visual.texture : undefined;
      return { id, label, listed: card?.listed ?? true, ...(card?.facts === undefined ? {} : { facts: card.facts }), ...(texture === undefined ? {} : { texture }), ...(parent === undefined ? {} : { parent }), orbit: this.orbits.has(id), enlarge: this.shape.get(id)?.enlarge ?? 1, ...(description === undefined ? {} : { description }), knownLimitations: Object.freeze([...(limits ?? [])]) };
    }));
  }

  /**
   * The scale choices offered: the opening one first, then the other unless the caller offered one alone. A Sun-centred scene with an enlarged body (`addBody(x, { enlarge })`)
   * offers `solarSystemScale` (true distances, the named bodies enlarged) in place of the readable scale it would offer second, since the readable scale does not enlarge.
   */
  scaleChoices(scale: ScalePolicy, only: boolean): readonly string[] {
    const offered = [trueScale, this.enlargedInSun(this.checkSunCentred([...this.bodies.keys()])) ? solarSystemScale : readableScale];
    const second = scale.id === readableScale.id ? [trueScale] : offered.filter((other) => other.id !== scale.id);
    return only ? [scale.id] : [scale.id, ...second.map((other) => other.id)];
  }

  visualOverrides(): Pick<ExperienceDefinition, "visualOverrides"> {
    return visualOverridesEntry(this.shape);
  }

  /** How far a label shows, for bodies and paths alike: the item's own `labelReachEarthRadii` if given, else the shared rule: a Sun-centred scene, or one that fits the zoom-out to an orbit (`fitOrbit`, whose limit changes with the canvas), sets no limit; otherwise the camera reach, at least 500. */
  labelReach(id: string, sunCentred: boolean, camera: LabelCamera): { readonly labelMaxDistance?: number } {
    const own = this.labelReaches.get(id);
    if (own !== undefined) return { labelMaxDistance: own };
    return sunCentred || camera.fitted !== undefined ? {} : { labelMaxDistance: Math.max(500, camera.reachEarthRadii ?? 0) };
  }

  /** The shell item of a body: from the catalogue, with the scene's own words, look and label setting. Label reach is `labelReachEarthRadii`. */
  bodyObject(body: BodyRef, ids: readonly BodyId[], sunCentred: boolean, camera: LabelCamera): ExperienceObject {
    const card = this.cards.get(body.id);
    const sources = card?.sources;
    const base = this.catalogue.get(body.id).definition.accuracy.position;
    const own = { labelPriority: card?.labelPriority ?? 100 - ids.indexOf(body.id), ...(card?.listed === undefined ? {} : { listed: card.listed }), ...(card?.facts === undefined ? {} : { facts: card.facts }), ...(sources === undefined ? {} : { provenance: withSources(base, sources) }), ...this.labelReach(body.id, sunCentred, camera), ...(this.shape.get(body.id)?.showLabel === undefined ? {} : { showLabel: this.shape.get(body.id)!.showLabel }), ...(this.notes.has(body.id) ? { description: this.notes.get(body.id) } : {}), ...(this.shown.has(body.id) ? { shownDuring: this.shown.get(body.id) } : {}), ...this.looks.get(body.id) };
    return { ...catalogueItem(body.id, own, this.catalogue), label: body.label };
  }
}
