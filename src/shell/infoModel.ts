import type { Provenance, ProvenanceSourceType } from "../core/provenance";
import type { ExperienceConfig } from "./experience";
import { formatUtcTimestamp } from "./timelineModel";

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

export type InfoTarget = { readonly kind: "object"; readonly id: string } | { readonly kind: "event"; readonly id: string };

export interface InfoView {
  readonly target: InfoTarget;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
  /** Null only when the experience configured none for this object or event. */
  readonly provenance: ProvenanceView | null;
}

export function provenanceView(provenance: Provenance, knownLimitations: readonly string[] = []): ProvenanceView {
  return { ...provenance, status: PROVENANCE_STATUS[provenance.sourceType], knownLimitations };
}

/** What the info panel shows for a configured object or event, or null when the id is not configured. */
export function infoView(experience: ExperienceConfig, target: InfoTarget): InfoView | null {
  if (target.kind === "object") {
    const object = experience.objects.find((candidate) => candidate.id === target.id);
    if (object === undefined) return null;
    return {
      target,
      title: object.label,
      ...(object.description === undefined ? {} : { description: object.description }),
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
