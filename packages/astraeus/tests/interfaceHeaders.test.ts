// I-187: every interface module starts with a short header saying its one job and what it must not do (viewer-interface note, section 9). The part components
// (`src/shell/*.tsx`) and the rule modules (`bar/`, `panels/`, `areas/`, `look/`) are scanned; a file whose first line is code, not a comment, fails here.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SHELL = join(__dirname, "..", "src", "shell");
const files = (dir: string, test: (name: string) => boolean) =>
  readdirSync(join(SHELL, dir))
    .filter(test)
    .map((name) => (dir === "" ? name : `${dir}/${name}`));
const MODULES = [
  ...files("", (name) => name.endsWith(".tsx")),
  ...["bar", "panels", "areas", "look", "selection"].flatMap((dir) => files(dir, (name) => /\.(ts|tsx)$/.test(name))),
];

describe("interface module headers (I-187)", () => {
  it("finds the part and rule modules", () => {
    expect(MODULES).toEqual(
      expect.arrayContaining([
        "AboutPanel.tsx",
        "TimelineBar.tsx",
        "bar/fitBar.ts",
        "panels/panelRule.ts",
        "areas/screen.ts",
      ]),
    );
  });
  it.each(MODULES)("%s starts with a header comment of at least two lines", (file) => {
    const lines = readFileSync(join(SHELL, file), "utf8").split("\n");
    const header = lines.slice(
      0,
      lines.findIndex((line) => !/^\s*(\/\/|\/\*|\*)/.test(line)),
    );
    expect(header.length).toBeGreaterThanOrEqual(2);
  });
  it("each part component's header says what it must not do", () => {
    const parts = MODULES.filter((file) => !file.includes("/") && file !== "AstraeusShell.tsx");
    const missing = parts.filter(
      (file) => !/must not/i.test(readFileSync(join(SHELL, file), "utf8").split("\n").slice(0, 3).join(" ")),
    );
    expect(missing).toEqual([]);
  });
});
