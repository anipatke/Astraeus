// Offline Apollo 11 reconstruction: reads data/apollo11/raw and writes the normalised/generated data and report.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (file) => runnerImport(path.join(root, file)).then((result) => result.module);

const [{ createOrbAstronomyAdapter }, { reconstruct }] = await Promise.all([
  load("src/core/astronomyAdapter.ts"),
  load("tools/apollo11/reconstruct.ts"),
]);
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const raw = {
  anchors: await readJson("data/apollo11/raw/anchors.json"),
  events: await readJson("data/apollo11/raw/events.json"),
};
const { files } = reconstruct(createOrbAstronomyAdapter(), raw);
for (const [file, content] of Object.entries(files)) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
  console.log(`wrote ${file} (${content.length} bytes)`);
}
