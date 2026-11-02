// @vitest-environment happy-dom
// C-144 probe P-STYLE-1 (O-055 SC7 "look unchanged"): an independent oracle for the builders' static specificity model. The real App (synthetic definition,
// Developer drawer open with every fold, info panel open) is rendered once per layout; then every element's computed style is read under the main-branch
// sheets (docs/evidence/check-o055-recheck-20261102/old-sheets/, `git show main:...`) and under the HEAD sheets, in both bundle orders the code really ships:
//   site order  (dist/assets/app-*.css, measured): TimelineBar, TopBar, controls, shell/style, phone, embedded, app/style
//   mount order (mount.ts / AstraeusScene.tsx import app/style.css before App): app/style first, then the same.
// The host element is <div id="app"> in both runs, so the old `#app` / `:root` page rules apply as they did. Limits: happy-dom's cascade, not a browser's;
// no :hover/:focus states; media queries follow happy-dom's window width.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../packages/astraeus/src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../../../../packages/astraeus/src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../../../../packages/astraeus/src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { App } from "../../../../packages/astraeus/src/app/App";
import { syntheticDefinition } from "../../../../packages/astraeus/src/synthetic/syntheticDefinition";
import { syntheticListedDefinition } from "../../../../packages/astraeus/src/synthetic/syntheticListedDefinition";
import type { ExperienceDefinition } from "../../../../packages/astraeus/src/app/experienceDefinition";
import { pretendScreen } from "../../../../packages/astraeus/tests/domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const REPO = process.cwd();
const EVIDENCE = join(REPO, "docs/evidence/check-o055-recheck-20261102");
const NEW = (file: string) => readFileSync(join(REPO, "packages/astraeus/src", file), "utf8");
const OLD = (file: string) => readFileSync(join(EVIDENCE, "old-sheets", file.replace("/", "_")), "utf8");
const REST = ["shell/TimelineBar.css", "shell/TopBar.css", "shell/controls.css", "shell/style.css", "shell/phone.css", "shell/embedded.css"];
const ORDERS = { site: [...REST, "app/style.css"], mount: ["app/style.css", ...REST] } as const;
const PROPS = [
  "display", "position", "top", "right", "bottom", "left", "width", "height", "min-height", "max-height", "min-width", "max-width",
  "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "text-align", "white-space", "color",
  "background-color", "background-image", "border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-left-width",
  "border-top-left-radius", "box-shadow", "opacity", "visibility", "z-index", "overflow", "gap", "flex-direction", "flex-wrap", "justify-content",
  "align-items", "grid-template-columns", "transform", "pointer-events", "cursor", "box-sizing", "inset", "isolation", "color-scheme", "accent-color",
];

let root: Root | undefined;
let host: HTMLElement | undefined;
let sheet: HTMLStyleElement | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); host?.remove(); sheet?.remove(); root = undefined; host = undefined; sheet = undefined; });

async function settle(): Promise<void> {
  for (let tries = 0; tries < 100 && (document.querySelector(".developer-loading") !== null || tries < 2); tries += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}

/** Renders the App into <div id="app"> and opens the parts the sheets style. */
async function render(phone: boolean, embedded: boolean, definition: ExperienceDefinition = syntheticDefinition, everything = false): Promise<void> {
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
  // "everything": also press every other collapsed control in the viewer (moons toggle, timeline list, switch panels, Sources folds), three passes.
  if (everything) for (let pass = 0; pass < 3; pass += 1) { for (const b of host.querySelectorAll('button[aria-expanded="false"]:not(.controls-pill):not(.object-info-toggle)')) press(b); await settle(); }
}

const describeEl = (el: Element): string => {
  const parts: string[] = [];
  for (let up: Element | null = el; up && up !== document.body && parts.length < 4; up = up.parentElement) parts.unshift(`${up.tagName.toLowerCase()}${up.classList.length ? `.${[...up.classList].join(".")}` : ""}`);
  return parts.join(" > ");
};

function snapshot(css: string): Map<string, Record<string, string>> {
  sheet?.remove();
  sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  const out = new Map<string, Record<string, string>>();
  const all = [document.documentElement, document.body, ...host!.querySelectorAll("*")];
  all.forEach((el, index) => {
    const style = getComputedStyle(el);
    const values: Record<string, string> = {};
    for (const p of PROPS) values[p] = style.getPropertyValue(p);
    out.set(`${index} ${describeEl(el)}`, values);
  });
  return out;
}

describe("P-STYLE-1 the environment can see the forms the sheets use", () => {
  it.each([
    [":where()", ".astraeus-shell :where(.x) b { padding: 9px }"],
    [":is()", ".astraeus-shell:is(main) b { padding: 9px }"],
    ["root attribute", ".astraeus-shell[data-phone=\"true\"] b { padding: 9px }"],
  ])("%s applies", (_name, css) => {
    host = document.createElement("main");
    host.className = "astraeus-shell";
    host.dataset.phone = "true";
    host.innerHTML = '<div class="x"><b>t</b></div>';
    document.body.append(host);
    sheet = document.createElement("style");
    sheet.textContent = css;
    document.head.append(sheet);
    expect(getComputedStyle(host.querySelector("b")!).paddingTop).toBe("9px");
  });
});

const LAYOUTS = [
  { name: "desktop", phone: false, embedded: false },
  { name: "phone", phone: true, embedded: false },
  { name: "embedded desktop", phone: false, embedded: true },
  { name: "embedded phone", phone: true, embedded: true },
];

const DEFS = { synthetic: syntheticDefinition, listed: syntheticListedDefinition } as const;
describe.each(LAYOUTS)("P-STYLE-1 computed styles, main sheets vs HEAD sheets: $name", (layout) => {
  it.each((Object.keys(ORDERS) as (keyof typeof ORDERS)[]).flatMap((o) => (Object.keys(DEFS) as (keyof typeof DEFS)[]).map((d) => [o, d] as const)))("%s order, %s definition, every part opened: every element's computed style is the same", async (order, def) => {
    await render(layout.phone, layout.embedded, DEFS[def], true);
    const files = ORDERS[order];
    const before = snapshot(files.map(OLD).join("\n"));
    const after = snapshot(files.map(NEW).join("\n"));
    const diffs: string[] = [];
    // Intended by T-256 (page rules removed; the root now paints its own background): html (index 0), body (1) and the root's background are not flips.
    const intended = (key: string, p: string) => key.startsWith("0 ") || key.startsWith("1 ") || (/main\.astraeus-shell$/.test(key) && p.startsWith("background"));
    for (const [key, values] of before) {
      const now = after.get(key)!;
      for (const p of PROPS) if (values[p] !== now[p] && !intended(key, p)) diffs.push(`${key} | ${p}: ${JSON.stringify(values[p])} -> ${JSON.stringify(now[p])}`);
    }
    writeFileSync(join(EVIDENCE, `cascade-${layout.name.replace(" ", "-")}-${order}-${def}.txt`), `${before.size} elements x ${PROPS.length} properties; ${diffs.length} differences\n${diffs.join("\n")}\n`);
    expect.soft(before.size).toBeGreaterThan(100);
    expect(diffs).toEqual([]);
  });
});
