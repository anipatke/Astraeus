// O-035 T-157: the licence and credit records each package carries, gathered without naming a package (ARCH-03).
// A package's records are (a) the files in its own `licenses/` or `credits/` folder and (b) the `provenance.licence` of each JSON data file under its `data/`.
// The site reads this list; adding a demo package with its own records needs no change here.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const RECORD_FOLDERS = ["licenses", "credits"];

function* walk(directory) {
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** The licence a data file declares in its top-level `provenance`, or null. */
function declaredLicence(path) {
  if (!path.endsWith(".json")) return null;
  try {
    const licence = JSON.parse(readFileSync(path, "utf8"))?.provenance?.licence;
    return typeof licence === "string" && licence !== "" ? licence : null;
  } catch {
    return null;
  }
}

/** Every package folder under `<rootDir>/packages`, in name order. */
export function packageNames(rootDir = defaultRoot) {
  const packages = join(rootDir, "packages");
  return existsSync(packages) ? readdirSync(packages).filter((name) => existsSync(join(packages, name, "package.json"))).sort() : [];
}

/** The records of each package: [{ package, licenceFiles: [relative path], dataLicences: [{ file, licence }] }], packages with no record left out. */
export function gatherPackageCredits(rootDir = defaultRoot) {
  const found = [];
  for (const name of packageNames(rootDir)) {
    const base = join(rootDir, "packages", name);
    const licenceFiles = [];
    for (const folder of RECORD_FOLDERS) {
      if (existsSync(join(base, folder))) for (const path of walk(join(base, folder))) licenceFiles.push(path.slice(base.length + 1));
    }
    const dataLicences = [];
    if (existsSync(join(base, "data"))) {
      for (const path of walk(join(base, "data"))) {
        const licence = declaredLicence(path);
        if (licence !== null) dataLicences.push({ file: path.slice(base.length + 1), licence });
      }
    }
    if (licenceFiles.length > 0 || dataLicences.length > 0) found.push({ package: name, licenceFiles, dataLicences });
  }
  return found;
}

/** The library licence texts the engine ships notices for (orb.js and its ERFA and python-sgp4 parts). */
export const ENGINE_LIBRARY_LICENCES = ["licenses/ERFA.txt", "licenses/orbjs-MIT.txt", "licenses/python-sgp4.txt"];

/** Whether the engine holds its library notices; { ok, missing }. */
export function checkEngineLicences(rootDir = defaultRoot) {
  const engine = gatherPackageCredits(rootDir).find((entry) => entry.package === "astraeus");
  const have = new Set(engine?.licenceFiles ?? []);
  const missing = ENGINE_LIBRARY_LICENCES.filter((file) => !have.has(file));
  return { ok: missing.length === 0, missing };
}
