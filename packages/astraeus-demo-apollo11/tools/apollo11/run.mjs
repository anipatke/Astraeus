// Offline Apollo 11 reconstruction: reads data/apollo11/raw and writes the normalised/generated data and report.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";
import { toolsHash } from "./toolsHash.mjs";

// root is this package (data/apollo11 lives here); the engine's core is its sibling package, and the generated report goes to the repository's docs/.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const engine = path.join(root, "..", "astraeus");
const repository = path.join(root, "..", "..");
const load = (file, base = root) => runnerImport(path.join(base, file)).then((result) => result.module);

const [{ createOrbAstronomyAdapter }, { reconstruct }] = await Promise.all([
  load("src/core/astronomyAdapter.ts", engine),
  load("tools/apollo11/reconstruct.ts"),
]);
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const raw = {
  anchors: await readJson("data/apollo11/raw/anchors.json"),
  events: await readJson("data/apollo11/raw/events.json"),
};
// Determinism proof: two runs must match byte for byte before anything is written.
const { files } = reconstruct(createOrbAstronomyAdapter(), raw);
const again = reconstruct(createOrbAstronomyAdapter(), raw).files;
const differing = Object.keys({ ...files, ...again }).filter((file) => files[file] !== again[file]);
if (differing.length > 0) {
  console.error(`reconstruction is not deterministic; nothing written. Differing: ${differing.join(", ")}`);
  process.exit(1);
}
for (const [file, content] of Object.entries(files)) {
  const target = path.join(file.startsWith("docs/") ? repository : root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
  console.log(`wrote ${file} (${content.length} bytes)`);
}
const proof = `${JSON.stringify(toolsHash(), null, 2)}\n`;
await writeFile(path.join(root, "tests/fixtures/apollo11ToolsProven.json"), proof);
console.log("wrote tests/fixtures/apollo11ToolsProven.json");
