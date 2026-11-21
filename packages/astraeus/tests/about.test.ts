// @vitest-environment happy-dom
// O-079 T-325: the About (`Scene.setAbout`), the bar's title item and the About panel. Each input is changed alone on a made-up scene (ARCH-03). The lifecycle and two-viewer
// suites run the handle on both embedding paths; here: the checks, the reads, the version, the panel through the shell, and the panel rule's About rows.
import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, SceneError, earth, type AboutInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { ViewerAbout } from "../src/api/viewerAbout";
import { ENGINE_VERSION, BUILT_WITH_URL } from "../src/app/engineVersion";
import { NO_PANELS, reducePanels, topmost, type Layout } from "../src/shell/panels/panelRule";
import enginePackage from "../package.json" with { type: "json" };
import { $, mountShell, press, pressKey, selectObject, type Mounted } from "./domSetup";

const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const about: AboutInput = {
  title: "The asteroid belt", shortTitle: "Belt", status: "Showing 1 July 2026",
  credits: [{ text: "Orbits: JPL", url: "https://ssd.jpl.nasa.gov/" }, { text: "Pictures: NASA" }],
  links: [{ text: "Method", url: "https://example.org/method" }],
};
const base = () => new Scene().addBody(earth);
const made = [{ name: "made-up", provides: ["earth"] }] as const;

describe("Scene.setAbout", () => {
  it("is absent by default; set, it reads back frozen, and the definition carries it", () => {
    expect(base().about).toBeUndefined();
    expect(definitionOf(base(), [...made]).about).toBeUndefined();
    const scene = base().setAbout(about);
    expect(scene.about).toEqual(about);
    expect(Object.isFrozen(scene.about)).toBe(true);
    expect(Object.isFrozen(scene.about!.credits)).toBe(true);
    expect(Object.isFrozen(scene.about!.credits![0])).toBe(true);
    expect(Object.isFrozen(scene.about!.links![0])).toBe(true);
    expect(definitionOf(scene, [...made]).about).toEqual(about);
  });

  it("replaces the whole About, does not keep the caller's object, and leaves fields not given absent", () => {
    const credits = [{ text: "A" }];
    const scene = base().setAbout(about).setAbout({ title: "Other", credits });
    expect(scene.about).toEqual({ title: "Other", credits: [{ text: "A" }] });
    expect("status" in scene.about!).toBe(false);
    (credits as { text: string }[])[0]!.text = "changed";
    expect(scene.about!.credits![0]!.text).toBe("A");
  });

  it("refuses each malformed field alone with bad-about naming it, and keeps the earlier About", () => {
    const bad = (change: Record<string, unknown>) => codeOf(() => base().setAbout({ ...about, ...change } as AboutInput));
    expect(bad({ title: "" })).toMatch(/^bad-about: setAbout: title must be a non-empty string/);
    expect(bad({ title: 3 })).toMatch(/^bad-about: .*title/);
    expect(bad({ shortTitle: "" })).toMatch(/^bad-about: .*shortTitle must be a non-empty string/);
    expect(bad({ status: 4 })).toMatch(/^bad-about: .*status must be a string/);
    expect(bad({ credits: "x" })).toMatch(/^bad-about: .*credits must be a list/);
    expect(bad({ links: {} })).toMatch(/^bad-about: .*links must be a list/);
    expect(bad({ credits: ["x"] })).toMatch(/^bad-about: .*credits\[0\] must be a/);
    expect(bad({ credits: [{ text: "" }] })).toMatch(/^bad-about: .*credits\[0\]\.text/);
    expect(bad({ credits: [{ text: "A", url: "ftp://x.org" }] })).toMatch(/^bad-about: .*credits\[0\]\.url must be an http or https address/);
    expect(bad({ credits: [about.credits![0], { text: "B", url: 5 }] })).toMatch(/^bad-about: .*credits\[1\]\.url/);
    expect(bad({ links: [null] })).toMatch(/^bad-about: .*links\[0\] must be a/);
    expect(bad({ links: [{ text: "", url: "https://x.org" }] })).toMatch(/^bad-about: .*links\[0\]\.text/);
    expect(bad({ links: [{ text: "A" }] })).toMatch(/^bad-about: .*links\[0\]\.url must be an http or https address/);
    expect(bad({ links: [{ text: "A", url: "javascript:alert(1)" }] })).toMatch(/^bad-about: .*links\[0\]\.url/);
    expect(codeOf(() => base().setAbout(undefined as never))).toMatch(/^bad-about/);
    expect(codeOf(() => base().setAbout([] as never))).toMatch(/^bad-about/);
    const scene = base().setAbout(about);
    expect(codeOf(() => scene.setAbout({ title: "" }))).toMatch(/^bad-about/);
    expect(scene.about!.title).toBe("The asteroid belt");
  });
});

describe("the engine version", () => {
  it("is the engine's own package.json version, and the link is the engine's address", () => {
    expect(ENGINE_VERSION).toBe(enginePackage.version);
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(BUILT_WITH_URL).toBe("https://astraeus.anipatke.com/");
  });
});

describe("the link's About (one viewer's own)", () => {
  it("is undefined before the viewer attaches, takes the scene's About on attach, replaces on setAbout, tells the viewer's watcher, and is gone on detach", () => {
    let attached = false;
    const access = { control: () => (attached ? ({} as never) : undefined), open: (what: string) => { if (!attached) throw new SceneError("not-mounted", what); return {} as never; } };
    const part = new ViewerAbout(access);
    const told = vi.fn();
    part.watch(told);
    expect(part.about).toBeUndefined();
    expect(codeOf(() => part.setAbout({ title: "A" }))).toMatch(/^not-mounted/);
    attached = true;
    part.reset({ about: { title: "Scene's" } } as never);
    expect(part.about).toEqual({ title: "Scene's" });
    part.setAbout({ title: "Host's", status: "now" });
    expect(part.about).toEqual({ title: "Host's", status: "now" });
    expect(codeOf(() => part.setAbout({ title: "" }))).toMatch(/^bad-about/);
    expect(part.about!.title).toBe("Host's");
    expect(told).toHaveBeenCalledTimes(2);
    part.reset(undefined);
    expect(part.about).toBeUndefined();
  });
});

let m: Mounted | undefined;
afterEach(() => { m?.unmount(); m = undefined; vi.restoreAllMocks(); });
const shown = (): Mounted => m!;
const bar = () => $(shown().container, '[data-area="bar"] .top-bar');
const titleButton = () => $(bar(), "[data-bar-title]");
const panel = () => shown().container.querySelector<HTMLElement>("[data-about]");
const left = () => $(shown().container, '[data-area="left"]');
const card = () => shown().container.querySelector<HTMLElement>(".info-panel[data-info-kind]");

/** The row is `width` px wide; every ghost is as wide as its text says (10 px per character plus 20). */
function laidOut(width: number): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const ghost = this.hasAttribute("data-ghost-id");
    const w = ghost ? [...this.children].reduce((sum, child) => sum + (child.textContent ?? "").length * 10 + 20, 0) : this.classList.contains("top-bar") ? width : 0;
    return { width: w, height: 0, top: 0, left: 0, right: w, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
}

describe("the title item and the About panel on a wide screen", () => {
  it("shows the title at the bar's left; pressing it opens About in the left place, pressing again closes it, and the title names the panel it opens", () => {
    m = mountShell({ about: { ...about } as never });
    expect(titleButton().textContent).toContain("The asteroid belt");
    expect(titleButton().getAttribute("aria-expanded")).toBe("false");
    expect(titleButton().hasAttribute("aria-controls")).toBe(false);
    expect(panel()).toBeNull();
    press(titleButton());
    expect(left().contains(panel())).toBe(true);
    expect(titleButton().getAttribute("aria-expanded")).toBe("true");
    expect(titleButton().getAttribute("aria-controls")).toBe(panel()!.id);
    press(titleButton());
    expect(panel()).toBeNull();
    expect(titleButton().getAttribute("aria-expanded")).toBe("false");
  });

  it("lists the status, the credits (a Source link where a url is given), the links, then ends with the built-with link and the version", () => {
    m = mountShell({ about: { ...about } as never });
    press(titleButton());
    const body = panel()!;
    expect($(body, "[data-about-status]").textContent).toBe("Showing 1 July 2026");
    const credits = [...body.querySelectorAll("[data-about-credits] li")];
    expect(credits.map((li) => li.textContent)).toEqual(["Orbits: JPL (Source)", "Pictures: NASA"]);
    expect(credits[0]!.querySelector("a")!.getAttribute("href")).toBe("https://ssd.jpl.nasa.gov/");
    expect(credits[1]!.querySelector("a")).toBeNull();
    const links = [...body.querySelectorAll("[data-about-links] a")];
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([["Method", "https://example.org/method"]]);
    const last = body.lastElementChild!;
    expect(last.hasAttribute("data-about-built-with")).toBe(true);
    expect(last.querySelector("a")!.textContent).toBe("Built with Astraeus");
    expect(last.querySelector("a")!.getAttribute("href")).toBe("https://astraeus.anipatke.com/");
    expect(last.querySelector("[data-about-version]")!.textContent).toBe(enginePackage.version);
    for (const link of body.querySelectorAll("a")) expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("with only a title it draws no status, credits or links, and still ends with the built-with mark and version", () => {
    m = mountShell({ about: { title: "Tarn" } });
    press(titleButton());
    const body = panel()!;
    expect(body.querySelector("[data-about-status]")).toBeNull();
    expect(body.querySelector("[data-about-credits]")).toBeNull();
    expect(body.querySelector("[data-about-links]")).toBeNull();
    expect(body.querySelector("[data-about-version]")!.textContent).toBe(enginePackage.version);
  });

  it("Escape closes it (the panel rule's), and the card and About take the one left place from each other", () => {
    m = mountShell({ about: { title: "Tarn" } });
    press(titleButton());
    pressKey(document, "Escape");
    expect(panel()).toBeNull();
    press(titleButton());
    press($(shown().container, ".object-info-toggle"));
    expect(panel()).toBeNull();
    expect(card()).not.toBeNull();
    press(titleButton());
    expect(card()).toBeNull();
    expect(panel()).not.toBeNull();
  });

  it("places the panel by the rule alone: it is an `astraeus-area` child with no style of its own", () => {
    m = mountShell({ about: { title: "Tarn" } });
    press(titleButton());
    expect(panel()!.parentElement!.getAttribute("data-area")).toBe("left");
    expect(panel()!.getAttribute("style")).toBeNull();
  });

  it("a scene without an About shows no title on a wide bar", () => {
    m = mountShell({});
    expect(bar().querySelector("[data-bar-title]")).toBeNull();
  });
});

describe("the title item on a phone", () => {
  it("opens About as a sheet in the sheet place (the left place on the phone grid), and the object card and About close each other", () => {
    m = mountShell({ phone: true, about: { title: "The asteroid belt", shortTitle: "Belt" } });
    expect(titleButton().textContent).toContain("The asteroid belt");
    press(titleButton());
    expect(panel()).not.toBeNull();
    expect(left().contains(panel())).toBe(true);
    selectObject(shown().container, "survey-marker");
    expect(panel()).toBeNull();
    expect(card()).not.toBeNull();
    press(titleButton());
    expect(card()).toBeNull();
    expect(panel()).not.toBeNull();
    pressKey(document, "Escape");
    expect(panel()).toBeNull();
  });

  it("shrinks to the short title and then to \"i\" by the bar's fit rule, the full name kept for a screen reader, and still opens About", () => {
    const wide = { title: "The asteroid belt", shortTitle: "Belt" };
    laidOut(1000);
    m = mountShell({ phone: true, about: wide });
    expect($(titleButton(), "[aria-hidden]").textContent).toBe("The asteroid belt");
    m!.unmount();
    laidOut(70);
    m = mountShell({ phone: true, about: wide });
    expect($(titleButton(), "[aria-hidden]").textContent).toBe("i");
    expect($(titleButton(), ".bar-sr").textContent).toBe("The asteroid belt");
    press(titleButton());
    expect(panel()).not.toBeNull();
  });

  it("with no About the title place shows the selected object's name and opens its card; pressing again closes it", () => {
    m = mountShell({ phone: true });
    expect(titleButton().textContent).toContain("Earth");
    expect(card()).toBeNull();
    press(titleButton());
    expect(card()).not.toBeNull();
    expect(titleButton().getAttribute("aria-expanded")).toBe("true");
    expect(titleButton().getAttribute("aria-controls")).toBe(card()!.id);
    press(titleButton());
    expect(card()).toBeNull();
  });
});

describe.each<Layout>(["wide", "phone"])("the panel rule's About rows, %s", (layout) => {
  it("About is a left occupant: it replaces the card and the moons list, and they replace it", () => {
    expect(reducePanels({ ...NO_PANELS, left: "card" }, { type: "open", occupant: "about" }, layout).left).toBe("about");
    expect(reducePanels({ ...NO_PANELS, left: "moons" }, { type: "open", occupant: "about" }, layout).left).toBe("about");
    expect(reducePanels({ ...NO_PANELS, left: "about" }, { type: "open", occupant: "card" }, layout).left).toBe("card");
    expect(reducePanels({ ...NO_PANELS, left: "about" }, { type: "open", occupant: "moons" }, layout).left).toBe("moons");
  });
  it("it covers the story panel and keeps it open, closes by its own close, and Escape closes it as the detail occupant", () => {
    const open = reducePanels({ ...NO_PANELS, story: true }, { type: "open", occupant: "about" }, layout);
    expect(open).toMatchObject({ left: "about", story: true });
    expect(topmost(open)).toEqual({ occupant: "about" });
    expect(reducePanels(open, { type: "escape" }, layout)).toMatchObject({ left: null, story: true });
    expect(reducePanels(open, { type: "close", occupant: "about" }, layout).left).toBeNull();
    expect(reducePanels({ ...NO_PANELS, left: "card" }, { type: "close", occupant: "about" }, layout).left).toBe("card");
  });
  it("a drawer or pop-up above it takes Escape first", () => {
    const state = { ...NO_PANELS, left: "about" as const, popup: "scale-menu" };
    expect(reducePanels(state, { type: "escape" }, layout)).toMatchObject({ left: "about", popup: null });
  });
});

describe("the phone developer sheet and About", () => {
  it("About replaces the developer sheet on a phone, and the developer sheet replaces About", () => {
    expect(reducePanels({ ...NO_PANELS, developer: true }, { type: "open", occupant: "about" }, "phone")).toMatchObject({ left: "about", developer: false });
    expect(reducePanels({ ...NO_PANELS, left: "about" }, { type: "open", occupant: "developer" }, "phone")).toMatchObject({ left: null, developer: true });
    expect(reducePanels({ ...NO_PANELS, developer: true }, { type: "open", occupant: "about" }, "wide")).toMatchObject({ left: "about", developer: true });
  });
});
