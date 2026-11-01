import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reactCappers } from "../../../tools/check-react-consumer.mjs";

// check:react-consumer accepts an older React 19.x only when a dependency other than astraeus caps React below the newest (C-137 O1). The capper finder is proved on a made-up install.
describe("React consumer check: who caps React", () => {
  it("names the dependency whose range excludes the newest React, and ignores astraeus and satisfied ranges", () => {
    const dir = mkdtempSync(join(tmpdir(), "astraeus-react-cap-"));
    try {
      const add = (name: string, json: object): void => { mkdirSync(join(dir, "node_modules", name), { recursive: true }); writeFileSync(join(dir, "node_modules", name, "package.json"), JSON.stringify({ name, version: "1.0.0", ...json })); };
      add("@scope/fiber", { peerDependencies: { react: ">=19 <19.4", "react-dom": ">=19 <19.4" } });
      add("astraeus", { peerDependencies: { react: ">=19 <19.3" } });
      add("fine", { peerDependencies: { react: ">=18" } });
      add("plain", {});
      expect(reactCappers(dir, "19.5.0")).toEqual(["@scope/fiber@1.0.0 (react >=19 <19.4)", "@scope/fiber@1.0.0 (react-dom >=19 <19.4)"]);
      expect(reactCappers(dir, "19.3.1")).toEqual([]);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
