import { describe, expect, it } from "vitest";
import { pickOpensInfo } from "../src/shell/phoneLayout";

// Owner, 2026-10-22: on desktop a click on a body (e.g. Halimede) flies there and opens its card; on the phone a tap only flies there.
describe("a body picked in the scene", () => {
  it("opens its information card on the desktop layout", () => {
    expect(pickOpensInfo(false)).toBe(true);
  });
  it("only flies there on the phone layout", () => {
    expect(pickOpensInfo(true)).toBe(false);
  });
});
