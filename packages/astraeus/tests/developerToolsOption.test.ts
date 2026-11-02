// @vitest-environment happy-dom
// The `developerTools` option (O-055 T-253, API-02, API-06): off, a viewer shows no Developer toggle or drawer and never fetches the drawer's code; on, the drawer is as before.
// One table row per entry path to the drawer. The drawer's module is mocked only to count how often it is evaluated; each row starts from a fresh module registry so the count is its own.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loads = vi.hoisted(() => ({ drawer: 0 }));
vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

let host: HTMLElement;
let stop: () => void;
beforeEach(() => { pretendScreen({}); window.localStorage.clear(); vi.resetModules(); loads.drawer = 0; vi.doMock("../src/app/DeveloperSettings", async (importOriginal) => { loads.drawer += 1; return importOriginal<typeof import("../src/app/DeveloperSettings")>(); }); host = document.createElement("div"); document.body.append(host); stop = () => undefined; });
afterEach(() => { stop(); host.remove(); window.history.replaceState(null, "", "/"); });

const toggle = () => host.querySelector<HTMLButtonElement>('button[aria-label="Developer mode"]');
const aside = () => host.querySelector(".developer-tools");
/** The viewer's modules, loaded fresh (so the mock above counts this row only). */
async function modules() {
  const [{ createElement: h }, { createRoot }, { flushSync }, { Scene }, bodies, api, scene, app, synthetic] = await Promise.all([
    import("react"), import("react-dom/client"), import("react-dom"), import("../src/api/scene"), import("../src/api/bodies"), import("../src/api/mount"),
    import("../src/api/AstraeusScene"), import("../src/app/App"), import("../src/synthetic/syntheticDefinition"),
  ]);
  return { h, createRoot, flushSync, Scene, bodies, mount: api.mount, AstraeusScene: scene.AstraeusScene, App: app.App, synthetic };
}
type Modules = Awaited<ReturnType<typeof modules>>;
const makeScene = (m: Modules, developerSwitch = false) => {
  const scene = new m.Scene().addBody(m.bodies.earth).addBody(m.bodies.moon);
  return developerSwitch ? scene.setSwitches({ labels: { place: "developer" } }) : scene;
};

interface Row {
  readonly name: string;
  readonly shows: boolean;
  readonly developerSwitch?: boolean;
  open(m: Modules, scene: InstanceType<Modules["Scene"]>): Promise<void>;
}
const viaMount = (options: Record<string, unknown>) => async (m: Modules, scene: InstanceType<Modules["Scene"]>) => {
  const mounted = m.mount(host, scene, options);
  stop = () => mounted.unmount();
  await mounted.ready;
};
const viaReact = (props: Record<string, unknown>) => async (m: Modules, scene: InstanceType<Modules["Scene"]>) => {
  const root = m.createRoot(host);
  stop = () => m.flushSync(() => root.unmount());
  await new Promise<void>((resolve, reject) => m.flushSync(() => root.render(m.h(m.AstraeusScene, { scene, onReady: () => resolve(), onError: reject, ...props }))));
};
const ROWS: readonly Row[] = [
  { name: "mount, default", shows: false, open: viaMount({}) },
  { name: "mount, developerTools: true", shows: true, open: viaMount({ developerTools: true }) },
  { name: "mount, developerTools: false", shows: false, open: viaMount({ developerTools: false }) },
  { name: "mount with address: true and no developerTools", shows: false, open: viaMount({ address: true }) },
  { name: "mount, a developer-placed switch, default", shows: false, developerSwitch: true, open: viaMount({}) },
  { name: "mount, a developer-placed switch, developerTools: true", shows: true, developerSwitch: true, open: viaMount({ developerTools: true }) },
  { name: "AstraeusScene, default", shows: false, open: viaReact({}) },
  { name: "AstraeusScene, developerTools", shows: true, open: viaReact({ developerTools: true }) },
  { name: "AstraeusScene, developerTools={false}", shows: false, open: viaReact({ developerTools: false }) },
  { name: "AstraeusScene, a developer-placed switch, default", shows: false, developerSwitch: true, open: viaReact({}) },
  {
    name: "App as the demo site uses it (address, developerTools)", shows: true,
    async open(m) {
      const root = m.createRoot(host);
      stop = () => m.flushSync(() => root.unmount());
      m.flushSync(() => root.render(m.h(m.App, { definition: m.synthetic.syntheticDefinition, address: true, developerTools: true })));
    },
  },
  {
    name: "App with no developerTools", shows: false,
    async open(m) {
      const root = m.createRoot(host);
      stop = () => m.flushSync(() => root.unmount());
      m.flushSync(() => root.render(m.h(m.App, { definition: m.synthetic.syntheticDefinition })));
    },
  },
];

describe("developerTools: every entry path to the Developer drawer", () => {
  it.each(ROWS)("$name", async (row) => {
    const m = await modules();
    await row.open(m, makeScene(m, row.developerSwitch));
    await vi.waitFor(() => expect(host.querySelector(".astraeus-shell")).not.toBeNull());
    if (row.shows) {
      expect(toggle()).not.toBeNull();
      expect(aside()).not.toBeNull();
      expect(loads.drawer, "closed: the drawer's code is not fetched yet").toBe(0);
      toggle()!.click();
      await vi.waitFor(() => expect(host.querySelector(".developer-heading h2")?.textContent).toBe("Developer tools"));
      // The folds draw their bodies only when open: open them all, and the panels' module is fetched by the first one drawn.
      for (const fold of host.querySelectorAll<HTMLButtonElement>('.developer-tools button[aria-expanded="false"]')) fold.click();
      await vi.waitFor(() => expect(loads.drawer).toBe(1));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 20)); // a negative: give any stray fetch a turn to start
      expect(toggle()).toBeNull();
      expect(aside()).toBeNull();
      expect(host.querySelector(".developer-mode-toggle")).toBeNull();
      expect(host.querySelector(".view-link-button, [data-copy-view-link]")).toBeNull();
      expect(loads.drawer).toBe(0);
    }
  });

  it("a React rebuild with a new scene keeps the value it was built with", async () => {
    const m = await modules();
    for (const on of [true, false]) {
      const el = document.createElement("div");
      document.body.append(el);
      const rootFor = m.createRoot(el);
      const ready = (scene: InstanceType<Modules["Scene"]>) => new Promise<void>((resolve, reject) => m.flushSync(() => rootFor.render(m.h(m.AstraeusScene, { scene, developerTools: on, onReady: () => resolve(), onError: reject }))));
      await ready(makeScene(m));
      await vi.waitFor(() => expect(el.querySelector(".astraeus-shell")).not.toBeNull());
      expect(el.querySelector('button[aria-label="Developer mode"]') !== null).toBe(on);
      await ready(makeScene(m)); // a new scene object rebuilds the viewer
      await vi.waitFor(() => expect(el.querySelector(".astraeus-shell")).not.toBeNull());
      expect(el.querySelector('button[aria-label="Developer mode"]') !== null).toBe(on);
      m.flushSync(() => rootFor.unmount());
      el.remove();
    }
  });
});
