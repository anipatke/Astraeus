import { readableScale, trueScale, type ScalePolicy } from "../core/scalePolicy";

export type ScaleId = string;

export interface ScaleChoice {
  readonly id: ScaleId;
  readonly label: string;
  readonly explanation: string;
}

/** Viewer wording for the engine's two scale policies. Neither changes what the readouts say. */
export const SCALE_CHOICES: readonly ScaleChoice[] = [
  {
    id: "true-scale",
    label: "True",
    explanation: "Distances and sizes are in real proportion. Bodies look tiny and far apart, and a spacecraft passing behind a body is hidden by it.",
  },
  {
    id: "readable-scale",
    label: "Readable",
    explanation: "Pulls bodies much closer together while keeping their true size, so the whole scene fits on screen. A spacecraft near a body can then fall inside it, so spacecraft are drawn on top.",
  },
];

const SOLAR_SYSTEM_CHOICE: ScaleChoice = {
  id: "solar-system",
  label: "Solar system",
  explanation: "Distances are true. Bodies are drawn larger than life so they can be seen at all; the info panel states each factor.",
};

const KNOWN_CHOICES: readonly ScaleChoice[] = [...SCALE_CHOICES, SOLAR_SYSTEM_CHOICE];

/** The choices an application offers, in its order, with the engine's wording. An unknown id is a mistake, not a fallback. */
export function scaleChoicesFor(ids: readonly ScaleId[]): readonly ScaleChoice[] {
  return ids.map((id) => {
    const choice = KNOWN_CHOICES.find((candidate) => candidate.id === id);
    if (choice === undefined) throw new RangeError(`unknown scale choice: ${id}`);
    return choice;
  });
}

export const SCALE_NOTE = "Only the picture changes. Positions, distances, speeds and times in the readouts are the same under both.";

/** The policy a choice selects: one the application supplies, else True or Readable (the default is True). */
export function scalePolicyFor(id: ScaleId, supplied: readonly ScalePolicy[] = []): ScalePolicy {
  const own = supplied.find((policy) => policy.id === id);
  if (own !== undefined) return own;
  return id === readableScale.id ? readableScale : trueScale;
}

/** The scale to start in: the address's, when this experience offers it, else the experience's first (True when it states none). */
export function startScaleFor(linked: ScaleId | undefined, offered: readonly ScaleId[] | undefined): ScaleId {
  const ids = offered ?? SCALE_CHOICES.map((choice) => choice.id);
  return linked !== undefined && ids.includes(linked) ? linked : offered?.[0] ?? "true-scale";
}
