import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { checkEngineLicences, gatherPackageCredits } from "../tools/site/package-credits.mjs";

/** T-157 (ARCH-03): the site gathers each package's licence and credit records without naming the package. */
const made = mkdtempSync(join(tmpdir(), "astraeus-credits-"));
afterAll(() => rmSync(made, { recursive: true, force: true }));

describe("gatherPackageCredits", () => {
  it("picks up a made-up demo package's own records with no site change", () => {
    const demo = join(made, "packages", "astraeus-demo-madeup");
    mkdirSync(join(demo, "credits"), { recursive: true });
    mkdirSync(join(demo, "data", "stories"), { recursive: true });
    writeFileSync(join(demo, "package.json"), "{}");
    writeFileSync(join(demo, "credits", "MADEUP.txt"), "Made-up credit");
    writeFileSync(join(demo, "data", "stories", "orbits.json"), JSON.stringify({ provenance: { licence: "CC BY 4.0" } }));
    writeFileSync(join(demo, "data", "stories", "plain.json"), JSON.stringify({ rows: [] }));
    const found = gatherPackageCredits(made);
    expect(found).toEqual([{ package: "astraeus-demo-madeup", licenceFiles: ["credits/MADEUP.txt"], dataLicences: [{ file: "data/stories/orbits.json", licence: "CC BY 4.0" }] }]);
  });

  it("finds the real engine's library licences and the shipped demos' data licences", () => {
    expect(checkEngineLicences()).toEqual({ ok: true, missing: [] });
    const found = gatherPackageCredits();
    for (const demo of ["astraeus-demo-apollo11", "astraeus-demo-showers", "astraeus-demo-planets"]) {
      expect(found.find((entry) => entry.package === demo)?.licenceFiles.length ?? 0, demo).toBeGreaterThan(0);
    }
    expect(found.find((entry) => entry.package === "astraeus-demo-showers")?.dataLicences.some((d) => d.licence === "CC BY 4.0")).toBe(true);
  });
});
