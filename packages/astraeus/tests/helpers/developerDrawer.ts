// The one wait for the on-demand Developer drawer in DOM tests (I-203): the drawer is `lazy(() => import("./DeveloperDrawer"))` since O-089 T-418, so a test that
// opens it must wait for that chunk, not race Vitest's 1 s `waitFor` default (two viewerIds cases timed out under a loaded parallel run).
import { expect, vi } from "vitest";

/** Long enough for the chunk under a loaded parallel run; far under the suite's 30 s test timeout (vitest.config.ts). */
export const DRAWER_WAIT_MS = 10_000;

/** Loads the drawer's chunk ahead of the click, so the lazy component resolves from the module cache. */
export const preloadDeveloperDrawer = () => import("../../src/app/DeveloperDrawer");

/** Waits until `root` shows the opened drawer's heading (the chunk has loaded and drawn). */
export async function waitForDeveloperDrawer(root: ParentNode): Promise<void> {
  await preloadDeveloperDrawer();
  await vi.waitFor(() => expect(root.querySelector(".developer-heading h2")?.textContent).toBe("Developer tools"), {
    timeout: DRAWER_WAIT_MS,
    interval: 20,
  });
}
