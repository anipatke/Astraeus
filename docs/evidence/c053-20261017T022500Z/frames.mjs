const pw = await import(process.env.PLAYWRIGHT_CORE);
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5302/app.html";
const browser = await (pw.chromium ?? pw.default.chromium).launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = {};
for (const shower of ["perseids", "geminids"]) {
  const phone = process.env.PHONE === "1";
  const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
  if (phone) { const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE ?? 4) }); }
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?experience=shower-${shower}&sky=off`);
  await page.getByTestId("earth-moon-canvas").waitFor();
  await page.waitForFunction(() => document.querySelector("[data-point-groups]")?.getAttribute("data-point-groups") === "1", null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const play = page.getByRole("button", { name: "Play playback" });
  if (await play.count()) await play.dispatchEvent("click");
  const deltas = await page.evaluate(() => new Promise((resolve) => {
    const d = []; let last = performance.now(); const end = last + 12000;
    const tick = (t) => { d.push(t - last); last = t; if (t < end) requestAnimationFrame(tick); else resolve(d); };
    requestAnimationFrame(tick);
  }));
  const s = [...deltas].sort((a, b) => a - b);
  const q = (p) => s[Math.floor(p * (s.length - 1))];
  const long = deltas.map((v, i) => [i, v]).filter(([, v]) => v > 1.5 * q(0.5));
  out[shower] = { over60: deltas.filter((v) => v > 60).length, over90: deltas.filter((v) => v > 90).length, frames: deltas.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1), longFrames: long.length, longMs: long.slice(0, 12).map(([i, v]) => `${i}:${v.toFixed(0)}`), errors };
  await page.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
