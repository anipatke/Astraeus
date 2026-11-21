import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PICTURES } from "astraeus-data";
import {
  codeProblems,
  enginePeerRange,
  extensionlessImports,
  fileListProblems,
  LIMITS,
  packedComments,
  pastTheEntry,
  peerProblems,
  REACT_PEER_RANGE,
  ringFactProblems,
  strayFiles,
  strayProblems,
} from "../../../tools/check-packs.mjs";
import { PACKAGES } from "../../../tools/build-packages.mjs";
import { checkEngineBudget } from "../tools/validate/engine-budget.mjs";

// O-036 T-161, O-086 T-382: every packaging rule is proved here on small made-up inputs (a path list, a manifest, a scratch folder). Nothing here builds or packs a package or reads a packages/*/dist;
// the real build, the real pack, the engine's size and the self-proof of the stray-file and import rules run in `npm run check:pack`.
const scratch = (): string => mkdtempSync(join(tmpdir(), "pack-rules-"));
const write = (dir: string, file: string, text: string): void => {
  mkdirSync(join(dir, ...file.split("/").slice(0, -1)), { recursive: true });
  writeFileSync(join(dir, file), text);
};

describe("publishable packages", () => {
  it("has a limit for every package", () => {
    expect(Object.keys(LIMITS).sort()).toEqual([...PACKAGES].sort());
  });

  // I-164, T-382: the engine's first download is held to ENGINE_LIMIT by `npm run check:pack`; here the rule is proved on a made-up example build.
  it("fails the engine budget over its limit and passes one byte below it, on a made-up example build", () => {
    const dir = scratch();
    try {
      write(dir, "index.html", '<script type="module" src="/assets/engine.js"></script>');
      write(dir, "assets/engine.js", "x".repeat(2_000));
      const measured = checkEngineBudget({ exampleDir: dir, limit: { rawLimit: 1e9, gzipLimit: 1e9 } });
      expect(measured.problems).toEqual([]);
      const exact = checkEngineBudget({ exampleDir: dir, limit: { rawLimit: measured.raw, gzipLimit: measured.gzip } });
      expect(exact.ok).toBe(true);
      const tight = checkEngineBudget({
        exampleDir: dir,
        limit: { rawLimit: measured.raw - 1, gzipLimit: measured.gzip - 1 },
      });
      expect(tight.ok).toBe(false);
      expect(tight.problems).toHaveLength(2);
      expect(checkEngineBudget({ exampleDir: join(dir, "missing") }).ok).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on a test file, a source file and an unlisted file in a package", () => {
    expect(
      fileListProblems("astraeus-data-pluto", [
        "package.json",
        "src/index.js",
        "src/x.test.js",
        "src/stray.ts",
        "src/notes.txt",
      ]),
    ).toEqual([
      "astraeus-data-pluto: forbidden file src/x.test.js",
      "astraeus-data-pluto: forbidden file src/stray.ts",
      "astraeus-data-pluto: unexpected file src/notes.txt",
    ]);
  });
  it("passes a new module and names a stray file in astraeus (O-051 T-218)", () => {
    const source = join(__dirname, "..", "..", "astraeus");
    const listed = ["src", "data", "README.md", "licenses"];
    expect(
      strayFiles(
        [
          "package.json",
          "README.md",
          "licenses/x.txt",
          "src/api/scene.js",
          "src/api/scene.d.ts",
          "src/api/index.node.js",
          "src/app/style.css",
          "data/orbits/io.json",
        ],
        source,
        listed,
      ),
    ).toEqual([]);
    expect(
      strayFiles(
        [
          "src/api/planted.js",
          "src/api/planted.d.ts",
          "src/api/scene.txt",
          "data/orbits/planted.json",
          "notes.md",
          "scratch/a.js",
        ],
        source,
        listed,
      ),
    ).toEqual([
      "src/api/planted.js",
      "src/api/planted.d.ts",
      "src/api/scene.txt",
      "data/orbits/planted.json",
      "notes.md",
      "scratch/a.js",
    ]);
  });

  it("names a planted stray file in the astraeus pack list", () => {
    expect(strayProblems("astraeus", ["package.json", "src/api/planted.js"])).toEqual([
      "astraeus: stray file src/api/planted.js (no source module or listed file behind it)",
    ]);
    expect(strayProblems("astraeus-data-pluto", ["src/api/planted.js"])).toEqual([]);
  });

  it("states the engine's current minor as every data package's astraeus peer, and all of React 19 as the engine's React peers (O-053 T-230, API-07)", () => {
    expect(enginePeerRange("0.7.0")).toBe(">=0.7.0 <0.8.0");
    expect(enginePeerRange("0.8.2")).toBe(">=0.8.0 <0.9.0");
    expect(enginePeerRange("1.2.3")).toBe(">=1.2.0 <2.0.0");
    const engine = JSON.parse(readFileSync(join(__dirname, "..", "..", "astraeus", "package.json"), "utf8")) as {
      version: string;
      peerDependencies: Record<string, string>;
    };
    expect(engine.peerDependencies.react).toBe(">=19 <20");
    expect(engine.peerDependencies["react-dom"]).toBe(">=19 <20");
    for (const name of PACKAGES.filter((one) => one.startsWith("astraeus-data"))) {
      const manifest = JSON.parse(readFileSync(join(__dirname, "..", "..", name, "package.json"), "utf8")) as {
        peerDependencies: Record<string, string>;
      };
      expect(manifest.peerDependencies.astraeus, name).toBe(enginePeerRange(engine.version));
    }
  });

  it("fails when a data package's astraeus peer floor is not the engine's minor, and when the engine's React peer stops short of 19.x", () => {
    const engine = JSON.parse(readFileSync(join(__dirname, "..", "..", "astraeus", "package.json"), "utf8")) as {
      version: string;
    };
    const wanted = enginePeerRange(engine.version); // the engine's own minor, so a version bump needs no edit here
    expect(peerProblems("astraeus-data-pluto", { peerDependencies: { astraeus: wanted } })).toEqual([]);
    for (const stale of [">=0.1.0 <1.0.0", ">=0.6.0 <0.7.0", ">=0.7.0 <1.0.0"]) {
      expect(peerProblems("astraeus-data-pluto", { peerDependencies: { astraeus: stale } })).toContain(
        `astraeus-data-pluto: astraeus peer is ${stale}, the engine's current minor is ${wanted}`,
      );
    }
    const peers = { react: REACT_PEER_RANGE, "react-dom": REACT_PEER_RANGE, "@react-three/fiber": "*", three: "*" };
    expect(peerProblems("astraeus", { peerDependencies: peers })).toEqual([]);
    expect(peerProblems("astraeus", { peerDependencies: { ...peers, react: ">=19 <19.4" } })).toContain(
      "astraeus: react peer is >=19 <19.4, it must cover all of React 19 (>=19 <20)",
    );
  });

  it("fails on a compiled file with an extensionless relative import (webpack 5, I-077)", () => {
    const dir = scratch();
    try {
      write(
        dir,
        "src/bad.js",
        'export { a } from "./chunks";\nconst b = await import("../x/y");\nexport * from "./chunks.js";\n',
      );
      expect(extensionlessImports(dir)).toEqual(["src/bad.js: ./chunks", "src/bad.js: ../x/y"]);
      expect(codeProblems("astraeus-data-constellations", dir)).toContain(
        "astraeus-data-constellations: extensionless relative import in src/bad.js: ./chunks",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on a comment left in packed JS, but not on a kept banner or a // inside a string, template or regular expression (O-080 T-336)", () => {
    expect(
      packedComments("/** A doc comment. */\nexport const a = 1; // trailing\n/* block */ const b = 2;\n"),
    ).toEqual(["line 1: /** A doc comment. */", "line 2: // trailing", "line 3: /* block */"]);
    expect(
      packedComments(
        '/*! kept banner */\n/* @license MIT */\nconst url = "https://x.org/a"; const t = `//${url}`; const re = /\\/\\//g;\nexport { url, t, re };\n',
      ),
    ).toEqual([]);
    const dir = scratch();
    try {
      write(dir, "src/commented.js", "// left behind\nexport const a = 1;\n");
      expect(codeProblems("astraeus-data-constellations", dir)).toContain(
        "astraeus-data-constellations: packed JS keeps a comment in src/commented.js: line 1: // left behind",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on a chunk URL a bundler could inline, and on a missing chunk list type (I-078)", () => {
    const dir = scratch();
    const list =
      'export const chunkUrls = Object.freeze({\n  "a/2010.bin": new URL("../data/a-moons/a/2010.bin?no-inline", import.meta.url).href,\n});\n';
    const problem = "astraeus-data-pluto: a chunk URL in src/chunks.js lacks ?no-inline (Vite would inline it)";
    try {
      write(dir, "src/chunks.js", list);
      write(dir, "src/chunks.d.ts", "export declare const chunkUrls: Readonly<Record<string, string>>;\n");
      expect(codeProblems("astraeus-data-pluto", dir)).toEqual([]);
      for (const broken of [list.replace("?no-inline", ""), list.replace("?no-inline", "?no-inline=0")]) {
        write(dir, "src/chunks.js", broken);
        expect(codeProblems("astraeus-data-pluto", dir)).toContain(problem);
      }
      write(dir, "src/chunks.js", list);
      rmSync(join(dir, "src", "chunks.d.ts"));
      expect(codeProblems("astraeus-data-pluto", dir)).toContain(
        "astraeus-data-pluto: src/chunks.d.ts is missing (chunkUrls would be untyped)",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
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
    it.each(["check-node-consumer.mjs", "check-react-consumer.mjs"])(
      "%s imports nothing past the public entry",
      (file) => {
        expect(pastTheEntry(readFileSync(join(tools, file), "utf8"))).toEqual([]);
      },
    );

    it.each([
      ["a packed subpath", `${IMPORT} { catalogue } ${FROM} 'astraeus${"/assets"}/catalogue.js';`],
      [
        "a URL built from the resolved entry",
        `const { catalogue } = await ${IMPORT}(new URL('../assets/catalogue.js', import.meta.resolve('astraeus')).href);`,
      ],
      ["a relative import into the unpacked package", `await ${IMPORT}('./src/assets/catalogue.js');`],
      ["a path into the unpacked package", "const file = join(dir, 'node_modules/astraeus/src/assets/catalogue.js');"],
      [
        "a path into the unpacked package given in parts",
        "const file = join(dir, 'node_modules', 'astraeus', 'src', 'assets', 'catalogue.js');",
      ],
      ["a path from the package folder given in parts", "const file = join(pkg, `astraeus`, \"src\", 'assets');"],
    ])("planted: %s is named", (_name, line) => {
      expect(pastTheEntry(`import { Scene } from "astraeus";\n${line}\n`).length).toBeGreaterThan(0);
    });

    it("allows the public entry, its style sheet and its manifest", () => {
      expect(
        pastTheEntry(["const manifest = join(dir, 'node_modules', 'astraeus', 'package.json');"].join("\n")),
      ).toEqual([]);
      expect(
        pastTheEntry(
          [
            `${IMPORT} { Scene } ${FROM} "astraeus";`,
            `${IMPORT} "astraeus${"/style"}.css";`,
            `${IMPORT} pkg ${FROM} "astraeus${"/package"}.json";`,
          ].join("\n"),
        ),
      ).toEqual([]);
    });

    // The packed-build half of this case runs in `npm run check:pack` (problemsOf calls ringFactProblems on the engine's real pack).
    it("planted: a catalogue with no Saturn bands, and one with Mars rings, are named (in a scratch folder, not a package build)", () => {
      const dir = mkdtempSync(join(tmpdir(), "ring-facts-"));
      const file = join(dir, "src", "assets", "catalogue.js");
      mkdirSync(join(dir, "src", "assets"), { recursive: true });
      try {
        writeFileSync(
          file,
          "export const catalogue = { get: (id) => ({ visual: { rings: id === 'mars' ? { bands: [1] } : undefined } }) };",
        );
        expect(ringFactProblems(dir)).toEqual([
          "astraeus: the packed catalogue gives Saturn no ring bands",
          "astraeus: the packed catalogue gives Mars rings",
        ]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
