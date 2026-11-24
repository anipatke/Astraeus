// @vitest-environment happy-dom
// O-095 T-443: `ActionsControl.setEnabled` switches one button off and on. The view is drawn on its own with a bare runtime and the descriptor's own control, so the case needs no viewer (the viewer path is in lifecycle.test.ts).
import { createElement as h } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneError } from "../src/api/errors";
import { makeCell, type ShelfBlock, type ShelfRuntime } from "../src/app/shelfContract";
import { actions, type ActionsControl } from "../src/shelf/actions/factory";
import { blockOf } from "../src/shelf/part";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const codeOf = (run: () => void): string => {
  try {
    run();
  } catch (error) {
    return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error);
  }
  return "no error";
};

function draw() {
  const block: ShelfBlock = blockOf(
    actions({
      id: "fly",
      actions: [
        { id: "ceres", label: "Ceres", camera: { focus: "ceres" } },
        { id: "plain", label: "Plain" },
      ],
    }),
  );
  const cell = makeCell(block.initial);
  const heard: unknown[] = [];
  const moves: unknown[] = [];
  const runtime: ShelfRuntime = {
    element: () => undefined,
    cell: () => cell,
    report: (_id, event) => void heard.push(event),
    moveCamera: (request) => void moves.push(request),
  };
  const control = block.control!(
    { cell: () => cell, element: () => undefined, listen: () => () => {} },
    block,
  ) as ActionsControl;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(h(block.view, { block, runtime })));
  const button = (id: string) => host.querySelector<HTMLButtonElement>(`[data-shelf-action="${id}"]`)!;
  return { control, button, heard, moves, root, host };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("ActionsControl.setEnabled (O-095 T-443)", () => {
  it("switches a button off and on: off is disabled and a press neither turns the camera nor reports, on restores both", () => {
    const { control, button, heard, moves } = draw();
    expect(button("ceres").disabled).toBe(false);
    flushSync(() => control.setEnabled("ceres", false));
    expect(button("ceres").disabled).toBe(true);
    expect(button("plain").disabled).toBe(false);
    flushSync(() => button("ceres").click());
    expect([moves, heard]).toEqual([[], []]);
    flushSync(() => button("plain").click());
    expect(heard).toEqual([{ part: "fly", action: "plain" }]);
    flushSync(() => control.setEnabled("ceres", true));
    expect(button("ceres").disabled).toBe(false);
    flushSync(() => button("ceres").click());
    expect(moves).toEqual([{ kind: "focus", target: "ceres" }]);
    expect(heard).toHaveLength(2);
  });

  it("an unknown action id or a non-boolean enabled is bad-part naming the field, and changes nothing", () => {
    const { control, button } = draw();
    expect(codeOf(() => control.setEnabled("nope", false))).toMatch(
      /^bad-part: ActionsControl\.setEnabled: actionId "nope"/,
    );
    expect(codeOf(() => control.setEnabled(7 as unknown as string, false))).toMatch(/^bad-part: .*actionId 7/);
    expect(codeOf(() => control.setEnabled("ceres", "no" as unknown as boolean))).toMatch(/^bad-part: .*enabled/);
    expect(codeOf(() => control.setEnabled("ceres", undefined as unknown as boolean))).toMatch(/^bad-part: .*enabled/);
    expect(button("ceres").disabled).toBe(false);
  });
});
