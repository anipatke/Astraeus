import { describe, expect, it } from "vitest";
import { anchorLabelsOf } from "../src/app/mission";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";

// The made-up scene's story panels and anchors exist only so the engine browser checks run without a demo (O-034 T-111); ARCH-01: nothing here names a real mission or dataset.
describe("the made-up scene's story panels", () => {
  const set = syntheticDefinition.experience.storyPanels;
  const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;

  it("holds two panels inside the timeline, in time order, each with a source line", () => {
    expect(set?.panels.map((panel) => panel.id)).toEqual(["marker-loop", "marker-late"]);
    for (const panel of set?.panels ?? []) {
      expect(panel.timeUtcMs).toBeGreaterThan(startUtcMs);
      expect(panel.timeUtcMs).toBeLessThan(endUtcMs);
      expect(panel.sources.length).toBeGreaterThan(0);
    }
  });

  it("ties the first panel to the survey marker and none to a real object", () => {
    expect(set?.panels[0]?.objectId).toBe("survey-marker");
    expect(set?.panels[1]?.objectId).toBeUndefined();
    expect(JSON.stringify(set)).not.toMatch(/apollo|perseid|geminid|jupiter|io\b|columbia/i);
  });

  it("is carried by the bare variant too", () => {
    expect(syntheticBareDefinition.experience.storyPanels).toBe(set);
  });
});

describe("the made-up scene's anchors", () => {
  const body = syntheticDefinition.trackedBodies![0]!;

  it("labels every anchor, in time order, inside the marker's path", () => {
    const labels = anchorLabelsOf(body);
    expect(labels).toHaveLength(12);
    expect(labels?.[0]).toBe("mark-1");
    expect(body.anchorTimesUtcMs).toEqual([...body.anchorTimesUtcMs].sort((a, b) => a - b));
    expect(body.anchorTimesUtcMs[0]).toBeGreaterThanOrEqual(body.trajectory.bounds.startUtcMs);
    expect(body.anchorTimesUtcMs.at(-1)).toBeLessThanOrEqual(body.trajectory.bounds.endUtcMs);
  });
});
