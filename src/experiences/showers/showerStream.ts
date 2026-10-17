import { createOrbAstronomyAdapter } from "../../core/astronomyAdapter";
import { createListedOrbitGroup } from "../../core/listedOrbitGroup";
import { createProvenance, type Provenance } from "../../core/provenance";
import { createOrbTwoBodyAdapter } from "../../core/twoBodyAdapter";
import type { GroupLayer } from "../../app/experienceDefinition";
import { orbitSetCounts, selectOrbits, type MeasuredOrbits, type OrbitSet } from "./measuredOrbits";
import { HOUR_MS, showerCatalogue, sourceLine, streamIdOf, timelineBoundsOf } from "./showerBasics";
import { citedSourceOf, type ShowerSettings } from "./showerSettings";
import { streamObject } from "./showerStreamText";

function measuredProvenance(settings: ShowerSettings, orbits: MeasuredOrbits, shown: number, set: OrbitSet): Provenance {
  const { provenance } = orbits;
  const { counts } = provenance;
  return createProvenance({
    sourceType: "observed",
    sources: [...(provenance.citations ?? [provenance.citation]), sourceLine(citedSourceOf(settings))],
    accuracy: "Orbit solutions from video meteor observations. The shape and tilt of each orbit are measured; its semi-major axis is the weakest element.",
    notes: `${provenance.database}, IAU shower ${provenance.iauCode}: ${counts.members} records, ${counts.unbound} unbound or incomplete records dropped, ${counts.kept} bound orbits in the file, ${shown} orbits drawn (${set === "reliable" ? "reliable set" : "all orbits"}). Fetched ${provenance.fetchedAt}.${provenance.licence === undefined ? "" : ` Licence ${provenance.licence}.`}`,
  });
}

/**
 * The stream as one group, centred on the Sun: one dot per measured orbit, on its own ellipse, with the dot's place along the orbit a
 * stated drawing choice. A stated share is clumped near the parent's orbital phase, a model.
 */
export function createStreamLayer(settings: ShowerSettings, all: MeasuredOrbits, set: OrbitSet = settings.stream.quality.default): GroupLayer {
  const catalogue = showerCatalogue(settings);
  const counts = orbitSetCounts(all, settings.stream.quality.rule);
  const orbits = selectOrbits(all, set, settings.stream.quality.rule);
  const { peakUtc } = settings.activity;
  const { concentration } = settings.stream;
  const adapter = createOrbAstronomyAdapter();
  const parent = catalogue.get(settings.parentBodyId);
  if (parent.source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const group = createListedOrbitGroup({
    id: streamIdOf(settings),
    center: "sun",
    plane: "ecliptic-j2000",
    members: orbits.members,
    phase: {
      referenceUtcMs: Date.parse(peakUtc),
      seed: settings.stream.seed,
      concentration: { around: parent.source.create(adapter), fraction: concentration.fraction, widthDeg: concentration.widthDeg },
    },
    bounds: timelineBoundsOf(settings),
    provenance: measuredProvenance(settings, all, orbits.members.length, set),
  }, createOrbTwoBodyAdapter());
  const description = `${group.count} measured meteoroid orbits of the ${settings.label}, each drawn as one dot (${orbits.provenance.database}). The orbits' shapes and tilts are measured; where each dot sits along its orbit is illustrative, and the clump near ${settings.parentBody} is a model. One item stands for the whole stream; its focus point is the centroid of the dots.`;
  return {
    group,
    color: settings.look.streamColor,
    pointSizePx: settings.look.pointSizePx,
    refillAfterMs: settings.look.refillAfterHours * HOUR_MS,
    ...(settings.look.refillSliceMs === undefined ? {} : { refillSliceMs: settings.look.refillSliceMs }),
    object: streamObject(settings, description, { set, counts, provenance: all.provenance }),
  };
}
