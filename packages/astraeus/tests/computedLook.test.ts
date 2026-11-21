// @vitest-environment happy-dom
// The look rules (O-055 repair of I-140; O-088 T-410 replaced the 302 KB baseline). The real App is rendered per layout and definition with every fold and panel open.
// (1) The two bundle orders give the same look: every element's computed style (PROPS) under the "site" order equals the "mount" order, keyed by ancestry path (I-194).
// (2) Named parts take the look tokens declared in look.css, including the nested fold heading (accent open, muted closed: the I-140 flip).
// Limits: happy-dom's cascade, not a browser's; no :hover/:focus states; media queries follow the window width the test pretends (matchMedia stub).
// Bundle orders: "site" is the built site's order (the shell sheets, then app/style.css); "mount" is the engine entry's (app/style.css first), see mount.ts / AstraeusScene.tsx.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (orig) => ({
  ...(await orig<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { App } from "../src/app/App";
import { syntheticDefinition } from "./synthetic/syntheticDefinition";
import { syntheticListedDefinition } from "./synthetic/syntheticListedDefinition";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = (file: string) => readFileSync(join(HERE, "..", "src", file), "utf8");
const REST = [
  "shell/look/look.css",
  "shell/areas/areas.css",
  "shell/parts/timeline/timeline.css",
  "shell/bar/bar.css",
  "shell/parts/controls.css",
  "shell/parts/parts.css",
  "shell/parts/phone.css",
  "shell/parts/embedded.css",
];
const ORDERS = { site: [...REST, "app/style.css"], mount: ["app/style.css", ...REST] } as const;
const DEFS = { synthetic: syntheticDefinition, listed: syntheticListedDefinition } as const;
const LAYOUTS = [
  { name: "desktop", phone: false, embedded: false },
  { name: "phone", phone: true, embedded: false },
  { name: "embedded-desktop", phone: false, embedded: true },
  { name: "embedded-phone", phone: true, embedded: true },
];
const PROPS = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "min-height",
  "max-height",
  "min-width",
  "max-width",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-transform",
  "text-align",
  "white-space",
  "color",
  "background-color",
  "background-image",
  "border-top-width",
  "border-top-style",
  "border-top-color",
  "border-bottom-width",
  "border-left-width",
  "border-top-left-radius",
  "box-shadow",
  "opacity",
  "visibility",
  "z-index",
  "overflow",
  "gap",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "grid-template-columns",
  "transform",
  "pointer-events",
  "cursor",
  "box-sizing",
  "inset",
  "isolation",
  "color-scheme",
  "accent-color",
];

let root: Root | undefined;
let host: HTMLElement | undefined;
let sheet: HTMLStyleElement | undefined;
afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  sheet?.remove();
  root = undefined;
  host = undefined;
  sheet = undefined;
});

async function settle(): Promise<void> {
  for (let tries = 0; tries < 100 && (document.querySelector(".developer-loading") !== null || tries < 2); tries += 1)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
}

/** Renders the App into <div id="app"> and opens every fold, panel and switch the sheets style. */
async function render(phone: boolean, embedded: boolean, definition: ExperienceDefinition): Promise<void> {
  pretendScreen({ phone, embedded });
  host = document.createElement("div");
  host.id = "app";
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(App, { definition, address: true, developerTools: true }));
  });
  const press = (el: Element | null) => {
    if (el)
      act(() => {
        (el as HTMLElement).click();
      });
  };
  press(host.querySelector('button[aria-label="Developer mode"]'));
  await settle();
  for (let pass = 0; pass < 3; pass += 1)
    for (const fold of host.querySelectorAll('.developer-tools button[aria-expanded="false"]')) press(fold);
  await settle();
  press(host.querySelector(".object-info-toggle"));
  if (phone) press(host.querySelector("button.bar-menu-button"));
  await settle();
  for (let pass = 0; pass < 3; pass += 1) {
    for (const b of host.querySelectorAll(
      'button[aria-expanded="false"]:not(.bar-menu-button):not(.object-info-toggle)',
    ))
      press(b);
    await settle();
  }
}

/** An element's key: its ancestry path with each step's position among its siblings, so a new element shifts only its own siblings' keys. */
const pathKey = (el: Element): string => {
  const steps: string[] = [];
  for (let up: Element | null = el; up && up !== document.documentElement; up = up.parentElement)
    steps.unshift(
      `${up.tagName.toLowerCase()}${up.classList.length ? `.${[...up.classList].join(".")}` : ""}[${up.parentElement ? [...up.parentElement.children].indexOf(up) : 0}]`,
    );
  return steps.join(">") || "html";
};
const LOOK_CSS = SRC("shell/look/look.css");
/** A look token's declared value in look.css, read from the stylesheet. */
const token = (name: string): string => {
  const match = new RegExp(`--astraeus-${name}:\\s*([^;]+);`).exec(LOOK_CSS);
  if (!match) throw new Error(`look.css declares no --astraeus-${name}`);
  return match[1]!.trim();
};
/** What a colour or size value computes to, by setting it on a probe element inside the viewer. */
function computed(property: "color" | "background-color" | "font-size", value: string): string {
  const probe = document.createElement("div");
  probe.style.setProperty(property, value);
  host!.querySelector(".astraeus-shell")!.append(probe);
  const out = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return out;
}

describe("look rules: the two bundle orders give the same look", () => {
  it.each(
    LAYOUTS.flatMap((layout) =>
      (Object.keys(DEFS) as (keyof typeof DEFS)[]).map((def) => ({ layout, def, id: `${layout.name} / ${def}` })),
    ),
  )("$id", { timeout: 30_000 }, async ({ layout, def }) => {
    await render(layout.phone, layout.embedded, DEFS[def]);
    const site = (() => {
      const m = new Map<string, string>();
      const css = ORDERS.site.map(SRC).join("\n");
      sheet?.remove();
      sheet = document.createElement("style");
      sheet.textContent = css;
      document.head.append(sheet);
      for (const el of [document.documentElement, document.body, ...host!.querySelectorAll("*")]) {
        const style = getComputedStyle(el);
        m.set(pathKey(el), PROPS.map((p) => style.getPropertyValue(p)).join("\u241f"));
      }
      return m;
    })();
    sheet!.textContent = ORDERS.mount.map(SRC).join("\n");
    expect(site.size).toBeGreaterThan(100);
    const diffs: string[] = [];
    for (const el of [document.documentElement, document.body, ...host!.querySelectorAll("*")]) {
      const style = getComputedStyle(el);
      const key = pathKey(el);
      const was = site.get(key)!.split("\u241f");
      PROPS.forEach((p, i) => {
        const value = style.getPropertyValue(p);
        if (value !== was[i])
          diffs.push(`${key} | ${p}: site ${JSON.stringify(was[i])} / mount ${JSON.stringify(value)}`);
      });
    }
    expect(diffs, "the bundle orders disagree: a rule wins only by source order").toEqual([]);
    // The Developer drawer is open with a nested fold, so the `:not()` subject case (I-140) is rendered.
    if (def === "synthetic") expect([...site.keys()].some((k) => k.includes("collapsible-nested"))).toBe(true);
  });
});

describe("look rules: named parts take their look tokens", () => {
  it(
    "nested fold heading is accent when open and muted when closed (I-140); controls and panels follow the tokens",
    { timeout: 30_000 },
    async () => {
      await render(false, false, syntheticDefinition);
      sheet = document.createElement("style");
      sheet.textContent = ORDERS.site.map(SRC).join("\n");
      document.head.append(sheet);
      const nested = [...host!.querySelectorAll<HTMLElement>(".collapsible-nested .collapsible-toggle")];
      expect(nested.length).toBeGreaterThan(0);
      const toggle = nested[0]!;
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(getComputedStyle(toggle).color).toBe(computed("color", token("accent")));
      act(() => toggle.click());
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(getComputedStyle(toggle).color).toBe(computed("color", token("muted")));
      const barButton = host!.querySelector<HTMLElement>(".bar-ghost-text, .bar-ghost-icon");
      expect(barButton, "a plain top-bar button").not.toBeNull();
      expect(getComputedStyle(barButton!).color).toBe(computed("color", token("text")));
      const info = host!.querySelector<HTMLElement>(".object-info-toggle");
      expect(info, "the information toggle").not.toBeNull();
      expect(getComputedStyle(info!).color).toBe(computed("color", token("accent")));
    },
  );
});
