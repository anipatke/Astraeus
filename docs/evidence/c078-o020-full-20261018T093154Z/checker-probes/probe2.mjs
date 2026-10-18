// C-078 follow-up probe: scene drags clear of the drawer handles; story panels on a phone; what the timeline drawer's event list offers.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE);
const BASE = "http://localhost:5611/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = { failures: [] };
const fail = (m) => { out.failures.push(m); console.log("FAIL", m); };
const VIEWS = { portrait: { width: 390, height: 844 }, small: { width: 360, height: 640 }, landscape: { width: 844, height: 390 } };
for (const [vn, vp] of Object.entries(VIEWS)) for (const q of ["", "?experience=earth-moon", "?experience=showers&shower=perseids"]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(BASE + q); await page.waitForSelector(".timeline-bar", { timeout: 90000 }); await page.waitForTimeout(1500);
  const geo = await page.evaluate(() => { const h = document.querySelector('[aria-label="Timeline drawer"]').getBoundingClientRect(); const p = document.querySelector(".controls-pill").getBoundingClientRect(); return { handleTop: h.top, pillBottom: p.bottom }; });
  const st = () => page.evaluate(() => ({ top: document.querySelector("#controls-drawer").dataset.open, tl: document.querySelector(".timeline-bar").dataset.drawerOpen }));
  const drag = async (x, y, dy) => { await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= 10; i++) await page.mouse.move(x, y + (dy * i) / 10); await page.mouse.up(); await page.waitForTimeout(350); };
  const W = vp.width;
  const starts = [[W / 2, vp.height / 2, -150], [W / 2, vp.height / 2, 150], [W * 0.3, geo.handleTop - 30, -120], [W * 0.7, geo.handleTop - 30, 60], [W / 2, geo.pillBottom + 30, 120], [W / 2, geo.pillBottom + 30, -60]];
  const rows = [];
  for (const [x, y, dy] of starts) { await drag(x, y, dy); const s = await st(); rows.push({ y: Math.round(y), dy, ...s }); if (s.top !== "false" || s.tl !== "false") fail(`${vn}${q}: scene drag at y=${Math.round(y)} dy=${dy} opened ${JSON.stringify(s)}`); }
  // Timeline drawer: what the event list offers (44 px rows?), and whether story panels are reachable there.
  await page.locator('[aria-label="Timeline drawer"]').click(); await page.waitForTimeout(500);
  const list = await page.evaluate(() => { const d = document.querySelector("#timeline-drawer"); const bs = [...d.querySelectorAll("button, summary")].filter((b) => b.checkVisibility()); return { n: bs.length, small: bs.filter((b) => b.getBoundingClientRect().height < 43.5).map((b) => b.getAttribute("aria-label") ?? b.textContent.trim().slice(0, 30)), panels: bs.filter((b) => /story panel|panel/i.test((b.getAttribute("aria-label") ?? "") + b.textContent)).length, names: bs.slice(0, 6).map((b) => (b.getAttribute("aria-label") ?? b.textContent.trim()).slice(0, 40)) }; });
  // Story panel: open via its timeline mark (programmatic click), then check Play is uncovered and Sources closed.
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  const story = await page.evaluate(async () => {
    const marks = [...document.querySelectorAll('.timeline-bar [aria-label^="Open story panel"]')];
    const res = [];
    for (const m of marks) { m.click(); await new Promise((r) => setTimeout(r, 700)); const play = document.querySelector('[aria-label="Play playback"],[aria-label="Pause playback"]'); const b = play.getBoundingClientRect(); const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); const s = document.querySelector(".story-panel"); res.push({ story: !!s, playClear: play.contains(hit), sourcesOpen: s?.querySelector("details")?.open ?? null }); }
    return res;
  });
  story.forEach((s, i) => { if (!s.story || !s.playClear || s.sourcesOpen === true) fail(`${vn}${q}: story ${i} ${JSON.stringify(s)}`); });
  if (errors.length) fail(`${vn}${q}: errors ${errors.join("|")}`);
  console.log(vn, q || "apollo", JSON.stringify({ rows, list, story }));
  await ctx.close();
}
await browser.close();
console.log("failures:", out.failures.length);
