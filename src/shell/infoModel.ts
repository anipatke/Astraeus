import type { Provenance, ProvenanceSourceType } from "../core/provenance";
import type { ExperienceConfig } from "./experience";
import { provenanceAt, rateAt } from "../core/timeWindow";
import { formatUtcTimestamp, formatWindowRate } from "./timelineModel";

/** The badge text for each provenance status. The status is always written, never shown by colour alone. */
export const PROVENANCE_STATUS: Readonly<Record<ProvenanceSourceType, string>> = {
  ephemeris: "Ephemeris",
  observed: "Observed",
  reconstructed: "Reconstructed",
  illustrative: "Illustrative",
};

export interface ProvenanceView extends Provenance {
  readonly status: string;
  readonly knownLimitations: readonly string[];
}

export type InfoTarget =
  | { readonly kind: "object"; readonly id: string }
  | { readonly kind: "event"; readonly id: string }
  | { readonly kind: "window"; readonly id: string };

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
  if (target.kind === "window") {
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
  if (target.kind === "object") {
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
  const event = experience.events.find((candidate) => candidate.id === target.id);
  if (event === undefined) return null;
  return {
    target,
    title: event.label,
    subtitle: formatUtcTimestamp(event.timeUtcMs),
    provenance: experience.eventProvenance === undefined ? null : provenanceView(experience.eventProvenance),
  };
}
