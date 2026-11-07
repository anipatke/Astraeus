import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PICTURES } from "astraeus-data";
import { checkPacks, enginePeerRange, extensionlessImports, LIMITS, pastTheEntry, ringFactProblems, strayFiles } from "../../../tools/check-packs.mjs";
import { PACKAGES } from "../../../tools/build-packages.mjs";

// O-036 T-161: the publishable packages build and pack within the decided contents and sizes (the same check as `npm run check:pack`).
// Slow part first: one build and eight `npm pack --dry-run` runs, about 12 s.
describe("publishable packages", () => {
  it("every package builds, packs only allowed files and stays under its limits", () => {
    const result = checkPacks();
    expect(result.problems).toEqual([]);
    expect(result.rows.map((row) => row.name)).toEqual([...PACKAGES]);
    expect(Object.keys(LIMITS).sort()).toEqual([...PACKAGES].sort());
  }, 120_000);

  it("fails on a test file, a source file and a cache folder in a package", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    mkdirSync(join(dist, "src", "tests"), { recursive: true });
    writeFileSync(join(dist, "src", "x.test.js"), "");
    writeFileSync(join(dist, "src", "stray.ts"), "");
    writeFileSync(join(dist, "src", "notes.txt"), "");
    try {
      const result = checkPacks({ build: false, only: ["astraeus-data-pluto"] });
      expect(result.ok).toBe(false);
      expect(result.problems).toEqual(expect.arrayContaining([
        "astraeus-data-pluto: forbidden file src/x.test.js",
        "astraeus-data-pluto: forbidden file src/stray.ts",
        "astraeus-data-pluto: unexpected file src/notes.txt",
      ]));
    } finally {
      rmSync(join(dist, "src", "tests"), { recursive: true, force: true });
      rmSync(join(dist, "src", "x.test.js"), { force: true });
      rmSync(join(dist, "src", "stray.ts"), { force: true });
      rmSync(join(dist, "src", "notes.txt"), { force: true });
    }
  }, 60_000);

  it("passes a new module and names a stray file in astraeus (O-051 T-218)", () => {
    const source = join(__dirname, "..", "..", "astraeus");
    const listed = ["src", "data", "README.md", "licenses"];
    expect(strayFiles(["package.json", "README.md", "licenses/x.txt", "src/api/scene.js", "src/api/scene.d.ts", "src/api/index.node.js", "src/app/style.css", "data/orbits/io.json"], source, listed)).toEqual([]);
    expect(strayFiles(["src/api/planted.js", "src/api/planted.d.ts", "src/api/scene.txt", "data/orbits/planted.json", "notes.md", "scratch/a.js"], source, listed))
      .toEqual(["src/api/planted.js", "src/api/planted.d.ts", "src/api/scene.txt", "data/orbits/planted.json", "notes.md", "scratch/a.js"]);
  });

  it("fails the pack check on a planted stray file in the astraeus build", () => {
    const dist = join(__dirname, "..", "..", "astraeus", "dist");
    writeFileSync(join(dist, "src", "api", "planted.js"), "export {};\n");
    try {
      expect(checkPacks({ build: false, only: ["astraeus"] }).problems).toContain("astraeus: stray file src/api/planted.js (no source module or listed file behind it)");
    } finally {
      rmSync(join(dist, "src", "api", "planted.js"), { force: true });
    }
  }, 60_000);

  it("states the engine's current minor as every data package's astraeus peer, and all of React 19 as the engine's React peers (O-053 T-230, API-07)", () => {
    expect(enginePeerRange("0.7.0")).toBe(">=0.7.0 <0.8.0");
    expect(enginePeerRange("0.8.2")).toBe(">=0.8.0 <0.9.0");
    expect(enginePeerRange("1.2.3")).toBe(">=1.2.0 <2.0.0");
    const engine = JSON.parse(readFileSync(join(__dirname, "..", "..", "astraeus", "package.json"), "utf8")) as { version: string; peerDependencies: Record<string, string> };
    expect(engine.peerDependencies.react).toBe(">=19 <20");
    expect(engine.peerDependencies["react-dom"]).toBe(">=19 <20");
    for (const name of PACKAGES.filter((one) => one.startsWith("astraeus-data"))) {
      const manifest = JSON.parse(readFileSync(join(__dirname, "..", "..", name, "package.json"), "utf8")) as { peerDependencies: Record<string, string> };
      expect(manifest.peerDependencies.astraeus, name).toBe(enginePeerRange(engine.version));
    }
  });

  it("fails the pack check when a data package's astraeus peer floor is not the engine's minor, and when the engine's React peer stops short of 19.x", () => {
    const manifestOf = (name: string): string => join(__dirname, "..", "..", name, "dist", "package.json");
    const data = manifestOf("astraeus-data-pluto");
    const engine = manifestOf("astraeus");
    const dataOriginal = readFileSync(data, "utf8");
    const engineOriginal = readFileSync(engine, "utf8");
    try {
      for (const stale of [">=0.1.0 <1.0.0", ">=0.6.0 <0.7.0", ">=0.7.0 <1.0.0"]) {
        writeFileSync(data, dataOriginal.replace(/"astraeus": "[^"]*"/, `"astraeus": "${stale}"`));
        expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain(`astraeus-data-pluto: astraeus peer is ${stale}, the engine's current minor is >=0.7.0 <0.8.0`);
      }
      writeFileSync(engine, engineOriginal.replace('"react": ">=19 <20"', '"react": ">=19 <19.4"'));
      expect(checkPacks({ build: false, only: ["astraeus"] }).problems).toContain("astraeus: react peer is >=19 <19.4, it must cover all of React 19 (>=19 <20)");
    } finally {
      writeFileSync(data, dataOriginal);
      writeFileSync(engine, engineOriginal);
    }
    expect(checkPacks({ build: false, only: ["astraeus-data-pluto", "astraeus"] }).problems).toEqual([]);
  }, 60_000);

  it("fails on a compiled file with an extensionless relative import (webpack 5, I-077)", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    writeFileSync(join(dist, "src", "bad.js"), 'export { a } from "./chunks";\nconst b = await import("../x/y");\nexport * from "./chunks.js";\n');
    try {
      expect(extensionlessImports(dist)).toEqual(["src/bad.js: ./chunks", "src/bad.js: ../x/y"]);
      expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain("astraeus-data-pluto: extensionless relative import in src/bad.js: ./chunks");
    } finally {
      rmSync(join(dist, "src", "bad.js"), { force: true });
    }
  }, 60_000);

  it("fails on a chunk URL a bundler could inline, and on a missing chunk list type (I-078)", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    const list = join(dist, "src", "chunks.js");
    const types = join(dist, "src", "chunks.d.ts");
    const original = readFileSync(list, "utf8");
    const declaration = readFileSync(types, "utf8");
    const problem = "astraeus-data-pluto: a chunk URL in src/chunks.js lacks ?no-inline (Vite would inline it)";
    try {
      for (const broken of [original.replace("?no-inline", ""), original.replace("?no-inline", "?no-inline=0")]) {
        writeFileSync(list, broken);
        expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain(problem);
      }
      writeFileSync(list, original);
      rmSync(types);
      expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain("astraeus-data-pluto: src/chunks.d.ts is missing (chunkUrls would be untyped)");
    } finally {
      writeFileSync(list, original);
      writeFileSync(types, declaration);
    }
  }, 60_000);
});

describe("astraeus-data credits (PROV-02)", () => {
  it("every picture carries a licence with a credit and a source page", () => {
    expect(Object.keys(PICTURES).length).toBe(16);
    for (const [name, texture] of Object.entries(PICTURES)) {
      expect(texture.licence, name).toBeDefined();
      expect(texture.licence!.attribution, name).toBeTruthy();
      expect(texture.licence!.url, name).toMatch(/^https:\/\//);
    }
  });

  // O-057 I-147: the consumer checks use only the package's public entry, and the ring facts live in check:pack.
  describe("consumer checks stay on the public entry (API-01)", () => {
    const tools = join(__dirname, "..", "..", "..", "tools");
    // The planted lines are built from parts so the boundary test (which scans this file for imports) does not read them as imports.
    const IMPORT = ["imp", "ort"].join("");
    const FROM = ["fr", "om"].join("");
    it.each(["check-node-consumer.mjs", "check-react-consumer.mjs"])("%s imports nothing past the public entry", (file) => {
      expect(pastTheEntry(readFileSync(join(tools, file), "utf8"))).toEqual([]);
    });

    it.each([
      ["a packed subpath", `${IMPORT} { catalogue } ${FROM} 'astraeus${"/assets"}/catalogue.js';`],
      ["a URL built from the resolved entry", `const { catalogue } = await ${IMPORT}(new URL('../assets/catalogue.js', import.meta.resolve('astraeus')).href);`],
      ["a relative import into the unpacked package", `await ${IMPORT}('./src/assets/catalogue.js');`],
      ["a path into the unpacked package", "const file = join(dir, 'node_modules/astraeus/src/assets/catalogue.js');"],
      ["a path into the unpacked package given in parts", "const file = join(dir, 'node_modules', 'astraeus', 'src', 'assets', 'catalogue.js');"],
      ["a path from the package folder given in parts", "const file = join(pkg, `astraeus`, \"src\", 'assets');"],
    ])("planted: %s is named", (_name, line) => {
      expect(pastTheEntry(`import { Scene } from "astraeus";\n${line}\n`).length).toBeGreaterThan(0);
    });

    it("allows the public entry, its style sheet and its manifest", () => {
      expect(pastTheEntry(["const manifest = join(dir, 'node_modules', 'astraeus', 'package.json');"].join("\n"))).toEqual([]);
      expect(pastTheEntry([`${IMPORT} { Scene } ${FROM} "astraeus";`, `${IMPORT} "astraeus${"/style"}.css";`, `${IMPORT} pkg ${FROM} "astraeus${"/package"}.json";`].join("\n"))).toEqual([]);
    });

    it("the packed engine holds the ring facts: Saturn has bands, Mars none (named case, on the packed build)", () => {
      expect(ringFactProblems(join(__dirname, "..", "..", "astraeus", "dist"))).toEqual([]);
    });

    it("planted: a catalogue with no Saturn bands, and one with Mars rings, are named (in a scratch folder, not a package build)", () => {
      const dir = mkdtempSync(join(tmpdir(), "ring-facts-"));
      const file = join(dir, "src", "assets", "catalogue.js");
      mkdirSync(join(dir, "src", "assets"), { recursive: true });
      try {
        writeFileSync(file, "export const catalogue = { get: (id) => ({ visual: { rings: id === 'mars' ? { bands: [1] } : undefined } }) };");
        expect(ringFactProblems(dir)).toEqual(["astraeus: the packed catalogue gives Saturn no ring bands", "astraeus: the packed catalogue gives Mars rings"]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
