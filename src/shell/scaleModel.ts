import { readableScale, trueScale, type ScalePolicy } from "../core/scalePolicy";

export type ScaleId = ScalePolicy["id"];

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

export const SCALE_NOTE = "Only the picture changes. Positions, distances, speeds and times in the readouts are the same under both.";

/** The engine policy a choice selects. The policies themselves are unchanged. */
export function scalePolicyFor(id: ScaleId): ScalePolicy {
  return id === readableScale.id ? readableScale : trueScale;
}
