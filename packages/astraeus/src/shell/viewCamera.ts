// What the camera does when a view switch takes away the object it follows or focuses on (T-220, I-124). Pure: the shell applies the answer through its own camera request.
import type { ViewCameraRule } from "../app/views";
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { findCameraPreset } from "./objectModel";

/** The preset a view's rule asks for, or undefined for `stay` (no request: the pose is kept and following stops). The scene's start framing is its start preset, else the overview. */
export function presetForViewRule(rule: ViewCameraRule, experience: ExperienceConfig): ExperienceCameraPreset | undefined {
  if (rule.rule === "stay") return undefined;
  const framing = rule.framing;
  if (framing !== undefined) {
    const kind = "follow" in framing ? "follow" : "focus";
    const target = "follow" in framing ? framing.follow : framing.focus;
    return findCameraPreset(experience, kind, target) ?? { id: `${kind}-${target}`, label: `${kind === "follow" ? "Follow" : "Focus"} ${target}`, request: { kind, target } };
  }
  return experience.cameraPresets.find((preset) => preset.id === experience.startCameraPresetId) ?? findCameraPreset(experience, "overview");
}
