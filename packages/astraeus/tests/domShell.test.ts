// @vitest-environment happy-dom
// The shell's screen parts on the pretend page (O-038 T-143): events, camera presets, the information panel with provenance and Sources, the two scales, the developer cog
// and keyboard focus. Stands in for the behaviour scenarios of browser-shell.mjs and browser-layout.mjs (map in the T-143 evidence).
import { afterEach, describe, expect, it } from "vitest";
import { $, byLabel, findAllByLabel, mountShell, press, pressKey, type Mounted } from "./domSetup";

let m: Mounted;
afterEach(() => { m.unmount(); });
const text = (element: Element) => element.textContent ?? "";

describe("events (browser-shell: Events)", () => {
  it("lists the two made-up events, and the context line names the picked one", () => {
    m = mountShell();
    const rows = [...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")];
    expect(rows).toHaveLength(2);
    const labels = rows.map((row) => text(row.querySelector("span")!).trim());
    press(rows[0]);
    expect(text($(m.container, ".timeline-event-context"))).toContain(labels[0]);
    press($(m.container, ".timeline-next"));
    expect(text($(m.container, ".timeline-event-context"))).toContain(labels[1]);
  });

  it("opens and closes the Events list on its summary", () => {
    m = mountShell();
    const details = $(m.container, "details.timeline-event-list") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    press($(details, "summary"));
    expect(details.open).toBe(true);
    press($(details, "summary"));
    expect(details.open).toBe(false);
  });

  it("moves back with Previous, and a timeline marker names its event", () => {
    m = mountShell();
    const rows = [...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")];
    press(rows[1]);
    const atSecond = m.clock.now();
    press($(m.container, ".timeline-previous"));
    expect(m.clock.now()).toBeLessThan(atSecond);
    expect(findAllByLabel(m.container, /^Go to Marker/)).toHaveLength(2);
  });

  it("opens an event's information from the context line, then closes it with the panel's button", () => {
    m = mountShell();
    press($(m.container, ".timeline-expanded li button"));
    press($(m.container, ".timeline-event-current"));
    expect($(m.container, "#info-panel").getAttribute("data-info-kind")).toBe("event");
    press(byLabel(m.container, "Close information"));
    expect(m.container.querySelector("#info-panel")).toBeNull();
  });
});

describe("the object list and camera presets (browser-shell: Camera presets)", () => {
  it("offers the marker through the whole timeline, so its option is never disabled", () => {
    m = mountShell();
    const option = $(m.container, 'select.object-picker option[value="survey-marker"]') as HTMLOptionElement;
    expect(option.disabled).toBe(false);
  });

  it("offers Overview, Focus and Follow for the marker, asks the scene for each and marks the active one", () => {
    m = mountShell();
    const preset = (id: string) => m.container.querySelector<HTMLElement>(`[data-camera-preset="${id}"]`);
    expect(preset("overview")).not.toBeNull();

    const selectMarker = $(m.container, "select.object-picker") as HTMLSelectElement;
    selectMarker.value = "survey-marker";
    selectMarker.dispatchEvent(new window.Event("change", { bubbles: true }));
    press(preset("follow-marker")!);
    expect(m.cameraRequests.at(-1)).toEqual({ kind: "follow", target: "survey-marker" });
    expect(preset("follow-marker")!.getAttribute("aria-pressed")).toBe("true");
    press(preset("focus-marker")!);
    expect(m.cameraRequests.at(-1)).toEqual({ kind: "focus", target: "survey-marker" });
    press(preset("overview")!);
    expect(m.cameraRequests.at(-1)).toEqual({ kind: "overview" });
    expect(m.selected()).toBe("survey-marker");
  });
});

describe("information, provenance and Sources (browser-shell: Information panel)", () => {
  const pickMarker = () => {
    m = mountShell();
    const picker = $(m.container, "select.object-picker") as HTMLSelectElement;
    picker.value = "survey-marker";
    picker.dispatchEvent(new window.Event("change", { bubbles: true }));
  };

  it("opens for the picked marker with Metric Visuals and a provenance badge that opens its detail", () => {
    pickMarker();
    const panel = $(m.container, "#info-panel");
    expect(panel.getAttribute("data-info-id")).toBe("survey-marker");
    expect(panel.querySelectorAll(".metric").length).toBeGreaterThan(0);
    const badge = $(panel, ".provenance-badge");
    expect(text(badge)).toMatch(/^\w+ ⓘ/);
    press(badge);
    expect(badge.getAttribute("aria-expanded")).toBe("true");
    const detail = text($(panel, ".provenance"));
    for (const heading of ["Known limitations", "Sources", "Accuracy"]) expect(detail).toContain(heading);
    expect(detail).toMatch(/Not a real object/);
  });

  it("closes on Escape, and from its own Close button", () => {
    pickMarker();
    pressKey($(m.container, "#info-panel .info-panel-close"), "Escape");
    expect(m.container.querySelector("#info-panel")).toBeNull();
    press($(m.container, ".object-info-toggle"));
    press(byLabel(m.container, "Close information"));
    expect(m.container.querySelector("#info-panel")).toBeNull();
  });

  it("toggles from the Info button", () => {
    m = mountShell();
    const toggle = $(m.container, ".object-info-toggle");
    press(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    press(toggle);
    expect(m.container.querySelector("#info-panel")).toBeNull();
  });
});

describe("the two scales (browser-shell: Both scales)", () => {
  it("names the scale and switches, with identical readouts under both", () => {
    m = mountShell();
    const picker = $(m.container, "select.object-picker") as HTMLSelectElement;
    picker.value = "moon";
    picker.dispatchEvent(new window.Event("change", { bubbles: true }));
    const metrics = () => text($(m.container, "#info-panel .info-panel-metrics"));
    const trueReadout = metrics();
    expect(m.scale()).toBe("true-scale");
    const toggle = () => $(m.container, ".scale-toggle");
    expect(toggle().getAttribute("aria-label")).toBe("Scale: True. Switch to Readable");
    press(toggle());
    expect(m.scale()).toBe("readable-scale");
    expect(toggle().getAttribute("aria-label")).toBe("Scale: Readable. Switch to True");
    expect(metrics()).toBe(trueReadout);
    expect(toggle().getAttribute("title")).toMatch(/closer[\s\S]*true size[\s\S]*drawn on top/);
    press(toggle());
    expect(m.scale()).toBe("true-scale");
  });

  it("explains the scales on one tap and hides the explanation on a second", () => {
    m = mountShell();
    const info = byLabel(m.container, "About the scales");
    const panel = () => $(m.container, ".scale-explanation-panel");
    expect(panel().hidden).toBe(true);
    press(info);
    expect(info.getAttribute("aria-expanded")).toBe("true");
    expect(panel().hidden).toBe(false);
    expect(text(panel())).toMatch(/True\.[\s\S]*real proportion/);
    expect(text(panel())).toMatch(/Readable\.[\s\S]*closer together/);
    expect(text(panel())).toMatch(/Only the picture changes/);
    press(info);
    expect(panel().hidden).toBe(true);
  });
});

describe("the developer cog (browser-shell, browser-layout, browser-embedded: Developer)", () => {
  it("starts closed, opens its panel on a press and closes it on a second", () => {
    m = mountShell({ developerTools: "Advanced readouts" });
    const cog = byLabel(m.container, "Developer mode");
    const panel = $(m.container, "#developer-tools");
    expect(cog.getAttribute("aria-pressed")).toBe("false");
    expect(panel.hidden).toBe(true);
    press(cog);
    expect(cog.getAttribute("aria-pressed")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(text(panel)).toContain("Advanced readouts");
    press(cog);
    expect(panel.hidden).toBe(true);
  });
});

describe("keyboard focus and touch sizes (browser-layout: focus, primary controls)", () => {
  it("every primary control is a real button or select that Tab can reach", () => {
    m = mountShell();
    for (const selector of [".object-info-toggle", ".timeline-play", ".timeline-next", ".timeline-previous", "select.object-picker", ".scale-toggle", ".developer-mode-toggle"]) {
      const element = $(m.container, selector);
      expect(["BUTTON", "SELECT"], selector).toContain(element.tagName);
      expect(element.tabIndex, selector).toBeGreaterThanOrEqual(0);
    }
  });
});
