// @vitest-environment happy-dom
// Every element id the viewer writes is made per viewer (O-055 T-254, API-03), and every reference to one (aria-controls, aria-labelledby, aria-describedby, htmlFor) names an
// element inside the same viewer. One table of the pairs the old fixed ids covered, checked through mount, AstraeusScene and App, on a wide screen and a phone, with the info panel,
// a story panel and the Developer drawer open; then the moon sheet (which needs a moon list) on the shell. The 3D canvas is a stand-in.
import { act, createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => h("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { App } from "../src/app/App";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { earth, moon } from "../src/api/bodies";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { MoonFamilyList } from "../src/shell/moonFamilies";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { mountShell, pretendScreen } from "./domSetup";

const REFERENCES = ["aria-controls", "aria-labelledby", "aria-describedby"] as const;

/** One pair: every element matching `from` has `attribute` naming an element that matches `to` and sits inside the same viewer. `need`: the contexts in which it must exist. */
interface Pair { readonly name: string; readonly from: string; readonly attribute: (typeof REFERENCES)[number] | "for"; readonly to: string; readonly need: readonly ("wide" | "phone")[] }
const APP_PAIRS: readonly Pair[] = [
  { name: "Info button opens the info panel", from: ".object-info-toggle", attribute: "aria-controls", to: ".info-panel", need: ["wide", "phone"] },
  { name: "info panel is named by its title", from: ".info-panel", attribute: "aria-labelledby", to: ".info-panel h2", need: ["wide", "phone"] },
  { name: "timeline event button opens the info panel", from: ".timeline-event-current", attribute: "aria-controls", to: ".info-panel", need: [] },
  { name: "Developer cog opens the Developer drawer", from: ".developer-mode-toggle", attribute: "aria-controls", to: ".developer-tools", need: ["wide", "phone"] },
  { name: "Developer section is named by its heading", from: ".developer-tools .hud-section", attribute: "aria-labelledby", to: ".developer-tools :is(h3, h4)", need: ["wide", "phone"] },
  { name: "setting group is named by its title", from: ".developer-tools .setting-group", attribute: "aria-labelledby", to: ".developer-tools h4", need: ["wide", "phone"] },
  { name: "fold toggle opens its body", from: ".developer-tools .collapsible-toggle", attribute: "aria-controls", to: ".developer-tools .collapsible-body", need: ["wide", "phone"] },
  { name: "story panel is named by its title", from: ".story-panel", attribute: "aria-labelledby", to: ".story-panel h2", need: ["wide", "phone"] },
  { name: "controls pill opens the controls drawer", from: ".controls-pill", attribute: "aria-controls", to: ".controls-drawer", need: ["phone"] },
  { name: "timeline handle opens the timeline drawer", from: ".drawer-handle-top", attribute: "aria-controls", to: ".timeline-drawer", need: ["phone"] },
];
const MOON_PAIRS: readonly Pair[] = [
  { name: "moons button opens the moon sheet", from: ".moons-toggle", attribute: "aria-controls", to: ".moons-sheet", need: ["wide"] },
  { name: "moon search is labelled", from: ".moon-search", attribute: "for", to: ".moon-search-input", need: ["wide", "phone"] },
  { name: "moon family fold opens its body", from: ".moon-family .collapsible-toggle", attribute: "aria-controls", to: ".moon-family .collapsible-body", need: ["wide", "phone"] },
];

const tokens = (value: string | null): string[] => (value ?? "").split(/\s+/).filter((token) => token !== "");
const refersTo = (element: Element, attribute: Pair["attribute"]): string[] => tokens(attribute === "for" ? (element as HTMLLabelElement).htmlFor : element.getAttribute(attribute));

/** Every pair resolves inside `shell`; the listed ones must exist in `context`. */
function expectPairs(shell: Element, pairs: readonly Pair[], context: "wide" | "phone"): void {
  for (const pair of pairs) {
    const sources = [...shell.querySelectorAll(pair.from)];
    if (pair.need.includes(context)) expect(sources.length, `${pair.name}: nothing matches ${pair.from}`).toBeGreaterThan(0);
    for (const source of sources) {
      const ids = refersTo(source, pair.attribute);
      expect(ids.length, `${pair.name}: ${pair.attribute} is empty`).toBeGreaterThan(0);
      for (const id of ids) {
        const target = document.getElementById(id);
        expect(target, `${pair.name}: no element has id ${id}`).not.toBeNull();
        expect(shell.contains(target), `${pair.name}: ${id} is outside this viewer`).toBe(true);
        expect(target!.matches(pair.to) || target!.closest(pair.to) !== null || shell.querySelector(pair.to) === target, `${pair.name}: ${id} is not ${pair.to}`).toBe(true);
      }
    }
  }
}

/** Whatever references anything in `shell` finds its target in `shell`, pair table or not. */
function expectEveryReference(shell: Element): void {
  const found = new Set<string>();
  for (const element of shell.querySelectorAll("*")) {
    const names = [...REFERENCES.flatMap((attribute) => tokens(element.getAttribute(attribute))), ...(element instanceof HTMLLabelElement ? tokens(element.htmlFor) : [])];
    for (const id of names) {
      found.add(id);
      const target = document.getElementById(id);
      // a closed toggle may name a panel that is not drawn while closed (the info panel); open, or drawn, it is inside this viewer
      if (target === null && element.getAttribute("aria-controls") === id && element.getAttribute("aria-expanded") === "false") continue;
      expect(target, `${element.tagName}.${element.className} names id ${id}`).not.toBeNull();
      expect(shell.contains(target)).toBe(true);
    }
  }
  expect(found.size).toBeGreaterThan(0);
}

const madeUp = { sourceType: "illustrative", sources: ["Made up for the test"], accuracy: "None claimed.", notes: "Made up." } as const;
const makeScene = () => new Scene().addBody(earth).addBody(moon)
  .addEvents([{ id: "event-a", label: "Made-up event", time: Date.parse("2026-03-01T00:00:00Z") }], { provenance: madeUp })
  .setTimeline({ start: Date.parse("2026-03-01T00:00:00Z"), end: Date.parse("2026-04-01T00:00:00Z"), rate: 60, rates: [60, 3600] })
  .addStoryPanels({ panels: [{ id: "panel-a", at: { utc: "2026-03-01T01:00:00Z" }, title: "About it", body: ["A made-up line."], badge: "illustrative" as const, sources: ["Made up for the test"] }] });
const PATHS: readonly { readonly name: string; open(host: HTMLElement): { readonly ready: Promise<void>; stop(): void } }[] = [
  {
    name: "mount",
    open(host) { const mounted = mount(host, makeScene(), { developerTools: true }); return { ready: mounted.ready, stop: () => mounted.unmount() }; },
  },
  {
    name: "AstraeusScene",
    open(host) {
      const root = createRoot(host);
      const ready = new Promise<void>((resolve, reject) => flushSync(() => root.render(h(AstraeusScene, { scene: makeScene(), developerTools: true, onReady: () => resolve(), onError: reject }))));
      return { ready, stop: () => flushSync(() => root.unmount()) };
    },
  },
  {
    name: "App",
    open(host) {
      const root = createRoot(host);
      flushSync(() => root.render(h(App, { definition: syntheticDefinition, developerTools: true })));
      return { ready: Promise.resolve(), stop: () => flushSync(() => root.unmount()) };
    },
  },
];

describe("every reference to an element id stays inside its viewer", () => {
  let host: HTMLElement;
  let stop = () => undefined as void;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false; window.localStorage.clear(); host = document.createElement("div"); document.body.append(host); });
  afterEach(() => { stop(); host.remove(); });

  for (const context of ["wide", "phone"] as const) {
    it.each(PATHS)(`$name, ${context}`, async (entry) => {
      pretendScreen({ phone: context === "phone" });
      const opened = entry.open(host);
      stop = opened.stop;
      await opened.ready;
      await vi.waitFor(() => expect(host.querySelector(".astraeus-shell")).not.toBeNull());
      const shell = host.querySelector(".astraeus-shell")!;
      if (context === "phone") shell.querySelector<HTMLButtonElement>(".controls-pill")!.click();
      shell.querySelector<HTMLButtonElement>(".developer-mode-toggle")!.click();
      await vi.waitFor(() => expect(shell.querySelector(".developer-heading")).not.toBeNull());
      shell.querySelector<HTMLButtonElement>(".object-info-toggle")!.click();
      await vi.waitFor(() => expect(shell.querySelector(".info-panel")).not.toBeNull());
      shell.querySelector<HTMLButtonElement>(".timeline-panel-marker")?.click();
      await vi.waitFor(() => expect(shell.querySelector(".story-panel")).not.toBeNull());
      for (let pass = 0; pass < 3; pass += 1) for (const fold of shell.querySelectorAll<HTMLButtonElement>('.developer-tools button[aria-expanded="false"]')) fold.click();
      await vi.waitFor(() => expect(shell.querySelector(".developer-tools .setting-group")).not.toBeNull());
      expectPairs(shell, APP_PAIRS, context);
      expectEveryReference(shell);
    });
  }
});

describe("the moon sheet and the moon list", () => {
  const moons: MoonFamilyList = {
    planetLabel: "Testworld",
    featuredFamilyId: "big",
    families: [
      { id: "big", label: "Big", description: "The big ones.", moons: [{ id: "m1", label: "Alpha", named: true }, { id: "m2", label: "Beta", named: true }] },
      { id: "small", label: "Small", description: "The small ones.", moons: [{ id: "m3", label: "Gamma", named: true }, { id: "m4", label: "S/2026 A 1", named: false }] },
    ],
  };
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });
  for (const context of ["wide", "phone"] as const) {
    it(context, async () => {
      const m = mountShell({ phone: context === "phone", experience: { ...syntheticDefinition.experience, moonFamilies: moons } });
      try {
        if (context === "wide") act(() => { m.container.querySelector<HTMLButtonElement>(".moons-toggle")!.click(); });
        await vi.waitFor(() => expect(m.container.querySelector(".moon-search-input")).not.toBeNull());
        const shell = m.container.querySelector(".astraeus-shell")!;
        for (let pass = 0; pass < 3; pass += 1) for (const fold of shell.querySelectorAll<HTMLButtonElement>('.moon-family button[aria-expanded="false"]')) act(() => { fold.click(); });
        expectPairs(shell, MOON_PAIRS, context);
      } finally { m.unmount(); }
    });
  }
});
