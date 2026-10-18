import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Collapsible, readStoredOpen, writeStoredOpen } from "../src/shell/Collapsible";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
};
const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };

describe("Collapsible storage", () => {
  it("falls back to the default when nothing is stored or storage is missing or throws", () => {
    expect(readStoredOpen(memory(), "a", true)).toBe(true);
    expect(readStoredOpen(memory(), "a", false)).toBe(false);
    expect(readStoredOpen(undefined, "a", true)).toBe(true);
    expect(readStoredOpen(broken, "a", false)).toBe(false);
    expect(() => writeStoredOpen(broken, "a", true)).not.toThrow();
    expect(() => writeStoredOpen(undefined, "a", true)).not.toThrow();
  });
  it("remembers a viewer's choice over the default, per fold", () => {
    const store = memory();
    writeStoredOpen(store, "a", false);
    writeStoredOpen(store, "b", true);
    expect(readStoredOpen(store, "a", true)).toBe(false);
    expect(readStoredOpen(store, "b", false)).toBe(true);
    expect(readStoredOpen(store, "c", true)).toBe(true);
  });
});

describe("Collapsible markup", () => {
  const render = (defaultOpen: boolean) => renderToStaticMarkup(createElement(Collapsible, { id: "x", title: "Orbit lines", defaultOpen, children: createElement("p", null, "inside") }));
  it("is a heading button with aria-expanded, naming its body", () => {
    const html = render(true);
    expect(html).toMatch(/<h3[^>]*><button[^>]*aria-expanded="true"[^>]*aria-controls="[^"]+"/);
    expect(html).toContain("inside");
    expect(html).toMatch(/role="group" aria-labelledby="[^"]+"/);
  });
  it("does not draw the body while closed", () => {
    const html = render(false);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("inside");
    expect(html).toContain("hidden");
  });
});
