import { expectTypeOf, describe, expect, it } from "vitest";
import { Scene, earth, readableScale, trueScale, type ScaleId, type ScalePolicy, type ViewerChange, type ViewerHandle } from "astraeus";

// The scale is a closed choice of three ids; these are compile-time checks (the typecheck gate), plus one runtime row.
describe("the scale setting is the three built-in choices", () => {
  it("ScaleId is exactly the three ids and every public carrier uses it", () => {
    expectTypeOf<ScaleId>().toEqualTypeOf<"true-scale" | "readable-scale" | "solar-system">();
    expectTypeOf<ScalePolicy["id"]>().toEqualTypeOf<ScaleId>();
    expectTypeOf<Scene["scales"]>().toEqualTypeOf<readonly ScaleId[]>();
    expectTypeOf<ViewerHandle["scale"]>().toEqualTypeOf<ScaleId | undefined>();
    expectTypeOf<ViewerChange["scale"]>().toEqualTypeOf<ScaleId>();
    expectTypeOf<Parameters<ViewerHandle["setScale"]>[0]>().toEqualTypeOf<ScaleId>();
  });

  it("the handle and the scene refuse a fourth id at compile time", () => {
    const handle = {} as ViewerHandle;
    const scene = new Scene().addBody(earth);
    const noRun = (): void => {
      handle.setScale("true-scale");
      handle.setScale("readable-scale");
      handle.setScale("solar-system");
      // @ts-expect-error a fourth id is not a scale
      handle.setScale("huge");
      scene.setScale(trueScale);
      scene.setScale(readableScale);
      // @ts-expect-error a policy with another id is not a scale
      scene.setScale({ id: "huge", mapPosition: trueScale.mapPosition, mapRadius: trueScale.mapRadius });
    };
    expect(typeof noRun).toBe("function");
  });

  it("a JavaScript caller passing another id still gets bad-scale", () => {
    expect(() => new Scene().addBody(earth).setScale({ id: "huge" } as never)).toThrowError(expect.objectContaining({ code: "bad-scale" }));
  });
});
