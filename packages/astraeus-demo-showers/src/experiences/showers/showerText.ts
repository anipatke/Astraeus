// Shower text: the sentences that describe the stream, its source and what is not drawn.
import { fetchOrbitsCommand, type MeasuredLoad, type MeasuredOrbitProvenance, type OrbitSetCounts } from "./measuredOrbits";
import { citedSourceOf, type ShowerSettings } from "./showerSettings";

/** The words the stream's card carries about which orbits are drawn (all of them) and the published quality rule, with the counts it gives. */
export function orbitCountsSentence(settings: ShowerSettings, counts: OrbitSetCounts, provenance?: MeasuredOrbitProvenance): string {
  const { rule } = settings.stream.quality;
  const { gmn } = settings.stream.sources;
  const published = `The cut is the published rule: ${rule.quote} (${rule.source.name}, ${rule.source.url}), mapped to GMN's own columns: ${gmn.ruleNote} GMN has no double-entry flag.`;
  if (counts.reliable === null || counts.cut === null) {
    // The shipped file carries no per-orbit quality: every bound orbit is drawn, and the published counts are quoted from the file's header.
    const quoted = provenance?.shipped?.qualityCounts;
    return `Orbit set shown: all orbits (${counts.all} bound orbits). This file carries no per-orbit quality columns, so it cannot be cut to a reliable set.${quoted === undefined ? "" : ` ${quoted}`} ${published}`;
  }
  const cut = `Qc (the maximum convergence angle between the stations that saw the meteor) at least ${rule.minConvergenceAngleDeg}° and the Vgeo sigma at most ${Math.round(rule.maxVelocityErrorFraction * 100)}% of Vgeo`;
  return `Orbit set shown: all orbits (${counts.all} bound orbits; the reliable set, ${cut}, has ${counts.reliable} and cuts ${counts.cut}). ${published}`;
}

/** What the stream's card says about the catalogue itself: the source, its licence and what was read. */
export function gmnSourceSentence(settings: ShowerSettings, provenance?: MeasuredOrbitProvenance): string {
  const gmn = settings.stream.sources.gmn;
  const read = provenance === undefined ? "" : ` Read from ${gmn.months.join(" and ")}: ${provenance.counts.members} records, ${provenance.counts.unbound} unbound orbits dropped, ${provenance.counts.kept} bound orbits kept.`;
  return `Source: ${gmn.source.name}. Licence ${gmn.licence} (${gmn.licenceUrl}), credit the Global Meteor Network.${read}`;
}

/**
 * The stream's own known limits, shown first on its card (the group adds its placement, clump and motion limits after them): the orbit counts and the
 * published rule, what the database cannot show, how well the orbit sizes are known, and the basis of the clump when there is one.
 */
export function streamLimitations(settings: ShowerSettings, counts?: OrbitSetCounts, provenance?: MeasuredOrbitProvenance): readonly string[] {
  const { concentration } = settings.stream;
  const status = concentration.status === "cited" ? `cited; basis: ${concentration.basis}` : `illustrative defaults: ${concentration.basis}`;
  return [
    // The source, licence and counts are in the provenance (sources and notes), not repeated here.
    ...(counts === undefined ? [] : [orbitCountsSentence(settings, counts, provenance)]),
    "Parts of the stream that miss Earth are not shown: the database holds only meteoroids that reached Earth.",
    "The semi-major axis of a measured orbit is poorly determined (the speed error dominates it), so the sizes of the orbits are less certain than their shape and tilt.",
    ...(concentration.fraction > 0 ? [`Basis of the clump near ${settings.parentBody}: the dots are placed within ±${concentration.widthDeg}° of ${settings.parentBody}'s orbital phase (${status}) The orbits differ in size, so the clump shows as a band at ${settings.parentBody}'s phase, not a blob on ${settings.parentBody}.`] : []),
  ];
}

/** The radiant as the stream's card words it: right ascension and declination, the frame, and the cited source. */
export function radiantSentence(settings: ShowerSettings): string {
  const { raDeg, decDeg, equinox, source } = settings.radiant;
  return `Published radiant (where the meteors seem to come from): RA ${raDeg.toFixed(1)}°, Dec ${decDeg < 0 ? "−" : "+"}${Math.abs(decDeg).toFixed(1)}° (${equinox}), from ${source.name}.`;
}

/** What the scene says when the stream's data is not on this machine: nothing is drawn and no stand-in is invented. */
export function absentStreamNotice(settings: ShowerSettings, load: Exclude<MeasuredLoad, { kind: "loaded" }>, production: boolean): string {
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
  return `The ${settings.label} stream is drawn from measured meteoroid orbits. ${why} (Cited: ${citedSourceOf(settings).name}.)`;
}
