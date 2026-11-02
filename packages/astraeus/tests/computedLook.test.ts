// @vitest-environment happy-dom
// The look lock (O-055 repair of I-140). The real App is rendered per layout, bundle order and definition with every fold and panel open, and every element's
// computed style (the properties in PROPS) is compared with the checked-in baseline `tests/fixtures/computed-look.baseline.json`. A stylesheet change that flips any
// cascade winner (a specificity shift, a source-order shift, a `:not()` subject a static model would miss) fails here with the element and property named.
// When a look change is intended, regenerate the baseline and review its diff:  npm run look:lock   (= LOOK_UPDATE=1 vitest run packages/astraeus/tests/computedLook.test.ts)
// Limits: happy-dom's cascade, not a browser's; no :hover/:focus states; media queries follow the window width the test pretends (matchMedia stub).
// Bundle orders: "site" is the built site's order (the shell sheets, then app/style.css); "mount" is the engine entry's (app/style.css first), see mount.ts / AstraeusScene.tsx.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { App } from "../src/app/App";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { syntheticListedDefinition } from "../src/synthetic/syntheticListedDefinition";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "fixtures", "computed-look.baseline.json");
const SRC = (file: string) => readFileSync(join(HERE, "..", "src", file), "utf8");
const REST = ["shell/TimelineBar.css", "shell/TopBar.css", "shell/controls.css", "shell/style.css", "shell/phone.css", "shell/embedded.css"];
const ORDERS = { site: [...REST, "app/style.css"], mount: ["app/style.css", ...REST] } as const;
const DEFS = { synthetic: syntheticDefinition, listed: syntheticListedDefinition } as const;
const LAYOUTS = [
  { name: "desktop", phone: false, embedded: false },
  { name: "phone", phone: true, embedded: false },
  { name: "embedded-desktop", phone: false, embedded: true },
  { name: "embedded-phone", phone: true, embedded: true },
];
const PROPS = [
  "display", "position", "top", "right", "bottom", "left", "width", "height", "min-height", "max-height", "min-width", "max-width",
  "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "text-align", "white-space", "color",
  "background-color", "background-image", "border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-left-width",
  "border-top-left-radius", "box-shadow", "opacity", "visibility", "z-index", "overflow", "gap", "flex-direction", "flex-wrap", "justify-content",
  "align-items", "grid-template-columns", "transform", "pointer-events", "cursor", "box-sizing", "inset", "isolation", "color-scheme", "accent-color",
];

/** `styles` are the distinct style rows, `keysets` the distinct element-key lists; a scenario names a keyset and gives, per element, its index into `styles`. */
interface Baseline { readonly props: readonly string[]; readonly styles: readonly string[]; readonly keysets: readonly (readonly string[])[]; readonly scenarios: Record<string, { readonly keys: number; readonly rows: readonly number[] }> }

let root: Root | undefined;
let host: HTMLElement | undefined;
let sheet: HTMLStyleElement | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); host?.remove(); sheet?.remove(); root = undefined; host = undefined; sheet = undefined; });

async function settle(): Promise<void> {
  for (let tries = 0; tries < 100 && (document.querySelector(".developer-loading") !== null || tries < 2); tries += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

/** Renders the App into <div id="app"> and opens every fold, panel and switch the sheets style. */
async function render(phone: boolean, embedded: boolean, definition: ExperienceDefinition): Promise<void> {
  pretendScreen({ phone, embedded });
  host = document.createElement("div");
  host.id = "app";
  document.body.append(host);
  root = createRoot(host);
  await act(async () => { root!.render(createElement(App, { definition, address: true, developerTools: true })); });
  const press = (el: Element | null) => { if (el) act(() => { (el as HTMLElement).click(); }); };
  press(host.querySelector('button[aria-label="Developer mode"]'));
  await settle();
  for (let pass = 0; pass < 3; pass += 1) for (const fold of host.querySelectorAll('.developer-tools button[aria-expanded="false"]')) press(fold);
  await settle();
  press(host.querySelector(".object-info-toggle"));
  if (phone) press(host.querySelector("button.controls-pill"));
  await settle();
  for (let pass = 0; pass < 3; pass += 1) { for (const b of host.querySelectorAll('button[aria-expanded="false"]:not(.controls-pill):not(.object-info-toggle)')) press(b); await settle(); }
}

const describeEl = (el: Element): string => {
  const parts: string[] = [];
  for (let up: Element | null = el; up && up !== document.body && parts.length < 4; up = up.parentElement) parts.unshift(`${up.tagName.toLowerCase()}${up.classList.length ? `.${[...up.classList].join(".")}` : ""}`);
  return parts.join(" > ");
};

/** Every element's computed style under the given sheets, keyed by position and ancestry, each row the PROPS values joined by a separator no value contains. */
function snapshot(css: string): Map<string, string> {
  sheet?.remove();
  sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  const out = new Map<string, string>();
  [document.documentElement, document.body, ...host!.querySelectorAll("*")].forEach((el, index) => {
    const style = getComputedStyle(el);
    out.set(`${index} ${describeEl(el)}`, PROPS.map((p) => style.getPropertyValue(p)).join("␟"));
  });
  return out;
}

const scenarios = LAYOUTS.flatMap((layout) => (Object.keys(ORDERS) as (keyof typeof ORDERS)[]).flatMap((order) => (Object.keys(DEFS) as (keyof typeof DEFS)[]).map((def) => ({ layout, order, def, id: `${layout.name} / ${order} order / ${def}` }))));
const update = process.env.LOOK_UPDATE === "1";
const captured: Record<string, Map<string, string>> = {};

describe("look lock: every element's computed style matches the checked-in baseline", () => {
  it.each(scenarios)("$id", { timeout: 30_000 }, async ({ layout, order, def, id }) => {
    await render(layout.phone, layout.embedded, DEFS[def]);
    const now = snapshot(ORDERS[order].map(SRC).join("\n"));
    expect(now.size).toBeGreaterThan(100);
    // The Developer drawer must be open with a nested fold, so the `:not()` subject case (I-140) is in the lock.
    if (def === "synthetic") expect([...now.keys()].some((k) => k.includes("collapsible-nested"))).toBe(true);
    if (update) { captured[id] = now; return; }
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Baseline;
    expect(baseline.props).toEqual(PROPS);
    const locked = baseline.scenarios[id];
    expect(locked, `no baseline for ${id}; run npm run look:lock`).toBeDefined();
    const keys = baseline.keysets[locked!.keys]!;
    const lockedRows = new Map(keys.map((key, i) => [key, locked!.rows[i]!] as const));
    const diffs: string[] = [];
    for (const [key, row] of now) {
      const index = lockedRows.get(key);
      if (index === undefined) { diffs.push(`${key} | element is new`); continue; }
      const was = baseline.styles[index]!.split("\u241f");
      row.split("\u241f").forEach((value, p) => { if (value !== was[p]) diffs.push(`${key} | ${PROPS[p]}: ${JSON.stringify(was[p])} -> ${JSON.stringify(value)}`); });
    }
    for (const key of keys) if (!now.has(key)) diffs.push(`${key} | element is gone`);
    expect(diffs, "computed look changed; if intended run npm run look:lock and review the baseline diff").toEqual([]);
  });

  it.runIf(update)("writes the baseline", () => {
    const styles: string[] = [];
    const seen = new Map<string, number>();
    const keysets: string[][] = [];
    const out: Record<string, { keys: number; rows: number[] }> = {};
    for (const { id } of scenarios) {
      const keys = [...captured[id]!.keys()];
      let keysIndex = keysets.findIndex((k) => k.length === keys.length && k.every((key, i) => key === keys[i]));
      if (keysIndex < 0) { keysIndex = keysets.length; keysets.push(keys); }
      out[id] = { keys: keysIndex, rows: [...captured[id]!.values()].map((row) => { if (!seen.has(row)) { seen.set(row, styles.length); styles.push(row); } return seen.get(row)!; }) };
    }
    const lines = Object.entries(out).map(([id, v]) => `    ${JSON.stringify(id)}: {"keys": ${v.keys}, "rows": ${JSON.stringify(v.rows)}}`);
    writeFileSync(BASELINE, `{\n  "props": ${JSON.stringify(PROPS)},\n  "styles": [\n${styles.map((s) => `    ${JSON.stringify(s)}`).join(",\n")}\n  ],\n  "keysets": [\n${keysets.map((k) => `    ${JSON.stringify(k)}`).join(",\n")}\n  ],\n  "scenarios": {\n${lines.join(",\n")}\n  }\n}\n`);
  });
});
