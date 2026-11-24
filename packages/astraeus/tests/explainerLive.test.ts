// @vitest-environment happy-dom
// The explainer's paragraphs are a polite live region that exists from the first draw (O-098 T-452, belt #21).
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: () => createElement("div", { "data-testid": "scene" }),
}));
vi.mock("../src/api/prepared", async () => {
  const actual = await vi.importActual<typeof import("../src/api/prepared")>("../src/api/prepared");
  return { prepareScene: actual.prepareScene };
});

import { flushSync } from "react-dom";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { panel } from "../src/shelf/panel/factory";
import { explainer } from "../src/shelf/explainer/factory";
import { earth } from "../src/api/bodies";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const open = async (root: HTMLElement, text: ReturnType<typeof explainer>) => {
  document.body.append(root);
  const hold = panel({ id: "hold", button: { label: "Text" }, title: "Text", blocks: [text] });
  const handle = mount(root, new Scene().addBody(earth).addParts([hold]));
  await handle.ready;
  return handle;
};
const toggle = (root: HTMLElement) =>
  flushSync(() => root.querySelector<HTMLElement>('[data-story-button="hold"]')!.click());
const region = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-shelf-block="intro"] .shelf-explainer-paragraphs');
const texts = (root: HTMLElement) =>
  [...region(root)!.querySelectorAll(".shelf-explainer-text")].map((p) => p.textContent);

describe("explainer paragraphs are a polite live region (O-098 T-452)", () => {
  it("wraps only the paragraphs, keeps the same node across a change, and draws again on reopen", async () => {
    const root = document.createElement("div");
    const intro = explainer({ id: "intro", heading: "Why", paragraphs: ["First."], notes: ["A note."] });
    const handle = await open(root, intro);
    toggle(root);
    const first = region(root)!;
    expect([first.getAttribute("aria-live"), first.getAttribute("aria-atomic")]).toEqual(["polite", "true"]);
    expect(texts(root)).toEqual(["First."]);
    expect(first.querySelector(".shelf-explainer-heading, .shelf-explainer-note")).toBeNull();
    expect(first.contains(root.querySelector(".shelf-explainer-heading"))).toBe(false);
    expect(first.contains(root.querySelector(".shelf-explainer-note"))).toBe(false);
    flushSync(() => handle.part(intro).setParagraphs(["Second.", "Third."]));
    expect(region(root)).toBe(first);
    expect(texts(root)).toEqual(["Second.", "Third."]);
    toggle(root);
    toggle(root);
    const again = region(root)!;
    expect([again.getAttribute("aria-live"), again.getAttribute("aria-atomic")]).toEqual(["polite", "true"]);
    expect(texts(root)).toEqual(["Second.", "Third."]);
  });

  it("draws the empty region beside a heading and fills that same node later", async () => {
    const root = document.createElement("div");
    const intro = explainer({ id: "intro", heading: "Why", paragraphs: [] });
    const handle = await open(root, intro);
    toggle(root);
    const empty = region(root)!;
    expect(empty.getAttribute("aria-live")).toBe("polite");
    expect(empty.children.length).toBe(0);
    flushSync(() => handle.part(intro).setParagraphs(["x"]));
    expect(region(root)).toBe(empty);
    expect(texts(root)).toEqual(["x"]);
  });

  it("keeps each viewer's own region", async () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    const intro = explainer({ id: "intro", paragraphs: ["One."] });
    const handleA = await open(a, intro);
    await open(b, intro);
    toggle(a);
    toggle(b);
    flushSync(() => handleA.part(intro).setParagraphs(["Changed."]));
    expect([texts(a), texts(b)]).toEqual([["Changed."], ["One."]]);
    expect(region(a)).not.toBe(region(b));
  });
});
