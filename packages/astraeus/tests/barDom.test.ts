// @vitest-environment happy-dom
// The bar on the pretend page (O-079 T-326): one row for the desktop bar and the phone, drawn from the fit rule; the menu button, the title place, the short labels
// and the "i" the rule picks when the row is narrow. Widths are stubbed (the pretend page has no layout): a ghost is 10 px per character plus 20.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { $, mountShell, press, pressKey, swipe, type Mounted } from "./domSetup";

let m: Mounted;
afterEach(() => { m.unmount(); vi.restoreAllMocks(); });

const switcher = {
  label: "Version", param: "version", choose: () => undefined,
  options: [{ label: "Alpha version", shortLabel: "A", value: "a", active: true }, { label: "Beta version", shortLabel: "B", value: "b", active: false }],
};
const menuButton = () => $(m.container, "button.bar-menu-button");
const row = () => $(m.container, '[data-area="bar"] .top-bar');
const drawer = () => $(m.container, ".controls-drawer");

/** The row is `width` px wide; every ghost is as wide as its text says. */
function laidOut(width: number): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const ghost = this.hasAttribute("data-ghost-id");
    const w = ghost ? [...this.children].reduce((sum, child) => sum + (child.textContent ?? "").length * 10 + 20, 0) : this.classList.contains("top-bar") ? width : 0;
    return { width: w, height: 0, top: 0, left: 0, right: w, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
}

describe("the phone row", () => {
  it("has no name pill; one row holds the title place (the selected name), the switch as tabs and the menu button", () => {
    m = mountShell({ phone: true, switcher });
    expect(m.container.querySelector(".controls-pill")).toBeNull();
    expect($(row(), "[data-bar-title]").textContent).toContain("Earth");
    expect([...row().querySelectorAll('[data-switch-param="version"] button')].map((b) => b.textContent)).toEqual(["Alpha version", "Beta version"]);
    expect(row().contains(menuButton())).toBe(true);
    expect(row().querySelector("select.object-picker")).toBeNull();
    expect(row().closest('[data-area="bar"]')).not.toBeNull();
  });

  it("follows a pick with the title place's name", () => {
    m = mountShell({ phone: true });
    act_select("survey-marker");
    expect($(row(), "[data-bar-title]").textContent).toContain("Survey marker");
  });

  it("opens the drawer from the menu button by a tap or a swipe down, and the drawer holds what the rule put in the menu", () => {
    m = mountShell({ phone: true, developerTools: "Advanced readouts" });
    expect(drawer().getAttribute("data-open")).toBe("false");
    press(menuButton());
    expect(drawer().getAttribute("data-open")).toBe("true");
    expect(menuButton().getAttribute("aria-expanded")).toBe("true");
    expect(menuButton().getAttribute("aria-controls")).toBe(drawer().id);
    for (const hook of ["select.object-picker", ".object-info-toggle", ".scale-control", ".developer-mode-toggle"]) expect(drawer().querySelector(hook), hook).not.toBeNull();
    press(menuButton());
    expect(drawer().getAttribute("data-open")).toBe("false");
    swipe(menuButton(), 120);
    expect(drawer().getAttribute("data-open")).toBe("true");
    pressKey(document, "Escape");
    expect(drawer().getAttribute("data-open")).toBe("false");
  });

  it("draws every control from the one list: nothing sits in the bar area outside the row", () => {
    m = mountShell({ phone: true, developerTools: "x", switcher });
    const area = $(m.container, '[data-area="bar"]');
    expect([...area.querySelectorAll("button, select")].filter((control) => !row().contains(control))).toEqual([]);
  });
});

describe("the wide bar", () => {
  it("is one row with the controls and the cog in it, no title place and no menu button while everything fits", () => {
    m = mountShell({ developerTools: "x", switcher });
    expect(row().getAttribute("data-bar")).toBe("wide");
    for (const hook of ["select.object-picker", ".object-info-toggle", ".scale-control", ".developer-mode-toggle", '[data-switch-param="version"]']) expect(row().querySelector(hook), hook).not.toBeNull();
    expect(row().querySelector("[data-bar-title]")).toBeNull();
    expect(m.container.querySelector("button.bar-menu-button")).toBeNull();
    expect(m.container.querySelector(".controls-drawer")).toBeNull();
  });

  it("puts what does not fit behind the ⋯ button, which opens a drop-down in the menu area through the panel rule", () => {
    laidOut(200);
    m = mountShell({ developerTools: "x", switcher });
    expect(menuButton().getAttribute("aria-label")).toBe("More controls");
    expect(row().querySelector(".developer-mode-toggle")).toBeNull();
    expect(row().querySelector('[data-switch-param="version"]')).not.toBeNull();
    press(menuButton());
    expect(drawer().getAttribute("data-open")).toBe("true");
    expect($(m.container, '[data-area="menu"]').contains(drawer())).toBe(true);
    expect(drawer().querySelector(".developer-mode-toggle")).not.toBeNull();
    pressKey(document, "Escape");
    expect(drawer().getAttribute("data-open")).toBe("false");
  });
});

describe("the fit on the page (widths stubbed)", () => {
  it("shows full labels when the row has room, short labels when it does not, and the title as \"i\" when that is still too wide", () => {
    laidOut(500);
    m = mountShell({ phone: true, switcher });
    expect([...row().querySelectorAll('[data-switch-param="version"] button')].map((b) => b.textContent)).toEqual(["Alpha version", "Beta version"]);
    m.unmount();
    laidOut(300);
    m = mountShell({ phone: true, switcher });
    expect([...row().querySelectorAll('[data-switch-param="version"] button')].map((b) => b.textContent)).toEqual(["A", "B"]);
    expect($(row(), "[data-bar-title] [aria-hidden]").textContent).toBe("Earth");
    m.unmount();
    laidOut(130);
    m = mountShell({ phone: true, switcher });
    expect($(row(), "[data-bar-title] [aria-hidden]").textContent).toBe("i");
    expect($(row(), "[data-bar-title] .bar-sr").textContent).toBe("Earth");
  });

  it("measures nothing visible: the measuring row is hidden from the page and holds no control", () => {
    m = mountShell({ phone: true, switcher });
    const measure = $(m.container, ".bar-measure");
    expect(measure.getAttribute("aria-hidden")).toBe("true");
    expect(measure.querySelector("button, select, input, [id]")).toBeNull();
  });
});

function act_select(id: string): void {
  const picker = $(m.container, "select.object-picker") as HTMLSelectElement;
  picker.value = id;
  picker.dispatchEvent(new window.Event("change", { bubbles: true }));
}

describe("the wide drop-down and an outside press", () => {
  it("closes on a press outside it, stays open on a press on its button or inside it", () => {
    laidOut(200);
    m = mountShell({ developerTools: "x", switcher });
    const down = (target: Element) => act(() => { target.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true })); });
    press(menuButton());
    down(menuButton());
    down(drawer());
    expect(drawer().getAttribute("data-open")).toBe("true");
    down(document.body);
    expect(drawer().getAttribute("data-open")).toBe("false");
  });
});
