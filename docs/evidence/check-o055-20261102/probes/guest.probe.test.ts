// @vitest-environment happy-dom
// C-144 probes for O-055 SC3, SC5, SC6, SC7 (two viewers on one host page). Only the 3D canvas is a stand-in (as in twoViewers.test.ts); mount, AstraeusScene,
// App, the shell and the data path are real. Run: npx vitest run --config docs/evidence/check-o055-20261102/vitest.probe.config.ts guest
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtimeOf = vi.hoisted(() => new WeakMap<Element, import("../../../../packages/astraeus/src/app/AstraeusScene").SceneRuntime>());
vi.mock("../../../../packages/astraeus/src/app/AstraeusScene", () => ({
  AstraeusScene: (props: { runtime: import("../../../../packages/astraeus/src/app/AstraeusScene").SceneRuntime }) =>
    createElement("div", { "data-testid": "scene", ref: (el: HTMLDivElement | null) => { if (el) runtimeOf.set(el, props.runtime); } }),
}));
vi.mock("../../../../packages/astraeus/src/assets/sky", async (orig) => ({ ...(await orig<typeof import("../../../../packages/astraeus/src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { PICTURES } from "astraeus-data";
import { earth, moon } from "../../../../packages/astraeus/src/api/bodies";
import { AstraeusScene } from "../../../../packages/astraeus/src/api/AstraeusScene";
import { mount } from "../../../../packages/astraeus/src/api/mount";
import { Scene } from "../../../../packages/astraeus/src/api/scene";
import type { DataSource } from "../../../../packages/astraeus/src/api/data";
import type { ViewerHandle } from "../../../../packages/astraeus/src/api/viewerHandle";
import { describeBody } from "../../../../packages/astraeus/src/app/bodyDraw";
import { catalogue } from "../../../../packages/astraeus/src/assets/catalogue";
import { milkyWayPicture } from "../../../../packages/astraeus/src/assets/sky";
import { trueScale } from "../../../../packages/astraeus/src/core/scalePolicy";
import { pretendScreen } from "../../../../packages/astraeus/tests/domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const REPO = process.cwd();
const SHEETS = ["shell/TimelineBar.css", "shell/TopBar.css", "shell/controls.css", "shell/style.css", "shell/phone.css", "shell/embedded.css", "app/style.css"];
const T0 = Date.parse("2026-03-01T00:00:00Z");
const DAY = 86_400_000;
const makeScene = () => new Scene().addBody(earth).addBody(moon).setTimeline({ start: T0, end: T0 + 10 * DAY, rate: 60, rates: [60, 3600] });

interface Viewer { readonly element: HTMLElement; readonly handle: ViewerHandle; unmount(): void; }
interface Open { readonly data?: readonly DataSource[]; readonly developerTools?: boolean; readonly element?: HTMLElement; }
const place = (o: Open) => { const el = o.element ?? document.createElement("div"); if (!el.isConnected) document.body.append(el); return el; };
const viaMount = async (o: Open = {}): Promise<Viewer> => {
  const element = place(o);
  const m = mount(element, makeScene(), { ...(o.data ? { data: o.data } : {}), ...(o.developerTools !== undefined ? { developerTools: o.developerTools } : {}) });
  await m.ready;
  return { element, handle: m, unmount: () => m.unmount() };
};
const viaReact = async (o: Open = {}): Promise<Viewer> => {
  const element = place(o);
  const root: Root = createRoot(element);
  const ref: { current: ViewerHandle | null } = { current: null };
  await new Promise<void>((resolve, reject) => flushSync(() => root.render(h(AstraeusScene, { scene: makeScene(), ref, ...(o.data ? { data: o.data } : {}), ...(o.developerTools !== undefined ? { developerTools: o.developerTools } : {}), onReady: () => resolve(), onError: reject }))));
  return { element, handle: ref.current!, unmount: () => flushSync(() => root.unmount()) };
};
const PATHS = [["mount", viaMount], ["AstraeusScene", viaReact]] as const;
const PAIRS = [["mount", viaMount, "mount", viaMount], ["AstraeusScene", viaReact, "AstraeusScene", viaReact], ["mount", viaMount, "AstraeusScene", viaReact], ["AstraeusScene", viaReact, "mount", viaMount]] as const;

let opened: Viewer[] = [];
let styles: HTMLStyleElement[] = [];
const css = (text: string) => { const s = document.createElement("style"); s.textContent = text; document.head.append(s); styles.push(s); return s; };
beforeEach(() => { pretendScreen({}); vi.stubGlobal("fetch", () => Promise.reject(new Error("offline"))); });
afterEach(() => { for (const v of opened) v.unmount(); opened = []; for (const s of styles) s.remove(); styles = []; document.body.innerHTML = ""; vi.unstubAllGlobals(); });

// ---------------------------------------------------------------- P-STYLE-2: a planted host page rule under both viewers (SC7)
const HOST_CSS = `:root { --ui-accent: rgb(1, 2, 3); --ui-muted: rgb(4, 5, 6); color-scheme: light; }
html { font-size: 20px; } body { font-family: Georgia, serif; color: rgb(10, 20, 30); background: rgb(250, 250, 250); margin: 8px; }
button { border: 3px dotted rgb(1, 2, 3); padding: 7px; font-family: Courier; } .hud, .info-panel, .shell-top, .timeline-bar, .ui-pill { color: rgb(9, 9, 9); padding: 5px; position: static; }`;
const PROPS = ["font-family", "font-size", "color", "background-color", "margin-top", "padding-top", "border-top-width", "border-top-style", "position", "color-scheme", "display", "height"];
const read = (els: Record<string, Element>) => Object.fromEntries(Object.entries(els).flatMap(([n, el]) => { const s = getComputedStyle(el); return PROPS.map((p) => [`${n} ${p}`, s.getPropertyValue(p)]); }));

describe.each(PAIRS)("P-STYLE-2 host rules (:root, html, body, button, generic classes) with %s then %s", (_a, first, _b, second) => {
  it("the host's own elements keep every computed value while both viewers are up and after both unmount; each viewer root keeps its own custom properties", async () => {
    css(HOST_CSS);
    const hostButton = document.createElement("button"); hostButton.textContent = "host";
    const hostHud = document.createElement("div"); hostHud.className = "hud";
    const hostInfo = document.createElement("aside"); hostInfo.className = "info-panel"; hostInfo.dataset.phone = "true";
    const hostPill = document.createElement("button"); hostPill.className = "ui-pill"; hostPill.setAttribute("aria-expanded", "true");
    document.body.append(hostButton, hostHud, hostInfo, hostPill);
    const els = { html: document.documentElement, body: document.body, button: hostButton, hud: hostHud, info: hostInfo, pill: hostPill };
    const before = read(els);
    // PROBE_OLD=1 swaps in the main-branch sheets: the sensitivity control (this case must then fail).
    const sheetText = (f: string) => process.env.PROBE_OLD === "1" ? readFileSync(join(REPO, "docs/evidence/check-o055-20261102/old-sheets", f.replace("/", "_")), "utf8") : readFileSync(join(REPO, "packages/astraeus/src", f), "utf8");
    const viewerSheets = css(SHEETS.map(sheetText).join("\n"));
    const a = await first({}); opened.push(a);
    const b = await second({}); opened.push(b);
    expect(read(els)).toEqual(before);
    for (const v of [a, b]) {
      const shell = v.element.querySelector(".astraeus-shell")!;
      expect(getComputedStyle(shell).getPropertyValue("--ui-accent").trim()).toBe("#fc6323");
      expect(getComputedStyle(shell).getPropertyValue("--ui-muted").trim()).toBe("#c7bdb3");
    }
    for (const v of opened) v.unmount(); opened = [];
    viewerSheets.remove();
    expect(read(els)).toEqual(before);
  });
});

// ---------------------------------------------------------------- P-BOX-1: a host element with its own position / overflow (SC7, T-256 containing block)
describe.each(PATHS)("P-BOX-1 containing block through %s", (_name, open) => {
  it.each([
    ["static, visible (no host style)", "", { position: "relative", overflow: "hidden" }],
    ["absolute from a host class", "host-abs", { position: "absolute", overflow: "hidden" }],
    ["fixed + auto from a host class", "host-fixed", { position: "fixed", overflow: "auto" }],
    ["sticky + clip from a host class", "host-sticky", { position: "sticky", overflow: "clip" }],
  ])("%s", async (_case, cls, expected) => {
    css(".host-abs { position: absolute; width: 400px; height: 300px; } .host-fixed { position: fixed; overflow: auto; } .host-sticky { position: sticky; overflow: clip; }");
    const element = document.createElement("div");
    if (cls) element.className = cls;
    const v = await open({ element }); opened.push(v);
    // AstraeusScene: the containing block is its own wrapper inside the host element; mount: the host element itself.
    const box = _name === "mount" ? element : (element.firstElementChild as HTMLElement);
    const s = getComputedStyle(box);
    if (_name === "mount") expect({ position: s.position, overflow: s.overflow }).toEqual(expected);
    else {
      expect({ position: s.position, overflow: s.overflow }).toEqual({ position: "relative", overflow: "hidden" });
      // the host element itself is never restyled by AstraeusScene (happy-dom reports an unset position as "")
      expect(getComputedStyle(element).position || "static").toBe(expected.position === "relative" ? "static" : expected.position);
      expect(element.style.position).toBe("");
    }
  });
});

// ---------------------------------------------------------------- P-PIC-1: two viewers with different pictures, both orders, plus different packages (SC3)
const pictured: DataSource = { name: "astraeus-data", provides: [], pictures: PICTURES };
const titanOnly: DataSource = { name: "titan-pack", provides: [], pictures: { titan: PICTURES.titan! } };
const drawn = (v: Viewer) => {
  const runtime = runtimeOf.get(v.element.querySelector("[data-testid=scene]")!)!;
  return {
    titan: describeBody(catalogue.get("titan"), trueScale, false, runtime.pictures).textureUrl,
    io: describeBody(catalogue.get("io"), trueScale, false, runtime.pictures).textureUrl,
    venusDesktop: describeBody(catalogue.get("venus"), trueScale, true, runtime.pictures).textureUrl,
    milkyWayTiles: milkyWayPicture(runtime.pictures ?? {}).tiles.length,
  };
};
const ALL = { titan: PICTURES.titan!.url, io: PICTURES.io!.url, venusDesktop: PICTURES["venus-8k"]!.url, milkyWayTiles: 1 };
const TITAN = { titan: PICTURES.titan!.url, io: undefined, venusDesktop: catalogue.get("venus").visual.texture!.url, milkyWayTiles: 0 };
describe.each(PAIRS)("P-PIC-1 %s (all pictures) beside %s (titan-only package)", (_a, first, _b, second) => {
  it.each([["all first", true], ["titan-only first", false]])("%s", async (_o, allFirst) => {
    pretendScreen({});
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    const x = allFirst ? await first({ data: [pictured] }) : await second({ data: [titanOnly] });
    opened.push(x);
    const y = allFirst ? await second({ data: [titanOnly] }) : await first({ data: [pictured] });
    opened.push(y);
    const [all, titan] = allFirst ? [x, y] : [y, x];
    expect(drawn(all)).toEqual(ALL);
    expect(drawn(titan)).toEqual(TITAN);
    // A third viewer with no package after both: nothing leaks to it.
    const z = await first({}); opened.push(z);
    expect(drawn(z)).toEqual({ titan: undefined, io: undefined, venusDesktop: catalogue.get("venus").visual.texture!.url, milkyWayTiles: 0 });
  });
});

// ---------------------------------------------------------------- P-ID-1: duplicate ids, developerTools on in both, phone and desktop (SC5)
describe.each(PAIRS)("P-ID-1 %s + %s, developerTools on in both", (_a, first, _b, second) => {
  it.each([["desktop", false], ["phone", true]])("%s: no id repeats, and every aria reference resolves inside its own viewer", async (_l, phone) => {
    pretendScreen({ phone });
    const a = await first({ developerTools: true }); opened.push(a);
    const b = await second({ developerTools: true }); opened.push(b);
    for (const v of [a, b]) {
      const click = (sel: string) => { const el = v.element.querySelector<HTMLElement>(sel); if (el) flushSync(() => el.click()); };
      if (phone) click("button.controls-pill");
      click('button[aria-label="Developer mode"]');
      await vi.waitFor(() => expect(v.element.querySelector(".developer-heading")).not.toBeNull());
      click(".object-info-toggle");
      for (let pass = 0; pass < 3; pass += 1) for (const fold of v.element.querySelectorAll<HTMLElement>('button[aria-expanded="false"]')) flushSync(() => fold.click());
    }
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(4);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const v of [a, b]) {
      const shell = v.element.querySelector(".astraeus-shell")!;
      for (const el of v.element.querySelectorAll("[aria-controls], [aria-labelledby], [aria-describedby], label[for]")) {
        for (const attr of ["aria-controls", "aria-labelledby", "aria-describedby", "for"]) {
          const value = el.getAttribute(attr);
          if (value === null) continue;
          for (const id of value.split(/\s+/)) {
            const target = document.getElementById(id);
            expect(target, `${attr}=${id}`).not.toBeNull();
            expect(shell.contains(target), `${attr}=${id} inside its own viewer`).toBe(true);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------- P-KEY-1: an Escape from each origin, two phone viewers (SC6)
describe.each(PAIRS)("P-KEY-1 Escape origins, %s + %s on a phone", (_a, first, _b, second) => {
  it("closes only the viewer it was pressed in; the bare page closes both; a host control, a host wrapper around a viewer, and a detached node close none", async () => {
    pretendScreen({ phone: true });
    const wrapper = document.createElement("section"); wrapper.tabIndex = 0; document.body.append(wrapper);
    const inner = document.createElement("div"); wrapper.append(inner);
    const a = await first({ element: inner }); opened.push(a);
    const b = await second({}); opened.push(b);
    const isOpen = (v: Viewer) => v.element.querySelector(".controls-drawer")!.getAttribute("data-open") === "true";
    const openBoth = () => { for (const v of [a, b]) if (!isOpen(v)) flushSync(() => v.element.querySelector<HTMLElement>("button.controls-pill")!.click()); };
    const esc = (target: EventTarget) => flushSync(() => { target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    const hostSelect = document.createElement("select"); document.body.append(hostSelect);
    openBoth();
    const rows: [string, EventTarget, [boolean, boolean]][] = [
      ["host select", hostSelect, [true, true]],
      ["host wrapper around viewer A", wrapper, [true, true]],
      ["inside A (a drawer button)", a.element.querySelector(".controls-drawer button") ?? a.element.querySelector("main")!, [false, true]],
      ["inside B (the root)", b.element.querySelector("main")!, [true, false]],
      ["document element", document.documentElement, [false, false]],
      ["document", document, [false, false]],
    ];
    for (const [name, target, expected] of rows) {
      openBoth();
      esc(target);
      expect([isOpen(a), isOpen(b)], name).toEqual(expected);
    }
    // A host listener that already handled Escape (defaultPrevented) closes neither.
    openBoth();
    const stop = (e: Event) => e.preventDefault();
    document.body.addEventListener("keydown", stop, { capture: true });
    esc(document.body);
    document.body.removeEventListener("keydown", stop, { capture: true });
    expect([isOpen(a), isOpen(b)]).toEqual([true, true]);
  });
});

// ---------------------------------------------------------------- P-STYLE-3: does a host rule reach INTO the viewer? (README "nothing leaks to or from your page")
describe.each(PATHS)("P-STYLE-3 host rules reaching into a viewer through %s", (_name, open) => {
  it("records which host properties a viewer part takes from generic host rules", async () => {
    css(SHEETS.map((f) => readFileSync(join(REPO, "packages/astraeus/src", f), "utf8")).join("\n"));
    const v = await open({}); opened.push(v);
    const part = v.element.querySelector<HTMLElement>(".astraeus-shell button")!;
    const props = ["letter-spacing", "text-decoration-line", "text-shadow", "outline-style", "word-spacing"];
    const plain = Object.fromEntries(props.map((p) => [p, getComputedStyle(part).getPropertyValue(p)]));
    css("button { letter-spacing: 3px; text-decoration: underline; text-shadow: rgb(255, 0, 0) 1px 1px 0px; word-spacing: 9px; }");
    const hosted = Object.fromEntries(props.map((p) => [p, getComputedStyle(part).getPropertyValue(p)]));
    // Expectation per the README sentence would be equality; record the truth instead.
    console.log(`P-STYLE-3 ${_name}: viewer button before host rule ${JSON.stringify(plain)}; after ${JSON.stringify(hosted)}`);
    expect(hosted).not.toEqual(plain);
  });
});
