// @vitest-environment happy-dom
// I-184: the browser driver against the phone bar's two forms that the planets-phone and look-out journeys met. (1) A long picker is drawn as the
// fit rule's compact native <select>, so the switch read and choice must handle it beside the buttons (markup as SwitchControl.tsx draws it). (2) On a phone the Developer cog sits in the
// closed menu drawer (hidden, so a role lookup finds nothing): the driver reveals it before reading or pressing it and leaves the menu as it was.
import { afterEach, describe, expect, it } from "vitest";
import { chooseSwitchOption, developerOpen, displaySwitchOn, displaySwitchPlaces, experienceSwitchState, FREE_POINT_PROBES, freeCanvasPoint, readSwitchGroup, switchPanelFit, switchShowsActive, toggleDeveloper, toggleDisplaySwitch } from "../tools/validate/driver.mjs";

type SwitchForm = "full" | "compact";
const OPTIONS = ["mercury", "venus", "earth", "jupiter"].map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1), active: value === "mercury" }));

/**
 * Draws the switch in the form given, as `SwitchControl.tsx` renders it (the site may not import the engine's source, ARCH-03): the buttons are a group carrying
 * `data-switch-param` with one `data-switch-value` button per option (pressed = active); the compact form is one `<select data-switch-param>` with plain options.
 */
function drawSwitch(form: SwitchForm): HTMLElement {
  document.body.innerHTML = form === "compact"
    ? `<select class="switch-compact" aria-label="Planet" data-closes-drawer="" data-switch-param="planet">${OPTIONS.map((o) => `<option value="${o.value}"${o.active ? " selected" : ""}>${o.label}</option>`).join("")}</select>`
    : `<section class="switch-control" role="group" aria-label="Planet" data-switch-param="planet">${OPTIONS.map((o) => `<button type="button" aria-pressed="${o.active}" data-switch-value="${o.value}"><span>${o.label}</span></button>`).join("")}</section>`;
  return document.querySelector("[data-switch-param]") as HTMLElement;
}

/** A stand-in page over the drawn switch: enough of Playwright for `experienceSwitchState` and `chooseSwitchOption`, recording how the choice was made. */
function switchPage(group: HTMLElement) {
  const made: string[] = [];
  const press = (value: string) => {
    if (group.tagName === "SELECT") (group as HTMLSelectElement).value = value;
    else group.querySelectorAll("[data-switch-value]").forEach((button) => button.setAttribute("aria-pressed", String(button.getAttribute("data-switch-value") === value)));
  };
  const groupLocator = {
    count: async () => 1,
    first: () => groupLocator,
    isVisible: async () => true,
    getAttribute: async (name: string) => group.getAttribute(name),
    evaluate: async <T>(fn: (element: HTMLElement) => T) => fn(group),
    selectOption: async (value: string) => { made.push(`select:${value}`); press(value); },
    locator: (selector: string) => ({ first: () => ({ click: async () => { const value = /data-switch-value="([^"]+)"/.exec(selector)![1]; made.push(`button:${value}`); press(value); } }) }),
  };
  const page = {
    locator: (selector: string) => (selector === "[data-switch-param]" ? groupLocator : { count: async () => 0 }),
    waitForFunction: async (fn: (arg: unknown) => boolean, arg: unknown) => { if (!fn(arg)) throw new Error("waitForFunction: never true"); },
    waitForURL: async () => undefined,
    waitForSelector: async () => undefined,
    getByRole: () => ({ waitFor: async () => undefined }),
  };
  return { page, made };
}

afterEach(() => { document.body.innerHTML = ""; });

describe("driver: the switch in both forms (I-184 case 1)", () => {
  it.each<SwitchForm>(["full", "compact"])("reads the options and the active one from the %s form", async (form) => {
    const group = drawSwitch(form);
    expect(readSwitchGroup(group).options.map((option: { value: string }) => option.value)).toEqual(["mercury", "venus", "earth", "jupiter"]);
    const { page } = switchPage(group);
    const state = (await experienceSwitchState(page))!;
    expect(state.param).toBe("planet");
    expect(state.compact).toBe(form === "compact");
    expect(state.options.find((option: { active: boolean }) => option.active)?.value).toBe("mercury");
  });
  it.each<[SwitchForm, string]>([["full", "button:jupiter"], ["compact", "select:jupiter"]])("chooses an option in the %s form the way that form takes it", async (form, how) => {
    const group = drawSwitch(form);
    const { page, made } = switchPage(group);
    await chooseSwitchOption(page, "jupiter");
    expect(made).toEqual([how]);
    expect(switchShowsActive("jupiter")).toBe(true);
    expect(readSwitchGroup(group).options.find((option: { active: boolean }) => option.active)?.value).toBe("jupiter");
  });
});

/** A stand-in phone page: the cog is reachable (visible, found by role) only while the menu drawer is open, and pressing it closes the drawer (`data-closes-drawer`). */
function phonePage() {
  const state = { menu: false, developer: false, menuOpenings: 0 };
  const hidden = () => { throw new Error("getByRole('button', { name: 'Developer mode' }): Timeout 30000ms exceeded (hidden in the closed menu)"); };
  const cog = {
    count: async () => 1,
    first: () => cog,
    isVisible: async () => state.menu,
    getAttribute: async (name: string) => (state.menu ? (name === "aria-pressed" ? String(state.developer) : null) : hidden()),
    click: async () => { if (!state.menu) hidden(); state.developer = !state.developer; state.menu = false; },
  };
  const menuButton = {
    count: async () => 1,
    getAttribute: async () => String(state.menu),
    click: async () => { state.menu = !state.menu; if (state.menu) state.menuOpenings += 1; },
  };
  const anything = { count: async () => 0, first: () => anything, waitFor: async () => undefined, getAttribute: async () => null };
  const page = {
    locator: (selector: string) => {
      if (selector === "button.bar-menu-button") return menuButton;
      if (selector === "button.drawer-handle-bottom") return { click: async () => { state.menu = false; } };
      if (selector === ".astraeus-shell") return { first: () => ({ getAttribute: async () => "true" }) };
      return anything;
    },
    getByRole: () => cog,
    waitForFunction: async () => undefined,
    mouse: { move: async () => undefined },
  };
  return { page, state };
}

describe("driver: the Developer cog inside the phone menu (I-184 case 2)", () => {
  it("reads the cog with the menu opened for it, then closes the menu again", async () => {
    const { page, state } = phonePage();
    expect(await developerOpen(page)).toBe(false);
    expect(state.menuOpenings).toBe(1);
    expect(state.menu).toBe(false);
    state.developer = true;
    expect(await developerOpen(page)).toBe(true);
    expect(state.menu).toBe(false);
  });
  it("leaves an open menu open after a read", async () => {
    const { page, state } = phonePage();
    state.menu = true;
    expect(await developerOpen(page)).toBe(false);
    expect(state.menu).toBe(true);
  });
  it("presses the cog through the menu and ends with the menu closed and the drawer open, then closes it the same way", async () => {
    const { page, state } = phonePage();
    await toggleDeveloper(page, { expand: false });
    expect(state.developer).toBe(true);
    expect(state.menu).toBe(false);
    await toggleDeveloper(page, { expand: false });
    expect(state.developer).toBe(false);
    expect(state.menu).toBe(false);
  });
});

// I-185: on a phone an open card is meant to fill up to half the viewer above the timeline (the sheet cap). The free scene is then the band under the bar,
// which the probe list must reach; the eight probes it had all fell inside an 844 px phone's capped card (bar to 66 px, card 246-668 px).
describe("driver: a free scene point beside a capped phone sheet (I-185)", () => {
  const phoneWithCard = (cardTop: number, cardBottom: number) => ({
    getByTestId: () => ({ boundingBox: async () => ({ x: 0, y: 0, width: 390, height: 844 }) }),
    evaluate: async (_fn: unknown, point: { x: number; y: number }) => point.y > 66 && !(point.y >= cardTop && point.y <= cardBottom),
  });
  it("finds a point in the band above a card at its cap", async () => {
    const point = await freeCanvasPoint(phoneWithCard(246, 668));
    expect(point).not.toBeNull();
    expect(point!.y).toBeLessThan(246);
    expect(point!.y).toBeGreaterThan(66);
  });
  it("still tries the middle first", async () => {
    expect(FREE_POINT_PROBES[0]).toEqual([0.5, 0.5]);
    expect(await freeCanvasPoint(phoneWithCard(900, 900))).toEqual({ x: 195, y: 422 });
  });
});

/**
 * A stand-in phone page with a switch panel inside the menu drawer: the panel's toggle shows only while the menu is open, and a panel row (the ecliptic switch)
 * only while the panel is open. Pressing a row does not close anything (rows carry no `data-closes-drawer`), so the driver must put things back itself.
 */
function switchPanelPage() {
  const state = { menu: false, panel: false, ecliptic: false };
  const hidden = (what: string) => { throw new Error(`${what}: hidden (Timeout 30000ms exceeded)`); };
  const row = {
    count: async () => 1,
    first: () => row,
    isVisible: async () => state.panel,
    getAttribute: async (name: string) => (state.panel ? (name === "aria-pressed" ? String(state.ecliptic) : null) : hidden("ecliptic row")),
    click: async () => { if (!state.panel) hidden("ecliptic row"); state.ecliptic = !state.ecliptic; },
    evaluateAll: async () => (state.panel ? ["ecliptic"] : hidden("panel rows")),
  };
  const toggle = {
    count: async () => 1,
    first: () => toggle,
    isVisible: async () => state.menu,
    getAttribute: async (name: string) => (name === "aria-expanded" ? String(state.panel) : null),
    click: async () => { if (!state.menu) hidden("switch panel toggle"); state.panel = !state.panel; },
  };
  const barButtons = { count: async () => 1, first: () => barButtons, isVisible: async () => true, evaluateAll: async () => ["skyFigures"] };
  const panel = { locator: () => ({ count: async () => 1 }), waitFor: async ({ state: wanted }: { state: string }) => { if ((wanted === "visible") !== state.panel) throw new Error(`panel not ${wanted}`); } };
  const menuButton = { count: async () => 1, getAttribute: async () => String(state.menu), click: async () => { state.menu = !state.menu; } };
  const anything = { count: async () => 0, first: () => anything, waitFor: async () => undefined, getAttribute: async () => null };
  const page = {
    locator: (selector: string) => {
      if (selector === "button.bar-menu-button") return menuButton;
      if (selector === "button.drawer-handle-bottom") return { click: async () => { state.menu = false; state.panel = false; } };
      if (selector === ".astraeus-shell") return { first: () => ({ getAttribute: async () => "true" }) };
      if (selector === "button.switch-panel-toggle") return toggle;
      if (selector === ".switch-panel") return panel;
      if (selector === '[data-display-switch="ecliptic"]') return row;
      if (selector === ".switch-panel [data-display-switch]") return row;
      if (selector === ".display-switches > button[data-display-switch]") return barButtons;
      return anything;
    },
    waitForFunction: async () => undefined,
    evaluate: async () => ({ insideWindow: true, overlaps: [] }),
  };
  return { page, state };
}

describe("driver: switch helpers leave the switch panel and the phone menu as they found them (I-184)", () => {
  it.each([
    ["displaySwitchOn", (page: unknown) => displaySwitchOn(page, "ecliptic")],
    ["toggleDisplaySwitch", (page: unknown) => toggleDisplaySwitch(page, "ecliptic")],
    ["displaySwitchPlaces", (page: unknown) => displaySwitchPlaces(page)],
    ["switchPanelFit", (page: unknown) => switchPanelFit(page)],
  ] as const)("%s from a closed menu ends with the panel and the menu closed", async (_name, call) => {
    const { page, state } = switchPanelPage();
    await call(page);
    expect(state).toMatchObject({ menu: false, panel: false });
  });
  it("a read and a press still act on the switch inside the panel", async () => {
    const { page, state } = switchPanelPage();
    expect(await displaySwitchOn(page, "ecliptic")).toBe(false);
    await toggleDisplaySwitch(page, "ecliptic");
    expect(state.ecliptic).toBe(true);
    expect(await displaySwitchOn(page, "ecliptic")).toBe(true);
    expect((await displaySwitchPlaces(page)).panel).toEqual(["ecliptic"]);
  });
  it("leaves an open menu and an open panel open", async () => {
    const { page, state } = switchPanelPage();
    state.menu = true;
    state.panel = true;
    await toggleDisplaySwitch(page, "ecliptic");
    expect(state).toMatchObject({ menu: true, panel: true, ecliptic: true });
  });
});
