// @vitest-environment happy-dom
// The moon panel on the pretend page (O-038 T-146): the screen-level part of browser-moon-panel.mjs, on Jupiter's real moon list. The panel's model (counts, named first,
// search, facts) is in tests/moonFamilyPanel.test.ts; the focus flight, the lit dots in the scene and the overlap rules are the smoke check and the owner's look.
import { createElement, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { JUPITER_MOON_CATALOGUE } from "astraeus/assets/bodies/jupiterMoonCatalogue";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import { MoonFamilyPanel } from "astraeus/shell/MoonFamilyPanel";
import { moonFamilyListSummary, moonListDateText, splitNamed } from "astraeus/shell/moonFamilies";
import { $, change, mountShell, press, selectObject, type Mounted } from "astraeus/tests/domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const list = jupiterIoExplorer.experience.moonFamilies!;
const data = JUPITER_MOON_CATALOGUE;
const container = document.createElement("div");
const picked: string[] = [];
const lights: (string | null)[] = [];
let unmount = () => {};

function Host() {
  const [lit, setLit] = useState<string | null>(null);
  return createElement(MoonFamilyPanel, { list, highlightedFamily: lit, onHighlight: (id) => { lights.push(id); setLit(id); }, onSelectMoon: (id) => { picked.push(id); } });
}
function mount() {
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(createElement(Host)); });
  unmount = () => { act(() => root.unmount()); container.remove(); };
}
afterEach(() => { unmount(); picked.length = 0; lights.length = 0; });
const toggle = (fold: string) => $(container, `[data-fold-toggle="${fold}"]`);

describe("the moon panel", () => {
  it("lists every family in the data's order, each heading carrying its live count", () => {
    mount();
    const families = [...container.querySelectorAll<HTMLElement>("[data-moon-family]")];
    expect(families.map((el) => el.getAttribute("data-moon-family"))).toEqual(data.families.map((family) => family.id));
    for (const family of data.families.filter((f) => f.id !== list.featuredFamilyId)) {
      const count = data.moons.filter((moon) => moon.family === family.id).length;
      expect($(container, `[data-moon-family="${family.id}"] button`).textContent).toContain(String(count));
    }
  });

  it("states the total and the list date in its summary line", () => {
    mount();
    const summary = $(container, "[data-moon-summary]").getAttribute("data-moon-summary")!;
    expect(summary).toBe(moonFamilyListSummary(list));
    expect(summary).toContain(`${data.moons.length} moons`);
    expect(summary).toContain(moonListDateText(data.asOf));
  });

  it("shows the big four on top with four pictures", () => {
    mount();
    expect(container.querySelectorAll('[data-moon-family="galilean"] .moon-disc')).toHaveLength(4);
  });

  it("opens a family to its plain description, named moons first and the rest folded into a count", () => {
    mount();
    const carme = data.moons.filter((moon) => moon.family === "carme");
    const { named, unnamed } = splitNamed(list.families.find((f) => f.id === "carme")!.moons);
    expect(toggle("moons-carme").getAttribute("aria-expanded")).toBe("false");
    press(toggle("moons-carme"));
    expect(toggle("moons-carme").getAttribute("aria-expanded")).toBe("true");
    expect($(container, '[data-moon-family="carme"] .moon-note').textContent).toBe(data.families.find((f) => f.id === "carme")!.description);
    const rows = () => [...container.querySelectorAll('[data-moon-family="carme"] [data-moon]')].map((el) => el.getAttribute("data-moon"));
    expect(rows()).toEqual(named.map((moon) => moon.id));
    expect(toggle("moons-carme-unnamed").textContent).toContain(`+${carme.length - named.length} unnamed`);
    press(toggle("moons-carme-unnamed"));
    expect(rows()).toHaveLength(carme.length);
    expect(unnamed.length).toBe(carme.length - named.length);
  });

  it("lights a family when it opens, moves the light to another, and clears it when the lit one closes", () => {
    mount();
    const lit = () => $(container, "[data-highlight]").getAttribute("data-highlight");
    press(toggle("moons-carme"));
    expect(lit()).toBe("carme");
    press(toggle("moons-ananke"));
    expect(lit()).toBe("ananke");
    press(toggle("moons-ananke"));
    expect(lit()).toBe("");
    expect(lights).toEqual(["carme", "ananke", null]);
  });

  it("hands a pressed moon to the shell, which focuses it and opens its information", () => {
    mount();
    press(toggle("moons-himalia"));
    press($(container, '[data-moon="himalia"]'));
    press($(container, '[data-moon="europa"]'));
    expect(picked).toEqual(["himalia", "europa"]);
  });

  it("finds a moon by name and by designation as it is typed, and says when nothing matches", () => {
    mount();
    const search = $(container, "input.moon-search-input") as HTMLInputElement;
    const results = () => [...container.querySelectorAll(".moon-results [data-moon]")].map((el) => el.getAttribute("data-moon"));
    change(search, "Himal");
    expect(results()).toContain("himalia");
    change(search, "S/2003 J 19");
    expect(results()).toEqual(["s2003-j19"]);
    press($(container, '.moon-results [data-moon="s2003-j19"]'));
    expect(picked).toEqual(["s2003-j19"]);
    change(search, "zzzzqq");
    expect(results()).toEqual([]);
    expect($(container, ".moon-results").textContent).toContain("No moon matches");
  });
});

describe("the moons sheet and the information panel (browser-moon-panel M7)", () => {
  let shell: Mounted | undefined;
  afterEach(() => { shell?.unmount(); shell = undefined; });
  const sheetOpen = (m: Mounted) => $(m.container, "#moons-panel").getAttribute("data-open");

  it("draws the moon list after its on-demand load when the experience has moon families, and not otherwise (I-089)", async () => {
    shell = mountShell({ experience: jupiterIoExplorer.experience });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(shell.container.querySelector("[data-moon-summary]")).not.toBeNull();
    expect(shell.container.querySelector('[data-moon-family="galilean"]')).not.toBeNull();
    shell.unmount();
    shell = mountShell({ experience: { ...jupiterIoExplorer.experience, moonFamilies: undefined } });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(shell.container.querySelector("[data-moon-summary]")).toBeNull();
  });

  it("never show together on a wide screen: opening one closes the other", () => {
    shell = mountShell({ experience: jupiterIoExplorer.experience });
    const toggle = $(shell.container, ".moons-toggle");
    press(toggle);
    expect(sheetOpen(shell)).toBe("true");
    expect(shell.container.querySelector("#info-panel")).toBeNull();
    selectObject(shell.container, "io");
    expect(shell.container.querySelector("#info-panel")).not.toBeNull();
    expect(sheetOpen(shell)).toBe("false");
    press(toggle);
    expect(sheetOpen(shell)).toBe("true");
    expect(shell.container.querySelector("#info-panel")).toBeNull();
  });
});
