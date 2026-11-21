// @vitest-environment happy-dom
// T-344: <AstraeusScene scene={not a Scene}> reports a coded `bad-scene` SceneError through onError, not the engine's own TypeError.
import { createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { AstraeusScene, SceneError, type Scene } from "astraeus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

describe("<AstraeusScene> given something that is not a Scene", () => {
  it.each([{ name: "an empty object", value: {} }, { name: "null", value: null }])("$name -> bad-scene through onError", async ({ value }) => {
    const errors: unknown[] = [];
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    flushSync(() => root.render(h(AstraeusScene, { scene: value as unknown as Scene, onError: (error: Error) => errors.push(error) })));
    await new Promise<void>((resolve) => setTimeout(resolve, 80));
    root.unmount();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(SceneError);
    expect((errors[0] as SceneError).code).toBe("bad-scene");
  });
});
