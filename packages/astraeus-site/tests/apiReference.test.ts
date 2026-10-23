// O-040 T-165: the API reference is generated from the engine's public entry, and every export of that entry carries a doc comment.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApiPage, collectExports, undocumentedExports } from "../tools/site/api-reference.mjs";

describe("API reference", () => {
  it("has a doc comment on every export of the public entry", () => {
    expect(undocumentedExports()).toEqual([]);
  });

  it("names an export that has no doc comment (proved on a made-up entry)", () => {
    const dir = mkdtempSync(join(tmpdir(), "astraeus-api-doc-"));
    try {
      const entry = join(dir, "index.ts");
      writeFileSync(entry, "/** Documented. */\nexport const kept = 1;\nexport function forgotten(): number { return 2; }\nexport interface AlsoForgotten { readonly a: number }\n");
      expect(undocumentedExports(entry)).toEqual(["forgotten", "AlsoForgotten"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("lists the public calls, the React component and the ready-made bodies, with examples for Scene, mount and AstraeusScene", () => {
    const items = collectExports();
    const names = items.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(["Scene", "SceneCamera", "mount", "AstraeusScene", "AstraeusSceneProps", "SceneError", "trueScale", "readableScale", "earth", "titan"]));
    for (const name of ["Scene", "mount", "AstraeusScene"]) expect(items.find((item) => item.name === name)?.examples.length, name).toBeGreaterThan(0);
    const page = buildApiPage();
    for (const name of names) expect(page, name).toContain(name);
    expect(page).toContain("addTrajectory");
    expect(page).toContain('name="viewport"');
    expect(page).not.toContain("<script");
  });
});
