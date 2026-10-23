import { describe, expect, it } from "vitest";
import { FIT_ERROR_PLANETS, fitErrorsOf } from "../tools/import/moon-fit-errors.mjs";
import { readJson } from "../tools/import/test-io.mjs";

/** I-050: data/moons/fit-errors/<planet>.json holds each moon's worst measured error from its fit index (rewrite with `node tools/import/moon-fit-errors.mjs`). */
const ROOT = new URL("../", import.meta.url).pathname;

describe("moon fit errors follow the fit indexes", () => {
  for (const planet of FIT_ERROR_PLANETS as string[]) {
    it(`${planet}: the shipped file equals the index's worst figures`, () => {
      expect(readJson(`${ROOT}data/moons/fit-errors/${planet}.json`)).toEqual(fitErrorsOf(planet));
    });
  }
});
