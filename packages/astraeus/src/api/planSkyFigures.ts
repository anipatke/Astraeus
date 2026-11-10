import { isCssColour, isFontFamily, LABEL_SIZE_LIMITS } from "../core/lookValues";
import { eqjUnit, type StarById } from "../assets/sky";
import { meanDirection, type EqjDirection, type SkyFigureLayer } from "../app/skyFigures";
import { SceneError } from "./errors";
import { frozenCopy } from "./frozenCopy";
import type { SkyFigureEnd, SkyFigureInput } from "./skyFigureInput";
import { frozenList, type SceneSkyFigureRead } from "./sceneReads";

const bad = (id: unknown, message: string): SceneError => new SceneError("bad-sky-figure", `addSkyFigures("${String(id)}"): ${message}`);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isPosition = (value: unknown): value is { raDeg: number; decDeg: number } => typeof value === "object" && value !== null && isNumber((value as { raDeg?: unknown }).raDeg) && isNumber((value as { decDeg?: unknown }).decDeg) && Math.abs((value as { decDeg: number }).decDeg) <= 90;
const isStar = (value: unknown): value is { star: number } => typeof value === "object" && value !== null && Number.isInteger((value as { star?: unknown }).star) && (value as { star: number }).star > 0;

function checkEnd(id: string, end: unknown, where: string): void {
  if (!isStar(end) && !isPosition(end)) throw bad(id, `${where} must be { star: <Hipparcos number> } or { raDeg, decDeg } with a declination within ±90, got ${JSON.stringify(end)}`);
}

/** Checks a figure's own colours, label font and label size. */
function checkLooks(id: string, figure: SkyFigureInput): void {
  if (figure.color !== undefined && !isCssColour(figure.color)) throw bad(id, `color must be a CSS colour such as "#8fb4ff", got ${JSON.stringify(figure.color)}`);
  if (figure.labelColor !== undefined && !isCssColour(figure.labelColor)) throw bad(id, `labelColor must be a CSS colour such as "#cfe0ff", got ${JSON.stringify(figure.labelColor)}`);
  if (figure.labelFont !== undefined && !isFontFamily(figure.labelFont)) throw bad(id, `labelFont must be a non-empty CSS font-family text, got ${JSON.stringify(figure.labelFont)}`);
  if (figure.labelSizePx !== undefined && !(isNumber(figure.labelSizePx) && figure.labelSizePx >= LABEL_SIZE_LIMITS.min && figure.labelSizePx <= LABEL_SIZE_LIMITS.max)) throw bad(id, `labelSizePx must be a number from ${LABEL_SIZE_LIMITS.min} to ${LABEL_SIZE_LIMITS.max}, got ${JSON.stringify(figure.labelSizePx)}`);
}

/** Checks one figure's shape; throws `bad-sky-figure` naming the field. */
function checkShape(figure: SkyFigureInput): void {
  if (typeof figure !== "object" || figure === null) throw bad(figure, "give a { id, label, segments } or { id, label, kind: \"boundary\", points } object");
  const { id, kind = "figure" } = figure;
  if (!isText(id)) throw bad(id, "id must be a non-empty text");
  if (!isText(figure.label)) throw bad(id, "label must be a non-empty text");
  if (kind !== "figure" && kind !== "boundary") throw bad(id, `kind must be "figure" or "boundary", got ${JSON.stringify(kind)}`);
  if (kind === "figure") {
    if (figure.points !== undefined) throw bad(id, "a figure has segments, not points (use kind: \"boundary\" for points)");
    if (!Array.isArray(figure.segments) || figure.segments.length === 0) throw bad(id, "a figure needs segments: a non-empty list of [end, end] pairs");
    figure.segments.forEach((pair, index) => {
      if (!Array.isArray(pair) || pair.length !== 2) throw bad(id, `segments[${index}] must be a pair [end, end]`);
      checkEnd(id, pair[0], `segments[${index}][0]`);
      checkEnd(id, pair[1], `segments[${index}][1]`);
    });
  } else {
    if (figure.segments !== undefined) throw bad(id, "a boundary has points, not segments");
    if (!Array.isArray(figure.points) || figure.points.length < 3) throw bad(id, "a boundary needs points: a closed loop of at least three { raDeg, decDeg }");
    figure.points.forEach((point, index) => { if (!isPosition(point)) throw bad(id, `points[${index}] must be { raDeg, decDeg } with a declination within ±90, got ${JSON.stringify(point)}`); });
  }
  if (figure.labelAt !== undefined && !isPosition(figure.labelAt)) throw bad(id, `labelAt must be { raDeg, decDeg } with a declination within ±90, got ${JSON.stringify(figure.labelAt)}`);
  checkLooks(id, figure);
}

const endsOf = (figure: SkyFigureInput): readonly SkyFigureEnd[] => (figure.segments ?? []).flat();

/** What a `Scene` has planned for sky figures, in the order added. */
export class SkyFigurePlan {
  readonly figures = new Map<string, SkyFigureInput>();

  constructor(private readonly taken: (id: string) => boolean) {}

  /** Checks every figure (shape, then ids against the scene and each other) and adds them all, or none. */
  add(figures: readonly SkyFigureInput[]): void {
    if (!Array.isArray(figures) || figures.length === 0) throw bad("", "give a non-empty list of figures");
    const copies = figures.map((figure) => { checkShape(figure); return frozenCopy(figure); });
    const seen = new Set<string>();
    for (const { id } of copies) {
      if (this.figures.has(id) || seen.has(id) || this.taken(id)) throw new SceneError("duplicate-id", `addSkyFigures("${id}"): that id is already in the scene`);
      seen.add(id);
    }
    for (const copy of copies) this.figures.set(copy.id, copy);
  }

  has(id: string): boolean { return this.figures.has(id); }

  /** The figures in the order added: id, label, kind. */
  reads(): readonly SceneSkyFigureRead[] {
    return frozenList([...this.figures.values()].map(({ id, label, kind = "figure" }): SceneSkyFigureRead => ({ id, label, kind })));
  }

  /** Whether any end names a catalogue star, so the star list is needed to place it. */
  get needsStars(): boolean { return [...this.figures.values()].some((figure) => endsOf(figure).some((end) => "star" in end)); }

  /** The drawable figures. `stars` finds a star by its Hipparcos number; a number it does not hold throws `unknown-star`. Called when the scene is built (the star list loads asynchronously, so not at the `addSkyFigures` call). */
  layers(stars: ReadonlyMap<number, StarById>): readonly SkyFigureLayer[] {
    const direction = (id: string, end: SkyFigureEnd): EqjDirection => {
      if ("star" in end) {
        const found = stars.get(end.star);
        if (found === undefined) throw new SceneError("unknown-star", `addSkyFigures("${id}"): star ${end.star} is not in the star list (Hipparcos numbers of stars of magnitude 6.5 or brighter)`);
        return found.direction;
      }
      return eqjUnit(end.raDeg, end.decDeg);
    };
    return [...this.figures.values()].map((figure): SkyFigureLayer => {
      const kind = figure.kind ?? "figure";
      const segments = kind === "figure"
        ? figure.segments!.map(([from, to]) => [direction(figure.id, from), direction(figure.id, to)] as const)
        : figure.points!.map((point, index) => [eqjUnit(point.raDeg, point.decDeg), eqjUnit(figure.points![(index + 1) % figure.points!.length]!.raDeg, figure.points![(index + 1) % figure.points!.length]!.decDeg)] as const);
      const labelAt = figure.labelAt === undefined ? meanDirection(segments.flatMap(([from, to]) => [from, to])) : eqjUnit(figure.labelAt.raDeg, figure.labelAt.decDeg);
      const own = (["color", "labelColor", "labelFont", "labelSizePx"] as const).filter((key) => figure[key] !== undefined);
      return { id: figure.id, label: figure.label, kind, segments, labelAt, ...Object.fromEntries(own.map((key) => [key, figure[key]])) };
    });
  }
}
