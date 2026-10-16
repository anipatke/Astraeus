// Pixel difference between two directories of same-named PNGs, read in headless Chromium (no image library needed).
// PLAYWRIGHT_CORE=<path> node tools/validate/diff-screenshots.mjs <dirA> <dirB> <out.json>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const [dirA, dirB, outFile] = process.argv.slice(2);
const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const browser = await chromium.launch();
const page = await browser.newPage();
const names = readdirSync(dirA).filter((name) => name.endsWith(".png")).sort();
const rows = [];
try {
  for (const name of names) {
    let b;
    try { b = readFileSync(`${dirB}/${name}`).toString("base64"); } catch { rows.push({ name, missing: true }); continue; }
    const a = readFileSync(`${dirA}/${name}`).toString("base64");
    rows.push({ name, ...(await page.evaluate(async ([x, y]) => {
      const load = async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return { w: image.width, h: image.height, px: ctx.getImageData(0, 0, image.width, image.height).data };
      };
      const [p, q] = [await load(x), await load(y)];
      if (p.w !== q.w || p.h !== q.h) return { sizeMismatch: true };
      let any = 0; let over16 = 0; let maxDelta = 0;
      for (let i = 0; i < p.px.length; i += 4) {
        const d = Math.max(Math.abs(p.px[i] - q.px[i]), Math.abs(p.px[i + 1] - q.px[i + 1]), Math.abs(p.px[i + 2] - q.px[i + 2]));
        if (d > 0) any += 1;
        if (d > 16) over16 += 1;
        if (d > maxDelta) maxDelta = d;
      }
      const total = p.w * p.h;
      return { pixels: total, differing: any, differingPct: +(100 * any / total).toFixed(4), over16: over16, over16Pct: +(100 * over16 / total).toFixed(4), maxDelta };
    }, [a, b])) });
  }
} finally {
  await browser.close();
}
const summary = { dirA, dirB, files: rows.length, identical: rows.filter((r) => r.differing === 0).length, maxOver16Pct: Math.max(0, ...rows.map((r) => r.over16Pct ?? 0)), rows };
writeFileSync(outFile, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ files: summary.files, identical: summary.identical, maxOver16Pct: summary.maxOver16Pct }));
