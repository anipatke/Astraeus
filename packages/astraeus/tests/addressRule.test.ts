// The page address has one door (O-052 T-223, strategic fix): only `src/app/address.ts` reads or writes it for the viewer, so a new parameter cannot bypass the host's `address` option.
// The two files below navigate the page itself (a demo switch, a developer data switch), which the demo site keeps; they are not parameter readers.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");
const ALLOWED = new Set(["app/address.ts", "shell/SwitchControl.tsx", "app/DeveloperSettings.tsx"]);
const ADDRESS_USE = /\b(window|document|globalThis|self)\.location\b|(?<![\w.])location\.(search|href|hash|pathname|assign|replace|origin)\b|\bhistory\.(replaceState|pushState|back|forward|go)\b/;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("page address rule", () => {
  it("no source outside the address door reads or writes the page address", () => {
    const offenders = sources(SRC)
      .filter((file) => !ALLOWED.has(relative(SRC, file).split("\\").join("/")))
      .filter((file) => readFileSync(file, "utf8").split("\n").some((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//") && ADDRESS_USE.test(line)))
      .map((file) => relative(SRC, file));
    expect(offenders).toEqual([]);
  });

  it("the rule sees a reader (a sample that must trip it)", () => {
    expect(ADDRESS_USE.test("const s = window.location.search;")).toBe(true);
    expect(ADDRESS_USE.test("window.history.replaceState(null, '', x)")).toBe(true);
    expect(ADDRESS_USE.test("const search = addressSearch(address);")).toBe(false);
  });
});
