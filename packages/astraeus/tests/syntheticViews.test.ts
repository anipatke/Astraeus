// The made-up views scene the browser check opens (O-051 T-221): its three views, their camera rules and the opening camera, on the definition the dev page mounts.
import { describe, expect, it } from "vitest";
import { syntheticViewsDefinition } from "../src/synthetic/syntheticViewsDefinition";

describe("syntheticViewsDefinition", () => {
  const views = syntheticViewsDefinition.views!;

  it("has three views in the bar, opening on the first", () => {
    expect(views.place).toBe("top-bar");
    expect(views.start).toBe("a");
    expect(views.views.map((view) => view.id)).toEqual(["a", "b", "both"]);
  });

  it("gives each view a different camera rule and shares Earth", () => {
    expect(views.views.map((view) => view.camera)).toEqual([{ rule: "stay" }, { rule: "start", framing: { follow: "probe-b" } }, { rule: "start", framing: { focus: "probe-a" } }]);
    for (const view of views.views) expect(view.objects.has("earth")).toBe(true);
  });

  it("splits the probes, events and panels between the views and shares one of each", () => {
    const [a, b, both] = views.views;
    const probes = (view: typeof a) => [...view!.objects].filter((id) => id.startsWith("probe")).sort();
    expect([probes(a), probes(b), probes(both)]).toEqual([["probe-a"], ["probe-b"], ["probe-a", "probe-b"]]);
    expect([...a!.events].sort()).toEqual(["event-a", "event-shared"]);
    expect([...both!.panels].sort()).toEqual(["panel-a", "panel-b", "panel-shared"]);
  });
});
