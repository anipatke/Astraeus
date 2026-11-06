// @vitest-environment happy-dom
// O-059 T-269: the host's picker (`Scene.setPicker`). Each input is changed alone on a made-up scene (ARCH-03); the lifecycle and two-viewer suites run the handle and the
// `onPick` prop on both paths. Here: the planner's checks and reads, the definition entry, the control drawn through the existing top bar and drawer, and the link's rules.
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, SceneError, earth, type PickerInput } from "astraeus";
import { ViewerLink } from "../src/api/viewerLink";
import { pickerSwitch } from "../src/app/listSwitch";
import { SwitchControl } from "../src/shell/SwitchControl";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const picker: PickerInput = { id: "world", label: "World", options: [{ value: "tarn", label: "Tarn" }, { value: "mere", label: "Mere" }, { value: "fen", label: "Fen" }], value: "mere" };
const base = () => new Scene().addBody(earth);

describe("Scene.setPicker", () => {
  it("is absent by default; set, it reads back frozen, and the definition carries it", () => {
    expect(base().picker).toBeUndefined();
    expect(base().toDefinition([{ name: "made-up", provides: ["earth"] }]).picker).toBeUndefined();
    const scene = base().setPicker(picker);
    expect(scene.picker).toEqual(picker);
    expect(Object.isFrozen(scene.picker)).toBe(true);
    expect(Object.isFrozen(scene.picker!.options[0])).toBe(true);
    expect(scene.toDefinition([{ name: "made-up", provides: ["earth"] }]).picker).toEqual(picker);
  });
  it("replaces the whole picker, and does not keep the caller's object", () => {
    const options = [{ value: "a", label: "A" }, { value: "b", label: "B" }];
    const scene = base().setPicker(picker).setPicker({ id: "other", label: "Other", options, value: "b" });
    expect(scene.picker!.id).toBe("other");
    expect(scene.picker!.options).toHaveLength(2);
    (options as { value: string }[])[0]!.value = "changed";
    expect(scene.picker!.options[0]!.value).toBe("a");
  });
  it("refuses each malformed input alone with bad-picker (one input changed, the rest as in the good picker)", () => {
    const bad = (change: Record<string, unknown>) => codeOf(() => base().setPicker({ ...picker, ...change } as PickerInput));
    expect(bad({ id: "" })).toMatch(/^bad-picker: setPicker: the picker needs a non-empty id/);
    expect(bad({ label: "" })).toMatch(/^bad-picker: .*needs a label/);
    expect(bad({ options: "x" })).toMatch(/^bad-picker: .*options must be a list/);
    expect(bad({ options: [{ value: "", label: "A" }, picker.options[1]] })).toMatch(/^bad-picker: .*non-empty value/);
    expect(bad({ options: [{ value: "tarn", label: "" }, picker.options[1]] })).toMatch(/^bad-picker: .*option "tarn" needs a label/);
    expect(bad({ options: [picker.options[0], picker.options[0]] })).toMatch(/^bad-picker: .*option "tarn" appears twice/);
    expect(bad({ value: "nope" })).toMatch(/^bad-picker: .*value "nope" is not one of the options/);
    expect(codeOf(() => base().setPicker(undefined as never))).toMatch(/^bad-picker/);
  });
});

describe("the picker control (the top bar and the phone drawer draw this one control; the lifecycle and two-viewer suites find it in the real viewer)", () => {
  let host: HTMLElement | undefined;
  afterEach(() => { host?.remove(); host = undefined; });
  const draw = (choice: ReturnType<typeof pickerSwitch>): HTMLElement => {
    host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host!).render(createElement(SwitchControl, { choice })));
    return host;
  };
  it("draws one button per option, the pressed one marked, named by the label and carrying the id; a press calls choose and nothing else", () => {
    const choose = vi.fn();
    const navigate = vi.spyOn(window.history, "pushState");
    const element = draw(pickerSwitch(picker, "mere", choose));
    const group = element.querySelector("[role=group]")!;
    expect(group.getAttribute("aria-label")).toBe("World");
    expect(group.getAttribute("data-switch-param")).toBe("world");
    expect([...element.querySelectorAll("button[data-switch-value]")].map((button) => [button.getAttribute("data-switch-value"), button.getAttribute("aria-pressed")])).toEqual([["tarn", "false"], ["mere", "true"], ["fen", "false"]]);
    element.querySelector<HTMLButtonElement>("[data-switch-value=mere]")!.click();
    expect(choose).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>("[data-switch-value=fen]")!.click();
    expect(choose).toHaveBeenCalledExactlyOnceWith("fen");
    expect(navigate).not.toHaveBeenCalled();
  });
  it("draws no control with fewer than two options", () => {
    const element = draw(pickerSwitch({ id: "one", label: "One", options: [{ value: "a", label: "A" }] }, "a", vi.fn()));
    expect(element.querySelector("[data-switch-param]")).toBeNull();
  });
});

describe("the picker on the link", () => {
  const control = (picker?: { id: string; values: string[]; start: string }) => ({ ...(picker === undefined ? {} : { picker }), read: () => ({}), readCamera: () => undefined }) as never;
  it("a press is told with the picker id and the value, the pressed option stays, and setPick moves it with no signal", () => {
    const link = new ViewerLink();
    link.attach(control({ id: "world", values: ["a", "b"], start: "a" }));
    const heard: unknown[] = [];
    const watched = vi.fn();
    link.onPick((change) => heard.push(change));
    link.watchPick(watched);
    link.picked("a");
    expect(heard, "the pressed option is not a change").toEqual([]);
    link.picked("b");
    expect(heard).toEqual([{ picker: "world", value: "b" }]);
    expect(link.pick).toBe("a");
    expect(watched).not.toHaveBeenCalled();
    link.setPick("b");
    expect(link.pick).toBe("b");
    expect(watched).toHaveBeenCalledTimes(1);
    expect(heard).toHaveLength(1);
    expect(codeOf(() => link.setPick("c"))).toMatch(/^bad-picker: setPick: "c" is not one of the picker's options \(a, b\)/);
  });
  it("without a picker pick is undefined and setPick throws bad-picker; before attach setPick throws not-mounted; a rebuild starts again from the new scene's value", () => {
    const link = new ViewerLink();
    expect(codeOf(() => link.setPick("a"))).toMatch(/^not-mounted/);
    link.attach(control());
    expect(link.pick).toBeUndefined();
    expect(codeOf(() => link.setPick("a"))).toMatch(/^bad-picker: setPick: the scene has no picker/);
    link.detach();
    link.attach(control({ id: "world", values: ["a", "b"], start: "a" }));
    link.setPick("b");
    link.detach();
    expect(link.pick).toBeUndefined();
    link.attach(control({ id: "world", values: ["a", "b"], start: "a" }));
    expect(link.pick).toBe("a");
  });
  it("a listener that throws is told to the page and spares the next; close ends every listener", () => {
    const link = new ViewerLink();
    const reported: unknown[] = [];
    vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
    link.attach(control({ id: "world", values: ["a", "b"], start: "a" }));
    const heard: string[] = [];
    link.onPick(() => { throw new Error("host bug"); });
    link.onPick((change) => heard.push(change.value));
    link.picked("b");
    expect(heard).toEqual(["b"]);
    expect(reported).toHaveLength(1);
    link.close();
    link.attach(control({ id: "world", values: ["a", "b"], start: "a" }));
    link.picked("b");
    expect(heard).toEqual(["b"]);
    vi.unstubAllGlobals();
  });
});
