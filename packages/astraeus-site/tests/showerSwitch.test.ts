// The site's shower switch (O-042 T-176: moved here from the showers demo, which imports only `astraeus`).
import { describe, expect, it } from "vitest";
import { chooseShower, SHOWER_PARAM, SHOWER_SWITCH_LABEL, showerEntryName } from "../src/showerSwitch";

describe("shower switch (T-171)", () => {
  it("names the address parameter and the label the shower switch carries", () => {
    const choice = chooseShower([{ name: "b", label: "B", order: 2 }, { name: "a", label: "A", order: 1 }], null)!;
    expect(choice.name).toBe("a");
    expect(choice.switcher).toMatchObject({ label: SHOWER_SWITCH_LABEL, param: SHOWER_PARAM });
    expect(SHOWER_PARAM).toBe("shower");
  });

  it("names an entry file by its file name", () => {
    expect(showerEntryName("../data/showers/perseids.json")).toBe("perseids");
    expect(showerEntryName("other.json")).toBe("other");
  });
});
