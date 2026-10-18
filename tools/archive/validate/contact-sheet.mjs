// Owner contact sheet: one page (HTML + PNG) showing every experience picture at desktop and phone, before beside after, with the differing-pixel figure from diff-screenshots.mjs.
//   PLAYWRIGHT_CORE=<path> node tools/validate/contact-sheet.mjs <beforeDir> <afterDir> <diff.json> <outDir> [maxOver16Pct=0.024]
// The pictures come from capture-experience-pictures.mjs; diff.json from diff-screenshots.mjs <beforeDir> <afterDir> <diff.json>. outDir receives contact-sheet.html and contact-sheet.png.
// Tall pages (the site pages are full-page shots) are cropped to the top so the sheet stays one screen. A row is flagged when its over-16-levels figure is above the tolerance or its size differs (the assets page differs in size by design, so it is shown, not failed).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const [beforeDir, afterDir, diffFile, outDir, tolerance = "0.024"] = process.argv.slice(2);
if (outDir === undefined) { console.error("usage: contact-sheet.mjs <beforeDir> <afterDir> <diff.json> <outDir> [maxOver16Pct]"); process.exit(2); }
const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
mkdirSync(outDir, { recursive: true });
const diff = JSON.parse(readFileSync(diffFile, "utf8"));
const byName = new Map(diff.rows.map((row) => [row.name, row]));
const views = [...new Set(diff.rows.map((row) => row.name.replace(/-(desktop|phone)\.png$/, "")))];
const src = (dir, name) => relative(resolve(outDir), resolve(dir, name));
const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const figure = (row) => row === undefined || row.missing ? "missing" : row.sizeMismatch ? "size differs" : `${row.over16Pct}% over 16 levels`;
const bad = (row) => row === undefined || row.missing || (!row.sizeMismatch && row.over16Pct > Number(tolerance));

const rows = views.map((view) => {
  const cells = ["desktop", "phone"].map((size) => {
    const name = `${view}-${size}.png`;
    const row = byName.get(name);
    return `<td class="${size}${bad(row) ? " flag" : ""}"><div><img src="${src(beforeDir, name)}" alt="before ${name}"><img src="${src(afterDir, name)}" alt="after ${name}"></div><small>${size}: ${escape(figure(row))}</small></td>`;
  });
  return `<tr><th>${escape(view)}</th>${cells.join("")}</tr>`;
});
const flagged = diff.rows.filter(bad).length;
const html = `<!doctype html><meta charset="utf-8"><title>Astraeus contact sheet</title>
<style>body{background:#0b0e14;color:#dbe2ee;font:13px system-ui,sans-serif;margin:12px}h1{font-size:16px;margin:0 0 4px}table{border-collapse:collapse}th{text-align:right;padding:4px 10px;font-weight:600;width:130px}
td{padding:4px;vertical-align:top}td div{display:flex;gap:4px}td.desktop img{width:300px;height:188px;object-fit:cover;object-position:top}td.phone img{width:96px;height:208px;object-fit:cover;object-position:top}img{border:1px solid #2a3140;display:block}small{color:#9aa6bb}td.flag small{color:#ff8a8a;font-weight:700}td.flag img{border-color:#ff8a8a}</style>
<h1>Before (left) and after (right) of each picture. ${flagged === 0 ? "All within tolerance" : `${flagged} picture(s) flagged`}: at most ${tolerance}% of pixels differing by more than 16 levels.</h1>
<p>before ${escape(beforeDir)} / after ${escape(afterDir)}</p><table>${rows.join("")}</table>`;
const htmlFile = resolve(outDir, "contact-sheet.html");
writeFileSync(htmlFile, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await page.goto(`file://${htmlFile}`, { waitUntil: "load" });
  await page.screenshot({ path: resolve(outDir, "contact-sheet.png"), fullPage: true });
} finally {
  await browser.close();
}
console.log(`contact sheet: ${views.length} views, ${flagged} flagged -> ${outDir}/contact-sheet.png`);
