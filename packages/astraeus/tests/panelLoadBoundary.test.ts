// @vitest-environment happy-dom
// The developer panels load on demand (O-043 T-179); a failed load must leave the rest of the app drawn (C-116 O1).
import { act, createElement, lazy, Suspense, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelLoadBoundary } from "../src/app/PanelLoadBoundary";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ""; });

async function draw(panel: ComponentType): Promise<HTMLElement> {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const fallback = createElement("p", { role: "status" }, "Loading developer tools...");
  await act(async () => {
    root.render(createElement("main", null,
      createElement("p", null, "scene"),
      createElement(PanelLoadBoundary, null, createElement(Suspense, { fallback }, createElement(panel)))));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  return host;
}

describe("PanelLoadBoundary", () => {
  it("shows a reload message in place of the panels when their load fails, and keeps the rest drawn", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failing = lazy<ComponentType>(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));
    const host = await draw(failing);
    expect(host.textContent).toContain("scene");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Developer tools could not load. Reload the page to try again.");
  });

  it("draws the panels when their load succeeds", async () => {
    const working = lazy(async () => ({ default: () => createElement("p", null, "panels") }));
    const host = await draw(working);
    expect(host.textContent).toContain("panels");
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});
