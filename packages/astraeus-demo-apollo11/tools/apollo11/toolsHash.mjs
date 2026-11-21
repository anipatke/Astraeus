// Hash of the reconstruction tools and raw inputs, shared by run.mjs (writes the proof) and the reconstruction test (checks it).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const listJson = (dir) => readdirSync(path.join(root, dir)).filter((name) => name.endsWith(".json"));

/** Sorted package-relative paths of every file in tools/apollo11/ and data/apollo11/raw/*.json. */
export function toolsFiles() {
  const tools = readdirSync(path.join(root, "tools/apollo11")).map((name) => `tools/apollo11/${name}`);
  const raw = listJson("data/apollo11/raw").map((name) => `data/apollo11/raw/${name}`);
  return [...tools, ...raw].sort();
}

/** sha256 over each file's path and content bytes, in path order. */
export function toolsHash() {
  const hash = createHash("sha256");
  const files = toolsFiles();
  for (const file of files)
    hash
      .update(file)
      .update("\0")
      .update(readFileSync(path.join(root, file)))
      .update("\0");
  return { sha256: hash.digest("hex"), files };
}
