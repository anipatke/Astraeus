import { expectTypeOf, it } from "vitest";
import type { AstraeusSceneProps, MountedScene, ViewerHandle } from "../src/api";

// The mount handle is the shared handle plus `ready` and `unmount`; a member added to one and not the other fails the typecheck.
it("MountedScene is ViewerHandle plus ready and unmount", () => {
  expectTypeOf<Omit<MountedScene, "ready" | "unmount">>().toEqualTypeOf<ViewerHandle>();
  expectTypeOf<MountedScene>().toMatchTypeOf<ViewerHandle>();
});

it("AstraeusScene hands React the same handle through ref and onReady", () => {
  expectTypeOf<AstraeusSceneProps["ref"]>().toEqualTypeOf<import("react").Ref<ViewerHandle> | undefined>();
  expectTypeOf<Parameters<NonNullable<AstraeusSceneProps["onReady"]>>[0]>().toEqualTypeOf<ViewerHandle>();
});
