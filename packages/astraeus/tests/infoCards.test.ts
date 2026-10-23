import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { InfoView } from "../src/shell/infoModel";
import { InfoPanel } from "../src/shell/InfoPanel";


// O-039 T-134: place details are a badge plus one boxed card per detail, all in the UI font (I-058).
const view: InfoView = {
  target: { kind: "feature", id: "kerwan" },
  title: "Kerwan",
  subtitle: "crater on Callisto",
  provenance: null,
  facts: [
    { label: "Fun Fact", value: "Smooth and shallow." },
    { label: "Diameter", value: "1,212 km" },
    { label: "Naming origin", value: "Named for a hero." },
  ],
} as InfoView;

describe("info cards", () => {
  const html = renderToStaticMarkup(createElement(InfoPanel, { view, metrics: [], onClose: () => undefined }));

  it("shows the subtitle as a badge", () => {
    expect(html).toMatch(/<span class="info-panel-badge">crater on Callisto<\/span>/);
  });

  it("renders one box per detail, label above value", () => {
    expect(html.match(/class="info-panel-fact"/g)).toHaveLength(3);
    expect(html).toContain('<dt>Fun Fact</dt><dd>Smooth and shallow.</dd>');
  });

  it("sets no monospace font on any info-panel rule and uses tabular figures", async () => {
    const { readFileSync } = await (import(/* @vite-ignore */ `node:${"fs"}`) as Promise<any>);
    const css = ["style", "phone"].map((name) => readFileSync(new URL(`../src/shell/${name}.css`, import.meta.url), "utf8") as string).join("\n");
    const rules = css.split("}").filter((rule: string) => /\.info-panel/.test(rule.split("{")[0]));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule, rule).not.toMatch(/monospace/);
    expect(css).toMatch(/\.info-panel-fact dd[^}]*tabular-nums/);
  });
});
