import { describe, expect, it } from "vitest";
import { FIT_ERROR_PLANETS, fitErrorsOf } from "../tools/import/moon-fit-errors.mjs";
import { readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";

/** I-050: astraeus-data-<planet>/data/<planet>-moons/fit-errors.json holds each moon's worst measured error from its fit index (rewrite with `node tools/import/moon-fit-errors.mjs`). */

describe("moon fit errors follow the fit indexes", () => {
  for (const planet of FIT_ERROR_PLANETS as string[]) {
    it(`${planet}: the shipped file equals the index's worst figures`, () => {
      expect(readJson(`${moonDataFolder(planet)}fit-errors.json`)).toEqual(fitErrorsOf(planet));
    });
  }
});
