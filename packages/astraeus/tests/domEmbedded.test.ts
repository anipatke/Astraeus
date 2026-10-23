// @vitest-environment happy-dom
// The app inside another page, and the shared control sizes, on the pretend page (O-038 T-143). Stands in for the behaviour scenarios of browser-embedded.mjs and the
// size rules of browser-controls.mjs. How slim the bars look, and whether controls share one look and baseline, is the owner's look on the preview (no stylesheet runs here);
// the sizes the stylesheets promise are read from the stylesheets.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { $, byLabel, change, mountShell, press, type Mounted } from "./domSetup";

let m: Mounted;
afterEach(() => { m.unmount(); });
const css = (name: string) => readFileSync(resolve(process.cwd(), "packages/astraeus/src/shell", name), "utf8");
const shell = () => $(m.container, "main.astraeus-shell");

describe("framed or alone (browser-embedded)", () => {
  it("flags the shell embedded in a frame, and not when it is the whole page", () => {
    m = mountShell({ embedded: true });
    expect(shell().getAttribute("data-embedded")).toBe("true");
    m.unmount();
    m = mountShell({ embedded: false });
    expect(shell().getAttribute("data-embedded")).toBe("false");
  });

  it("picks the phone or the laptop layout by the frame's own width", () => {
    m = mountShell({ embedded: true, phone: false });
    expect(shell().getAttribute("data-phone")).toBe("false");
    m.unmount();
    m = mountShell({ embedded: true, phone: true });
    expect(shell().getAttribute("data-phone")).toBe("true");
  });

  it.each([["laptop", false], ["phone", true]])("keeps the shared controls working in a %s frame", (_name, phone) => {
    m = mountShell({ embedded: true, phone, developerTools: "tools" });
    press($(m.container, ".timeline-play"));
    expect(m.clock.playing).toBe(true);
    press($(m.container, ".timeline-play"));
    expect(m.clock.playing).toBe(false);
    const speed = byLabel(m.container, "Playback speed") as HTMLSelectElement;
    const fastest = [...speed.options].at(-1)!.value;
    change(speed, fastest);
    expect(String(m.clock.rate)).toBe(fastest);
    if (phone) press($(m.container, "button.controls-pill"));
    const picker = $(m.container, "select.object-picker") as HTMLSelectElement;
    change(picker, "moon");
    expect(m.selected()).toBe("moon");
    if (!phone) {
      const events = $(m.container, "details.timeline-event-list") as HTMLDetailsElement;
      press($(events, "summary"));
      expect(events.open).toBe(true);
      expect(events.querySelectorAll(".timeline-expanded li button").length).toBeGreaterThan(0);
    }
    const cog = byLabel(m.container, "Developer mode");
    press(cog);
    expect(cog.getAttribute("aria-pressed")).toBe("true");
    press(cog);
    expect(cog.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("the sizes the stylesheets promise (browser-controls, browser-embedded, browser-phone: touch targets)", () => {
  it("gives controls 36 px on a larger screen and 44 px on a phone", () => {
    const controls = css("controls.css");
    expect(controls).toMatch(/--control-height: 36px/);
    expect(controls).toMatch(/\.astraeus-shell\[data-phone="true"\]\s*\{[^}]*--control-height: 44px/);
  });

  it("slims a framed laptop (30 px controls) and leaves a framed phone at 44 px", () => {
    const embedded = css("embedded.css");
    expect(embedded).toMatch(/\[data-embedded="true"\]\[data-phone="false"\]\s*\{[^}]*--control-height: 30px/);
    expect(embedded).toMatch(/\[data-embedded="true"\]\[data-phone="false"\]\s*\{[^}]*--control-height: 44px/);
    expect(embedded).not.toMatch(/\[data-phone="true"\][^{]*\{[^}]*--control-height: (?!44)/);
  });

  it("gives the drawer handles and the speed slider a 44 px touch height", () => {
    const phone = css("phone.css");
    expect(phone).toMatch(/\.drawer-handle \{[^}]*height: 44px/);
    expect(phone).toMatch(/\.timeline-speed-slider input \{[^}]*min-height: 44px/);
  });

  it("draws every control from the one shared size and font, not its own", () => {
    const controls = css("controls.css");
    expect(controls).toMatch(/min-height: var\(--control-height\)/);
    expect(controls).toMatch(/\.astraeus-shell \.ui-icon \{ width: var\(--control-height\)/);
    expect(controls).toMatch(/font-size: var\(--control-font-size\)/);
  });

  it("shows a visible keyboard focus ring (2 px) on selects and summaries", () => {
    expect(css("controls.css")).toMatch(/select:focus-visible,[\s\S]*?summary\.ui-button:focus-visible \{ outline: 2px solid/);
  });
});
