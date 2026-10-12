// Public-build output gate (design C.3). Hashes every file under dist/ and fails if any matches a local-only source texture,
// byte for byte or embedded in a text asset as base64.
//   ASTRAEUS_PUBLIC_BUILD=1 npm run build && node tools/validate/public-build-assets.mjs [distDir] [resultsFile]
// Local-only sources are the images a body record imports and declares `localOnly` (src/assets/bodies/*.ts).
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const TEXT_EXTENSIONS = /\.(js|mjs|css|html|json|svg|map)$/;
/** A window of source bytes, aligned to three so its base64 is the same wherever it sits inside a data URI. */
const WINDOW_BYTES = 96;

function* walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** Source files of every texture a body record declares local-only: [{ file, path }]. */
export function findLocalOnlySources(rootDir = root) {
  const bodies = join(rootDir, "src", "assets", "bodies");
  const sources = [];
  for (const name of readdirSync(bodies)) {
    const text = readFileSync(join(bodies, name), "utf8");
    if (!/localOnly\s*:/.test(text)) continue;
    for (const match of text.matchAll(/from\s+["']\.\.\/textures\/([^"']+)["']/g)) {
      sources.push({ file: match[1], path: join(rootDir, "src", "assets", "textures", match[1]) });
    }
  }
  return sources;
}

/** Hashes `distDir` against `sources` ([{ file, path }]); returns { ok, files, checked, matches }. */
export function checkPublicBuild({ distDir, sources }) {
  const wanted = sources.map(({ file, path }) => {
    const bytes = readFileSync(path);
    const start = Math.max(0, Math.floor((bytes.length - WINDOW_BYTES) / 2 / 3) * 3);
    return { file, hash: sha256(bytes), size: bytes.length, needle: bytes.subarray(start, start + WINDOW_BYTES).toString("base64") };
  });
  const matches = [];
  let checked = 0;
  for (const path of walk(distDir)) {
    const bytes = readFileSync(path);
    checked += 1;
    const hash = sha256(bytes);
    const text = TEXT_EXTENSIONS.test(path) ? bytes.toString("latin1") : "";
    for (const source of wanted) {
      if (hash === source.hash) matches.push({ source: source.file, path, how: "identical file" });
      else if (text.includes(source.needle)) matches.push({ source: source.file, path, how: "embedded as base64" });
    }
  }
  return { ok: matches.length === 0, checked, sources: wanted.map(({ file, hash, size }) => ({ file, sha256: hash, bytes: size })), matches };
}

/** Proves the check can fail: a fake unlicensed texture is found as a file and as base64, and a clean build passes. */
export function proveItFails() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-public-build-"));
  try {
    const fake = Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 131 + 7) % 251));
    const texture = join(temp, "fake-unlicensed.jpg");
    writeFileSync(texture, fake);
    const sources = [{ file: "fake-unlicensed.jpg", path: texture }];
    const clean = join(temp, "clean");
    const copied = join(temp, "copied");
    const embedded = join(temp, "embedded");
    for (const directory of [clean, copied, embedded]) mkdirSync(join(directory, "assets"), { recursive: true });
    for (const directory of [clean, copied, embedded]) writeFileSync(join(directory, "assets", "index.js"), "export const a = 1;");
    writeFileSync(join(copied, "assets", "fake-renamed.bin"), fake);
    writeFileSync(join(embedded, "assets", "index.js"), `export const texture = "data:image/jpeg;base64,${fake.toString("base64")}";`);
    return {
      clean: checkPublicBuild({ distDir: clean, sources }),
      copied: checkPublicBuild({ distDir: copied, sources }),
      embedded: checkPublicBuild({ distDir: embedded, sources }),
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = resolve(process.argv[2] ?? join(root, "dist"));
  const sources = findLocalOnlySources();
  if (sources.length === 0) {
    console.error("no local-only textures found under src/assets/bodies; the validator would prove nothing");
    process.exit(1);
  }
  const result = { distDir, ...checkPublicBuild({ distDir, sources }) };
  if (process.argv[3] !== undefined) writeFileSync(resolve(process.argv[3]), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
