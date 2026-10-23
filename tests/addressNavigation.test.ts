// The entry's in-page switch: a switch pushes its address then rebuilds under the cover; back and forward rebuild without pushing; an overtaken rebuild mounts nothing (O-030 T-153).
import { describe, expect, it } from "vitest";
import { createAddressNavigation } from "../src/app/addressNavigation";
import { switchAddress } from "../src/shell/SwitchControl";

function harness() {
  const log: string[] = [];
  const mounted: string[] = [];
  const gates: Array<() => void> = [];
  const failures: unknown[] = [];
  let location = "https://x.test/app.html?experience=showers&shower=perseids&t=2026-08-12T00:00:00.000Z&view=abc";
  const navigation = createAddressNavigation({
    push: (address) => { location = address; log.push(`push ${address}`); },
    showCover: () => { log.push("cover"); },
    rebuild: async (isCurrent) => {
      const at = location;
      await new Promise<void>((resolve) => { gates.push(resolve); });
      if (isCurrent()) mounted.push(at);
    },
    fail: (error) => { failures.push(error); },
  });
  return { log, mounted, gates, failures, navigation, setLocation: (address: string) => { location = address; } };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("address navigation", () => {
  it("a switch pushes the address, shows the cover, then mounts the rebuilt page", async () => {
    const h = harness();
    const next = switchAddress("https://x.test/app.html?experience=showers&shower=perseids&t=2026-08-12T00:00:00.000Z&view=abc", "shower", "geminids");
    h.navigation.open(next);
    expect(h.log).toEqual([`push ${next}`, "cover"]);
    h.gates[0]!();
    await flush();
    expect(h.mounted).toEqual([next]);
    expect(new URL(next).searchParams.get("view")).toBeNull();
    expect(new URL(next).searchParams.get("t")).toBeNull();
  });

  it("a kept time travels in the address; the view is dropped", () => {
    const next = switchAddress("https://x.test/app.html?experience=planets&planet=jupiter&view=abc&t=2030-01-01T00:00:00.000Z", "planet", "saturn", ["t"], Date.UTC(2031, 0, 1, 12, 0, 0));
    const query = new URL(next).searchParams;
    expect(query.get("t")).toBe("2031-01-01T12:00:00.000Z");
    expect(query.get("view")).toBeNull();
  });

  it("back and forward rebuild without pushing", async () => {
    const h = harness();
    h.setLocation("https://x.test/app.html?experience=showers&shower=geminids");
    h.navigation.popped();
    expect(h.log).toEqual(["cover"]);
    h.gates[0]!();
    await flush();
    expect(h.mounted).toEqual(["https://x.test/app.html?experience=showers&shower=geminids"]);
  });

  it("an overtaken rebuild mounts nothing", async () => {
    const h = harness();
    h.navigation.open("https://x.test/a?shower=one");
    h.navigation.open("https://x.test/a?shower=two");
    h.gates[1]!();
    h.gates[0]!();
    await flush();
    expect(h.mounted).toEqual(["https://x.test/a?shower=two"]);
  });

  it("a failed rebuild is reported", async () => {
    const h = harness();
    const failing = createAddressNavigation({ push: () => undefined, showCover: () => undefined, rebuild: () => Promise.reject(new Error("no")), fail: (e) => { h.failures.push(e); } });
    failing.popped();
    await flush();
    expect(h.failures).toHaveLength(1);
  });
});
