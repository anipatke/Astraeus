// What the demos' scenes hold, read the way a host reads them (`Scene.bodies`, `paths`, `groups`, `events`; O-059 T-272). These are the Apollo 11 and Perseids rows of the engine's experience contract tests,
// which moved to the engine on made-up definitions (packages/astraeus/tests/experiencesContract.test.ts and the other *Contract files): what is left to say about a real demo is what it mounts.
import { describe, expect, it } from "vitest";
import type { Scene } from "astraeus";
import { buildApollo11Scene } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import { buildShowerScene } from "astraeus-demo-showers/experiences/showers/showerScene";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import { madeUpOrbits } from "astraeus-demo-showers/tests/helpers/measuredOrbits";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";

const settings = parseShowerSettings(perseidsFile);
const perseids: Scene = buildShowerScene(settings, { kind: "loaded", orbits: madeUpOrbits(7, 50) });
const ids = (scene: Scene): string[] => scene.bodies.map((body) => body.id);

describe("Apollo 11", () => {
  const apollo = buildApollo11Scene();

  it("mounts the Earth and the Moon, centred on Earth, with its spacecraft as paths and events of its own", () => {
    expect(ids(apollo)).toEqual(["earth", "moon"]);
    expect(apollo.paths.length).toBeGreaterThan(0);
    expect(apollo.events.length).toBeGreaterThan(0);
  });

  it("leaves the Perseids' objects out", () => {
    expect([...ids(apollo), ...apollo.paths.map((path) => path.id), ...apollo.groups.map((group) => group.id)].join(" ")).not.toMatch(/perseid|swift-tuttle/i);
  });
});

describe("Perseids in the Sun-centred composition", () => {
  it("mounts the Sun, Earth, the planets and the comet about the Sun, with no Moon anywhere", () => {
    expect(ids(perseids)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", "swift-tuttle"]);
    expect(perseids.groups.map((group) => group.id)).toContain(`${settings.id}-stream`);
    expect([...ids(perseids), ...perseids.paths.map((path) => path.id), ...perseids.groups.map((group) => group.id)]).not.toContain("moon");
  });

  it("lists the Sun and the stream in the Object list, and mounts nothing of Apollo's", () => {
    expect(perseids.bodies.find((body) => body.id === "sun")?.listed).toBe(true);
    expect(perseids.groups.map((group) => group.label).join(" ")).toContain("Perseids");
    expect(ids(perseids).join(" ")).not.toMatch(/columbia|eagle|apollo/i);
  });

  it("leaves Geminids-style settings to the same builder", () => {
    const other = buildShowerScene(settings, { kind: "loaded", orbits: madeUpOrbits(7, 50) });
    expect(ids(other)).toEqual(ids(perseids));
  });
});
