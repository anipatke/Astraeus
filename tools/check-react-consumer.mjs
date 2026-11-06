// Proves the packed engine runs with the latest React 19.x (O-053 T-230, API-07; the engine's React peers are `>=19 <20`). `npm run check:react-consumer` builds `astraeus`, packs it, and installs the tarball
// into an empty scratch app with `npm install`, so npm resolves the peers (react, react-dom, @react-three/fiber, three) from the registry exactly as a user's install does: `react` and `react-dom` come
// out at the newest 19.x the registry has. It then fails unless the installed React is a 19.x, and when that is older than the registry's newest it fails unless a dependency other than `astraeus` caps React below the newest (today `@react-three/fiber`, `<19.4`); it reports the installed version, the newest and the capper. It runs a plain-Node script that imports the packed `astraeus`, builds a scene and renders
// `<AstraeusScene>` with `react-dom/server`. Needs network access to the npm registry. Nothing is published.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, cwd, quiet = false) {
  const result = spawnSync(command, args, { cwd, stdio: quiet ? "pipe" : "inherit", encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.stdout;
}

const versionParts = (version) => version.split(".").map(Number);
const compareVersions = (a, b) => { const [x, y] = [versionParts(a), versionParts(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

/** The newest published 19.x of a React package, asked of the registry. */
export function latestReact19(name) {
  const listed = JSON.parse(run("npm", ["view", `${name}@>=19 <20`, "version", "--json"], root, true));
  return [listed].flat().filter((version) => /^19\.\d+\.\d+$/.test(version)).sort(compareVersions).pop();
}

/**
 * The packages under `appDir/node_modules` (other than `astraeus`) whose `react` or `react-dom` range excludes `newest`: what stops npm installing the newest React. Each as `name@version (react <range>)`.
 */
export function reactCappers(appDir, newest) {
  const found = [];
  const modules = join(appDir, "node_modules");
  const names = readdirSync(modules).flatMap((name) => (name.startsWith("@") ? readdirSync(join(modules, name)).map((sub) => `${name}/${sub}`) : [name]));
  for (const name of names) {
    if (name === "astraeus") continue;
    let json;
    try { json = JSON.parse(readFileSync(join(modules, name, "package.json"), "utf8")); } catch { continue; }
    for (const field of ["peerDependencies", "dependencies"]) {
      for (const dep of ["react", "react-dom"]) {
        const range = json[field]?.[dep];
        if (range !== undefined && semver.validRange(range) && !semver.satisfies(newest, range)) found.push(`${name}@${json.version} (${dep} ${range})`);
      }
    }
  }
  return [...new Set(found)].sort();
}

const consumerScript = [
  'import { createRequire } from "node:module";',
  'import { createElement } from "react";',
  'import { renderToString } from "react-dom/server";',
  'import { AstraeusScene, Scene, earth, sun } from "astraeus";',
  "const require = createRequire(import.meta.url);",
  'const scene = new Scene().addBody(sun).addBody(earth);',
  'scene.check(); // throws a SceneError when the scene does not build',
  'const html = renderToString(createElement(AstraeusScene, { scene, data: [] }));',
  'if (typeof html !== "string" || html.length === 0) throw new Error("AstraeusScene rendered nothing");',
  'console.log(JSON.stringify({ react: require("react/package.json").version, reactDom: require("react-dom/package.json").version, rendered: html.length }));',
  "",
].join("\n");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const scratch = mkdtempSync(join(tmpdir(), "astraeus-react-consumer-"));
  let failed = false;
  try {
    const expected = { react: latestReact19("react"), reactDom: latestReact19("react-dom") };
    console.log(`registry: newest React 19.x is react ${expected.react}, react-dom ${expected.reactDom}`);
    run(process.execPath, [join(root, "tools", "build-packages.mjs"), "astraeus"], root);
    run("npm", ["pack", join(root, "packages", "astraeus", "dist"), "--pack-destination", scratch, "--silent"], root, true);
    const tarball = readdirSync(scratch).find((file) => file.endsWith(".tgz"));
    const app = join(scratch, "app");
    run("mkdir", [app], scratch, true);
    writeFileSync(join(app, "package.json"), JSON.stringify({ name: "react-consumer", private: true, type: "module" }));
    run("npm", ["install", join(scratch, tarball), "--no-audit", "--no-fund", "--loglevel=error"], app);
    writeFileSync(join(app, "consumer.mjs"), consumerScript);
    const out = JSON.parse(run(process.execPath, ["consumer.mjs"], app, true).trim().split("\n").pop());
    console.log(`installed: react ${out.react}, react-dom ${out.reactDom}; AstraeusScene rendered ${out.rendered} characters on the server`);
    if (!/^19\.\d+\.\d+$/.test(out.react) || !/^19\.\d+\.\d+$/.test(out.reactDom)) throw new Error(`installed react ${out.react} / react-dom ${out.reactDom}, not a 19.x`);
    if (out.react !== expected.react || out.reactDom !== expected.reactDom) {
      const cappers = reactCappers(app, expected.react);
      if (cappers.length === 0) throw new Error(`installed react ${out.react} / react-dom ${out.reactDom}, not the newest 19.x (${expected.react} / ${expected.reactDom}), and no dependency caps React`);
      console.log(`note: react ${out.react} / react-dom ${out.reactDom} installed, registry newest ${expected.react} / ${expected.reactDom}; capped by ${cappers.join(", ")}`);
    }
    const installed = JSON.parse(readFileSync(join(app, "node_modules", "astraeus", "package.json"), "utf8")).peerDependencies;
    if (installed.react !== ">=19 <20" || installed.react !== installed["react-dom"]) throw new Error(`the packed peers are react ${installed.react}, react-dom ${installed["react-dom"]}; expected >=19 <20`);
  } catch (error) {
    failed = true;
    console.error(String(error.message ?? error));
  }
  rmSync(scratch, { recursive: true, force: true });
  console.log(`react consumer: ${failed ? "FAILED" : "pass"}`);
  process.exit(failed ? 1 : 0);
}
