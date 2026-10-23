// @vitest-environment happy-dom
// The top-bar switch asks the callback for the address and does not navigate (O-030 T-153); a made-up choice (ARCH-03).
import { afterEach, describe, expect, it } from "vitest";
import { $, mountShell, press, type Mounted } from "./domSetup";
import type { ExperienceSwitch } from "../src/shell/SwitchControl";

let m: Mounted;
afterEach(() => { m.unmount(); });

describe("switch control", () => {
  it("hands the computed address to the callback", () => {
    const opened: string[] = [];
    const switcher: ExperienceSwitch = {
      label: "Made-up choice", param: "pick", open: (address) => { opened.push(address); },
      options: [{ label: "One", value: "one", active: true }, { label: "Two", value: "two", active: false }],
    };
    m = mountShell({ switcher });
    press($(m.container, '[data-switch-value="two"]'));
    expect(opened).toHaveLength(1);
    expect(new URL(opened[0]!).searchParams.get("pick")).toBe("two");
    press($(m.container, '[data-switch-value="one"]'));
    expect(opened).toHaveLength(1);
  });
});
