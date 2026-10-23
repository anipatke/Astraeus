// Publishes the built packages to npm (O-036 T-162): `node tools/publish-packages.mjs [--dry-run] [--tag vX.Y.Z]`. Run by .github/workflows/publish.yml after the gates
// and `npm run check:pack`; never run it by hand except with --dry-run (docs/RELEASING.md).
//   - Each package is published from packages/<name>/dist (the folder build-packages.mjs wrote), engine first.
//   - A package whose version is already on npm is skipped, so a failed release can be re-run.
//   - With --tag, every package's version must equal the tag without its leading "v"; otherwise nothing is published.
//   - Without --dry-run, `npm publish --provenance --access public` (npm trusted publishing: no token; the runner's OIDC identity signs in). With --dry-run, `npm publish --dry-run`
//     and no provenance, which proves the folder would publish without sending anything.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGES } from "./build-packages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** What to do for one package: "publish" or "skip" (already on npm), or a refusal when the tag and the version disagree. */
export function planFor({ name, version, tag, published }) {
  if (tag !== undefined && tag.replace(/^v/, "") !== version) return { name, action: "refuse", reason: `release tag ${tag} does not match ${name} version ${version}` };
  if (published) return { name, action: "skip", reason: `${name}@${version} is already on npm` };
  return { name, action: "publish", reason: `${name}@${version} is not on npm yet` };
}

/** The npm publish arguments: a dry run sends nothing and signs nothing. */
export function publishArgs(dir, dryRun) {
  return ["publish", dir, "--access", "public", ...(dryRun ? ["--dry-run"] : ["--provenance"])];
}

function isPublished(name, version) {
  const view = spawnSync("npm", ["view", `${name}@${version}`, "version", "--json"], { encoding: "utf8" });
  if (view.status === 0) return view.stdout.trim() !== "";
  if (/E404|404 Not Found/.test(`${view.stdout}${view.stderr}`)) return false;
  throw new Error(`npm view ${name}@${version} failed: ${view.stderr}`);
}

export function publishAll({ dryRun = false, tag } = {}) {
  const plans = PACKAGES.map((name) => {
    const dir = join(root, "packages", name, "dist");
    if (!existsSync(join(dir, "package.json"))) throw new Error(`${name}: ${dir} has no package.json; run npm run build:packages first`);
    const { version } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return { dir, ...planFor({ name, version, tag, published: isPublished(name, version) }) };
  });
  for (const plan of plans) console.log(`${plan.action.padEnd(7)} ${plan.reason}`);
  if (plans.some((plan) => plan.action === "refuse")) throw new Error("nothing was published: a tag and a version disagree");
  for (const plan of plans.filter((one) => one.action === "publish")) {
    const run = spawnSync("npm", publishArgs(plan.dir, dryRun), { stdio: "inherit" });
    if (run.status !== 0) throw new Error(`npm publish failed for ${plan.name}`);
  }
  return plans;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const tagAt = args.indexOf("--tag");
  try {
    publishAll({ dryRun: args.includes("--dry-run"), tag: tagAt === -1 ? undefined : args[tagAt + 1] });
  } catch (error) {
    console.error(String(error.message ?? error));
    process.exit(1);
  }
}
