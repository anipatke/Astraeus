import { describe, expect, it } from "vitest";
import { PICTURES, dataSource } from "astraeus-data";
import { milkyWaySource } from "astraeus-data/milky-way";

// O-076 T-321: the Milky Way alone, for a sky-only app; the whole package carries the very same record.
describe("astraeus-data/milky-way", () => {
  it("offers the Milky Way picture alone, as a source that provides no bodies", () => {
    expect(milkyWaySource.name).toBe("astraeus-data/milky-way");
    expect(milkyWaySource.provides).toEqual([]);
    expect(Object.keys(milkyWaySource.pictures ?? {})).toEqual(["milky-way"]);
  });

  it("is the same picture record, licence included, as the whole package's", () => {
    expect(milkyWaySource.pictures?.["milky-way"]).toBe(PICTURES["milky-way"]);
    expect(PICTURES["milky-way"]).toMatchObject({
      widthPx: 3840,
      heightPx: 1920,
      licence: { licence: "CC BY-SA 4.0", accessed: "2026-10-29" },
    });
    expect(dataSource.pictures?.["milky-way"]).toBe(PICTURES["milky-way"]);
  });
});
