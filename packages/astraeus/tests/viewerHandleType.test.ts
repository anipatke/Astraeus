import { expectTypeOf, it } from "vitest";
import type { MountedScene, ViewerHandle } from "../src/api";

// The mount handle is the shared handle plus `ready` and `unmount`; a member added to one and not the other fails the typecheck.
it("MountedScene is ViewerHandle plus ready and unmount", () => {
  expectTypeOf<Omit<MountedScene, "ready" | "unmount">>().toEqualTypeOf<ViewerHandle>();
  expectTypeOf<MountedScene>().toMatchTypeOf<ViewerHandle>();
});
