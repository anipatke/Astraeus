// @vitest-environment happy-dom
// The top-bar switch only reports a press to the callback and does not navigate or touch the address (O-059 T-272); a made-up choice (ARCH-03).
import { afterEach, describe, expect, it } from "vitest";
import { $, mountShell, press, type Mounted } from "./domSetup";
import type { ExperienceSwitch } from "../src/shell/SwitchControl";

let m: Mounted;
afterEach(() => { m.unmount(); });

describe("switch control", () => {
  it("hands the pressed option's value to the callback, and a press of the pressed option nothing", () => {
    const chosen: string[] = [];
    const switcher: ExperienceSwitch = {
      label: "Made-up choice", param: "pick", choose: (value) => { chosen.push(value); },
      options: [{ label: "One", value: "one", active: true }, { label: "Two", value: "two", active: false }],
    };
    const before = window.location.href;
    m = mountShell({ switcher });
    press($(m.container, '[data-switch-value="two"]'));
    expect(chosen).toEqual(["two"]);
    press($(m.container, '[data-switch-value="one"]'));
    expect(chosen).toEqual(["two"]);
    expect(window.location.href).toBe(before);
  });
});
