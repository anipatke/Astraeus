// Shower stream text: the sentences, limitations and shell objects that describe the stream and its source.
import { createProvenance } from "../../core/provenance";
import type { ExperienceObject } from "../../shell/experience";
import { fetchOrbitsCommand, type MeasuredLoad, type MeasuredOrbitProvenance, type OrbitSet, type OrbitSetCounts } from "./measuredOrbits";
import { LABEL_PRIORITY, sourceLine, streamIdOf } from "./showerBasics";
import { citedSourceOf, type ShowerSettings } from "./showerSettings";

const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

/** The words the stream's panel must carry about what is measured, what is a drawing choice and what is not shown. */
export function orbitSetSentence(settings: ShowerSettings, set: OrbitSet, counts: OrbitSetCounts): string {
  const { rule } = settings.stream.quality;
  const { gmn } = settings.stream.sources;
  const shown = set === "reliable" ? counts.reliable : counts.all;
  const cut = `Qc (the maximum convergence angle between the stations that saw the meteor) at least ${rule.minConvergenceAngleDeg}° and the Vgeo sigma at most ${Math.round(rule.maxVelocityErrorFraction * 100)}% of Vgeo`;
  return `Orbit set shown: ${set === "reliable" ? "reliable orbits only" : "all orbits"} (${shown} of ${counts.all} bound orbits; the reliable set, ${cut}, has ${counts.reliable} and cuts ${counts.cut}). The cut is the published rule: ${rule.quote} (${rule.source.name}, ${rule.source.url}), mapped to GMN's own columns: ${gmn.ruleNote} GMN has no double-entry flag.`;
}

/** What the stream's panel says about the catalogue itself: the source, its licence and what was read. */
export function gmnSourceSentence(settings: ShowerSettings, provenance?: MeasuredOrbitProvenance): string {
  const gmn = settings.stream.sources.gmn;
  const read = provenance === undefined ? "" : ` Read from ${gmn.months.join(" and ")}: ${provenance.counts.members} records, ${provenance.counts.unbound} unbound orbits dropped, ${provenance.counts.kept} bound orbits kept.`;
  return `Source: ${gmn.source.name}. Licence ${gmn.licence} (${gmn.licenceUrl}), credit the Global Meteor Network.${read}`;
}

export function streamLimitations(settings: ShowerSettings, orbitSet?: { readonly set: OrbitSet; readonly counts: OrbitSetCounts; readonly provenance?: MeasuredOrbitProvenance }): readonly string[] {
  const { concentration } = settings.stream;
  const status = concentration.status === "cited" ? `cited; basis: ${concentration.basis}` : `illustrative defaults: ${concentration.basis}`;
  return [
    ...(orbitSet === undefined ? [] : [gmnSourceSentence(settings, orbitSet.provenance), orbitSetSentence(settings, orbitSet.set, orbitSet.counts)]),
    "The position of each dot along its orbit is illustrative: the records give each orbit's shape and tilt, not where the meteoroid is. The dots are spread evenly round their orbits.",
    `The clump near ${settings.parentBody} is a model: ${percent(concentration.fraction)} of the dots are placed within ±${concentration.widthDeg}° of ${settings.parentBody}'s orbital phase (${status}) The orbits differ in size, so the clump shows as a band at ${settings.parentBody}'s phase, not a blob on ${settings.parentBody}.`,
    "Parts of the stream that miss Earth are not shown: the database holds only meteoroids that reached Earth.",
    "The semi-major axis of a measured orbit is poorly determined (the speed error dominates it), so the sizes of the orbits are less certain than their shape and tilt.",
  ];
}

export function streamObject(settings: ShowerSettings, description: string, orbitSet: { readonly set: OrbitSet; readonly counts: OrbitSetCounts; readonly provenance?: MeasuredOrbitProvenance }): ExperienceObject {
  return {
    id: streamIdOf(settings),
    label: `${settings.label} stream`,
    color: settings.look.streamColor,
    labelPriority: LABEL_PRIORITY.stream,
    description,
    knownLimitations: streamLimitations(settings, orbitSet),
  };
}

/** What the stream's item says when its data is not on this machine: nothing is drawn and no stand-in is invented. */
export function absentStreamObject(settings: ShowerSettings, load: Exclude<MeasuredLoad, { kind: "loaded" }>, production: boolean = import.meta.env.PROD): ExperienceObject {
  const { months } = settings.stream.sources.gmn;
  const command = fetchOrbitsCommand(settings.stream.iauCode, months);
  const size = `the ${months.length} monthly files, about 100 MB each`;
  const why = production
    ? load.kind === "invalid"
      ? `The measured orbit file this build ships for the ${settings.label} cannot be used (${load.problem}), so no stream is drawn.`
      : `This build does not include measured orbits for the ${settings.label}, so no stream is drawn.`
    : load.kind === "invalid"
    ? `The fetched file cannot be used: ${load.problem}. Run "${command}" again.`
    : `The measured orbits are not fetched on this machine, so no stream is drawn. Run "${command}" to fetch them (${size} downloaded, kept out of the repository and out of public builds).`;
  return {
    id: streamIdOf(settings),
    label: `${settings.label} stream`,
    color: settings.look.streamColor,
    labelPriority: LABEL_PRIORITY.stream,
    description: `The ${settings.label} stream is drawn from measured meteoroid orbits. ${why}`,
    provenance: createProvenance({
      sourceType: "observed",
      sources: [sourceLine(citedSourceOf(settings))],
      accuracy: "Nothing is drawn, so nothing is claimed.",
      notes: why,
    }),
    knownLimitations: [why],
  };
}
