import type { Provenance, ProvenanceSourceType } from "../core/provenance";
import type { ExperienceConfig } from "./experience";
import { provenanceAt, rateAt } from "../core/timeWindow";
import { findFeature } from "./bodyFeatures";
import { formatUtcTimestamp, formatWindowRate } from "./timelineModel";

/** The badge text for each provenance status. The status is always written, never shown by colour alone. */
export const PROVENANCE_STATUS: Readonly<Record<ProvenanceSourceType, string>> = {
  ephemeris: "Ephemeris",
  observed: "Observed",
  reconstructed: "Reconstructed",
  modelled: "Modelled",
  illustrative: "Illustrative",
};

export interface ProvenanceView extends Provenance {
  readonly status: string;
  readonly knownLimitations: readonly string[];
}

export type InfoTarget =
  | { readonly kind: "object"; readonly id: string }
  | { readonly kind: "event"; readonly id: string }
  | { readonly kind: "window"; readonly id: string }
  /** A tagged place on a body; `id` is its key (`<body>:<place>`). */
  | { readonly kind: "feature"; readonly id: string };

export interface InfoFact {
  readonly label: string;
  readonly value: string;
}

export interface InfoView {
  readonly target: InfoTarget;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
  /** Labelled values such as a window's start, end, peak and current rate. */
  readonly facts?: readonly InfoFact[];
  /** Null only when the experience configured none for this object or event. */
  readonly provenance: ProvenanceView | null;
}

export function provenanceView(provenance: Provenance, knownLimitations: readonly string[] = []): ProvenanceView {
  return { ...provenance, status: PROVENANCE_STATUS[provenance.sourceType], knownLimitations };
}

/**
 * What the info panel shows for a configured object, event or window, or null when the id is not configured.
 * A window's rate and source depend on `timeUtcMs`, the clock.
 */
export function infoView(experience: ExperienceConfig, target: InfoTarget, timeUtcMs?: number): InfoView | null {
  if (target.kind === "window") return windowInfo(experience, target, timeUtcMs);
  if (target.kind === "feature") return featureInfo(experience, target);
  if (target.kind === "object") return objectInfo(experience, target);
  return eventInfo(experience, target);
}

function windowInfo(experience: ExperienceConfig, target: InfoTarget, timeUtcMs?: number): InfoView | null {
  const window = experience.windows?.find((candidate) => candidate.id === target.id);
  if (window === undefined) return null;
  const rate = timeUtcMs === undefined ? null : rateAt(window, timeUtcMs);
  const source = (timeUtcMs === undefined ? null : provenanceAt(window, timeUtcMs)) ?? experience.eventProvenance;
  const facts: InfoFact[] = [
    { label: "Starts", value: formatUtcTimestamp(window.startUtcMs) },
    { label: "Ends", value: formatUtcTimestamp(window.endUtcMs) },
  ];
  if (window.peakUtcMs !== undefined) facts.push({ label: "Peak", value: formatUtcTimestamp(window.peakUtcMs) });
  if (window.rate !== undefined) {
    facts.push({ label: "Rate now", value: rate === null ? "Not available at this time" : formatWindowRate(rate, window.rate.unit) });
  }
  return { target, title: window.label, facts, provenance: source === undefined ? null : provenanceView(source) };
}

function featureInfo(experience: ExperienceConfig, target: InfoTarget): InfoView | null {
  const found = findFeature(experience.bodyFeatures, target.id);
  if (found === null) return null;
  const { set, feature } = found;
  return {
    target,
    title: feature.name,
    subtitle: `${feature.featureType} on ${set.bodyLabel}`,
    description: feature.description,
    ...(feature.details.length === 0 ? {} : { facts: feature.details }),
    provenance: provenanceView(set.provenance, set.knownLimitations),
  };
}

function objectInfo(experience: ExperienceConfig, target: InfoTarget): InfoView | null {
  const object = experience.objects.find((candidate) => candidate.id === target.id);
  if (object === undefined) return null;
  return {
    target,
    title: object.label,
    ...(object.description === undefined ? {} : { description: object.description }),
    ...(object.facts === undefined ? {} : { facts: object.facts }),
    provenance: object.provenance === undefined ? null : provenanceView(object.provenance, object.knownLimitations),
  };
}

function eventInfo(experience: ExperienceConfig, target: InfoTarget): InfoView | null {
  const event = experience.events.find((candidate) => candidate.id === target.id);
  if (event === undefined) return null;
  const source = experience.eventProvenanceById?.[event.id] ?? experience.eventProvenance;
  return {
    target,
    title: event.label,
    subtitle: formatUtcTimestamp(event.timeUtcMs),
    provenance: source === undefined ? null : provenanceView(source),
  };
}
