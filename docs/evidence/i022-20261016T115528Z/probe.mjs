// First-load probe: per URL, a fresh page; sums response bytes by type (decoded and gzip-of-body), lists JS/JSON/images >50 kB.
import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT_CORE);
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.BASE; const out = process.env.OUT;
const targets = { index: "/index.html", apollo: "/app.html", "earth-moon": "/app.html?experience=earth-moon", perseids: "/app.html?experience=shower-perseids", geminids: "/app.html?experience=shower-geminids" };
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const result = {};
for (const [name, path] of Object.entries(targets)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const items = []; const errs = [];
  page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const pending = [];
  page.on("response", (r) => pending.push((async () => { try { const b = await r.body(); items.push({ url: r.url().replace(base, ""), status: r.status(), bytes: b.length, gzip: gzipSync(b).length }); } catch {} })()));
  await page.goto(base + path, { waitUntil: "load" });
  if (name !== "index") await page.waitForSelector("canvas", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000); await Promise.all(pending);
  const kind = (u) => /\.js$/.test(u) ? "js" : /\.json$/.test(u) ? "json" : /\.(jpg|png|webp)$/.test(u) ? "image" : /\.css$/.test(u) ? "css" : "other";
  const sum = {}; for (const i of items) { const k = kind(i.url); sum[k] ??= { bytes: 0, gzip: 0 }; sum[k].bytes += i.bytes; sum[k].gzip += i.gzip; }
  const total = items.reduce((a, i) => a + i.bytes, 0), totalGz = items.reduce((a, i) => a + i.gzip, 0);
  result[name] = { total, totalGz, sum, big: items.filter((i) => i.bytes > 50000).sort((a, b) => b.bytes - a.bytes), errors: errs };
  console.log(name, "total", (total / 1e6).toFixed(2), "MB gz", (totalGz / 1e6).toFixed(2), "js", ((sum.js?.bytes ?? 0) / 1e6).toFixed(2), "jsgz", ((sum.js?.gzip ?? 0) / 1e6).toFixed(2), "json", ((sum.json?.bytes ?? 0) / 1e6).toFixed(2), "img", ((sum.image?.bytes ?? 0) / 1e6).toFixed(2), "errors", errs.length);
  await page.close();
}
await browser.close(); writeFileSync(out, JSON.stringify(result, null, 1));
