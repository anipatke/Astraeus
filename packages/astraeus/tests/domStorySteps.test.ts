// @vitest-environment happy-dom
// Story steps (O-066 T-300): panels with no moment show in the order added with Back and Next, with or without a timeline; the first step is open at the start only when
// no moment panel exists; steps never open from playback. Made-up experience and story (ARCH-03). The layout rules are read from the stylesheet (happy-dom has no layout).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import type { ExperienceConfig } from "../src/shell/experience";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";

let m: Mounted;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { m.unmount(); vi.useRealTimers(); });

const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
const step = (id: string, n: number, objectId?: string) => ({ id, step: n, title: `Step ${id}`, body: ["A made-up line."], details: [], provenance: made, ...(objectId === undefined ? {} : { objectId }) });
const steps = [step("one", 1), step("two", 2), step("three", 3)];
const base = syntheticDefinition.experience;
const withSteps = (extra: Partial<ExperienceConfig> = {}, keepMoments = false): ExperienceConfig => ({
  ...base,
  storyPanels: { ...base.storyPanels!, panels: keepMoments ? base.storyPanels!.panels : [], steps },
  ...extra,
});
const open = () => m.container.querySelector<HTMLElement>(".story-panel");
const openId = () => open()?.getAttribute("data-panel-id") ?? null;
const back = () => $(m.container, ".story-panel-back") as HTMLButtonElement;
const next = () => $(m.container, ".story-panel-next") as HTMLButtonElement;

describe("steps with no moment panel", () => {
  it("opens the first step when the viewer is ready, Back disabled, and counts the steps", () => {
    m = mountShell({ experience: withSteps() });
    expect(openId()).toBe("one");
    expect(back().disabled).toBe(true);
    expect(next().disabled).toBe(false);
    expect(open()?.textContent).toContain("Step 1 of 3");
  });

  it("Next and Back open the neighbouring step; Next is disabled on the last", () => {
    m = mountShell({ experience: withSteps() });
    press(next());
    expect(openId()).toBe("two");
    press(next());
    expect(openId()).toBe("three");
    expect(next().disabled).toBe(true);
    press(back());
    expect(openId()).toBe("two");
    expect(m.panelChanges.map(({ id, cause }) => `${id}:${cause}`)).toEqual(["one:visitor", "two:visitor", "three:visitor", "two:visitor"]);
  });

  it("works with no timeline", () => {
    m = mountShell({ experience: withSteps({ hideTimeline: true }) });
    expect(openId()).toBe("one");
    press(next());
    expect(openId()).toBe("two");
    expect(m.container.querySelector(".timeline-panel-marker")).toBeNull();
  });

  it("closes with Close and with Escape, and the host opens any step by id and reports the cause", () => {
    m = mountShell({ experience: withSteps() });
    press($(m.container, ".story-panel-close"));
    expect(open()).toBeNull();
    m.hostPanel("three");
    expect(openId()).toBe("three");
    m.hostPanel("");
    expect(open()).toBeNull();
    pressKey(document, "Escape");
    expect(m.panelChanges.map(({ id, cause }) => `${id}:${cause}`)).toEqual(["one:visitor", "null:visitor", "three:host", "null:host"]);
  });

  it("the last host call wins when two arrive together", () => {
    m = mountShell({ experience: withSteps() });
    m.hostPanel("");
    m.hostPanel("two");
    expect(openId()).toBe("two");
  });

  it("never opens a step from playback", () => {
    m = mountShell({ experience: withSteps() });
    press($(m.container, ".story-panel-close"));
    press($(m.container, ".timeline-play"));
    m.advance(5_000);
    expect(open()).toBeNull();
  });
});

describe("steps beside moment panels", () => {
  it("do not open at the start; the moment panels keep their markers and opening rule", () => {
    m = mountShell({ experience: withSteps({}, true) });
    expect(open()).toBeNull();
    expect(m.container.querySelectorAll(".timeline-panel-marker")).toHaveLength(base.storyPanels!.panels.length);
    m.hostPanel("two");
    expect(openId()).toBe("two");
    expect(back().disabled).toBe(false);
    m.requestPanel(base.storyPanels!.panels[0]!.id);
    expect(m.container.querySelector(".story-panel-back")).toBeNull();
  });
});

describe("phone layout rules (375x667 and 1280x720)", () => {
  const css = ["style", "phone"].map((name) => readFileSync(resolve(process.cwd(), `packages/astraeus/src/shell/${name}.css`), "utf8")).join("\n");
  it("gives Close, Back, Next and Continue 44 px touch targets on every screen", () => {
    const rule = /:where\(([^)]*story-panel-next[^)]*)\)\s*\{([^}]*)\}/.exec(css);
    expect(rule).not.toBeNull();
    for (const name of ["story-panel-close", "story-panel-back", "story-panel-next", "story-panel-continue"]) expect(rule![1]).toContain(`.${name}`);
    expect(rule![2]).toMatch(/min-width:\s*44px/);
    expect(rule![2]).toMatch(/min-height:\s*44px/);
  });
  it("keeps Back, count and Next in one row that cannot overlap: the count shrinks, the buttons do not", () => {
    expect(/\.story-panel-steps\s*\{[^}]*display:\s*flex[^}]*\}/.exec(css)).not.toBeNull();
    expect(/\.story-panel-step-count\s*\{[^}]*flex:\s*1 1 auto[^}]*min-width:\s*0/.exec(css)).not.toBeNull();
    expect(/\.story-panel-steps button\s*\{[^}]*flex:\s*0 0 auto/.exec(css)).not.toBeNull();
  });
  it("renders the same markup on a phone", () => {
    m = mountShell({ experience: withSteps(), phone: true });
    expect(openId()).toBe("one");
    expect(open()?.querySelectorAll(".story-panel-steps button")).toHaveLength(2);
  });
});

describe("a story panel's select follows the visitor-tap rule for the card (O-066, planner decision 2026-11-10)", () => {
  const objectId = base.objects[0]!.id;
  const card = () => m.container.querySelector(".info-panel");
  it("on a phone selects without opening the card, so Back and Next stay unobstructed", () => {
    m = mountShell({ experience: withSteps(), phone: true, selectRequest: { id: objectId, serial: 1, quiet: true } });
    expect(m.selected()).toBe(objectId);
    expect(card()).toBeNull();
    expect(openId()).toBe("one");
    expect(next().disabled).toBe(false);
  });
  it("on a wide screen opens the card", () => {
    m = mountShell({ experience: withSteps(), selectRequest: { id: objectId, serial: 1, quiet: true } });
    expect(m.selected()).toBe(objectId);
    expect(card()).not.toBeNull();
  });
  it("a host select (not quiet) opens the card on a phone too", () => {
    m = mountShell({ experience: withSteps(), phone: true, selectRequest: { id: objectId, serial: 1 } });
    expect(card()).not.toBeNull();
  });
});
