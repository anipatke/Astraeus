// @vitest-environment happy-dom
// O-055 T-255 (API-03): every document-level Escape listener of the viewer acts only when the key was pressed inside its own viewer or on the bare page.
// Two real shells on one page, each with all three listeners live (a phone drawer open, a story panel open, the switch panel open). One table: each
// listener x each place the key can be pressed. A key pressed in the other viewer or in a host's own control reaches none of this viewer's panels.
import { afterEach, describe, expect, it } from "vitest";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";
import { syntheticDefinition } from "./../src/synthetic/syntheticDefinition";

const PANEL_ID = syntheticDefinition.experience.storyPanels!.panels[0]!.id;
const SWITCHES = [{ id: "labels", label: "Labels", place: "panel" as const, on: true, onToggle: () => undefined }];

/** Opens every Escape-closable part of one viewer. */
function openEverything(): Mounted {
  const m = mountShell({ phone: true, displaySwitches: SWITCHES });
  m.requestPanel(PANEL_ID);
  press($(m.container, "button.controls-pill"));
  press($(m.container, ".switch-panel-toggle"));
  return m;
}

/** What is still open in one viewer. */
const stillOpen = (m: Mounted) => ({
  drawer: $(m.container, ".controls-drawer").getAttribute("data-open") === "true",
  story: m.container.querySelector(".story-panel") !== null,
  switches: !$(m.container, ".switch-panel").hasAttribute("hidden"),
});
const ALL_OPEN = { drawer: true, story: true, switches: true };
const ALL_CLOSED = { drawer: false, story: false, switches: false };

let viewers: Mounted[] = [];
let hostInput: HTMLInputElement | null = null;
afterEach(() => { for (const m of viewers) m.unmount(); viewers = []; hostInput?.remove(); hostInput = null; });

type Origin = "inside viewer A" | "inside viewer B" | "page body" | "a host input";
const ORIGINS: readonly { origin: Origin; a: typeof ALL_OPEN; b: typeof ALL_OPEN }[] = [
  { origin: "inside viewer A", a: ALL_CLOSED, b: ALL_OPEN },
  { origin: "inside viewer B", a: ALL_OPEN, b: ALL_CLOSED },
  { origin: "page body", a: ALL_CLOSED, b: ALL_CLOSED },
  { origin: "a host input", a: ALL_OPEN, b: ALL_OPEN },
];
const LISTENERS = ["drawer", "story", "switches"] as const;

describe.each(ORIGINS)("Escape pressed in $origin", ({ origin, a: expectA, b: expectB }) => {
  it.each(LISTENERS)("%s: closes the viewer(s) it belongs to and no other", (listener) => {
    const a = openEverything();
    const b = openEverything();
    viewers = [a, b];
    hostInput = document.createElement("input");
    document.body.appendChild(hostInput);
    expect(stillOpen(a)).toEqual(ALL_OPEN);
    expect(stillOpen(b)).toEqual(ALL_OPEN);
    const target = { "inside viewer A": a.container.querySelector("main")!, "inside viewer B": b.container.querySelector("main")!, "page body": document.body, "a host input": hostInput }[origin];
    pressKey(target, "Escape");
    expect(stillOpen(a)[listener]).toBe(expectA[listener]);
    expect(stillOpen(b)[listener]).toBe(expectB[listener]);
  });
});

describe("Escape pressed on the page itself (the document)", () => {
  it("still reaches a single viewer, as before", () => {
    const only = openEverything();
    viewers = [only];
    pressKey(document, "Escape");
    expect(stillOpen(only)).toEqual(ALL_CLOSED);
  });
  it("reaches every viewer", () => {
    const a = openEverything();
    const b = openEverything();
    viewers = [a, b];
    pressKey(document, "Escape");
    expect([stillOpen(a), stillOpen(b)]).toEqual([ALL_CLOSED, ALL_CLOSED]);
  });
});
