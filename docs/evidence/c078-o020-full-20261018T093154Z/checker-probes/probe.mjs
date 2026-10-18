// Independent O-020 Objective Check probe (C-078). Not a project script; reads the page directly.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE);
const BASE = process.env.BASE ?? "http://localhost:5611/app.html";
const ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const EXPS = { apollo: "", "earth-moon": "?experience=earth-moon", "jupiter-io": "?experience=jupiter-io", perseids: "?experience=showers&shower=perseids", geminids: "?experience=showers&shower=geminids" };
const VIEWS = {
  "phone-portrait": { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  "phone-small": { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
  "phone-landscape": { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
  "tablet": { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
  "laptop": { viewport: { width: 1024, height: 768 } },
  "desktop": { viewport: { width: 1440, height: 900 } },
};
const out = { loads: [], phone: [], collapsible: null, failures: [] };
const fail = (m) => { out.failures.push(m); console.log("FAIL", m); };
const browser = await chromium.launch({ args: ARGS });

async function open(viewName, exp, extra = {}) {
  const ctx = await browser.newContext({ ...VIEWS[viewName], ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + EXPS[exp], { waitUntil: "load" });
  await page.waitForSelector(".timeline-bar", { timeout: 90000 });
  await page.waitForTimeout(1500);
  return { ctx, page, errors };
}

// Layout facts read straight from the DOM.
const measure = (page) => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[hidden],[inert],[aria-hidden='true']") && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  const shell = document.querySelector(".astraeus-shell");
  const controls = [...document.querySelectorAll("button, select, summary, input")].filter(vis).filter((el) => !el.closest(".developer-tools"));
  const small = controls.map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r, el }) => (r.height < 43.5 || (r.width < 43.5 && el.type !== "range"))).map(({ el, r }) => `${el.tagName.toLowerCase()}[${el.getAttribute("aria-label") ?? el.textContent.trim().slice(0, 20)}] ${Math.round(r.width)}x${Math.round(r.height)}`);
  const overflow = [...document.querySelectorAll(".astraeus-shell *")].filter((el) => el.tagName !== "CANVAS" && vis(el)).filter((el) => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).slice(0, 5).map((el) => `${el.className || el.tagName} ${Math.round(el.getBoundingClientRect().left)}..${Math.round(el.getBoundingClientRect().right)}`);
  const tiny = [...document.querySelectorAll(".astraeus-shell *")].filter((el) => vis(el) && el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.closest(".developer-tools")).filter((el) => parseFloat(getComputedStyle(el).fontSize) < 11).map((el) => `${el.className}:${getComputedStyle(el).fontSize}`).slice(0, 5);
  const box = (sel) => { const el = document.querySelector(sel); if (!el || !vis(el)) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width) }; };
  return {
    phone: shell?.dataset.phone, embedded: shell?.dataset.embedded,
    hScroll: document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth,
    overflow, small, tiny,
    timeline: box(".timeline-bar"), toolbar: box(".shell-toolbar") ?? box(".top-bar"), pill: box(".controls-pill"), cog: box(".developer-mode-toggle"),
    names: ["Play playback", "Pause playback", "Developer mode", "Select object", "Seek timeline", "Playback speed"].filter((n) => document.querySelector(`[aria-label="${n}"]`)),
  };
});

for (const viewName of Object.keys(VIEWS)) {
  for (const exp of Object.keys(EXPS)) {
    const { ctx, page, errors } = await open(viewName, exp);
    const m = await measure(page);
    out.loads.push({ view: viewName, exp, ...m, errors });
    const isPhone = viewName.startsWith("phone");
    if (String(m.phone) !== String(isPhone)) fail(`${viewName}/${exp}: data-phone=${m.phone}`);
    if (m.hScroll || m.overflow.length) fail(`${viewName}/${exp}: horizontal overflow ${m.overflow.join("; ")}`);
    if (isPhone && m.small.length) fail(`${viewName}/${exp}: targets under 44px: ${m.small.join("; ")}`);
    if (m.tiny.length) fail(`${viewName}/${exp}: text under 11px: ${m.tiny.join("; ")}`);
    if (errors.length) fail(`${viewName}/${exp}: console errors ${errors.join(" | ")}`);
    if (!m.names.includes("Developer mode") || !m.names.includes("Seek timeline") || !(m.names.includes("Play playback") || m.names.includes("Pause playback"))) fail(`${viewName}/${exp}: names ${m.names}`);
    console.log(viewName, exp, JSON.stringify({ tl: m.timeline?.height, bar: m.toolbar?.height, pill: !!m.pill, small: m.small.length }));
    await ctx.close();
  }
}

// Phone interactions, independent of the project driver.
async function phoneFlow(viewName, exp, reduced) {
  const { ctx, page, errors } = await open(viewName, exp, reduced ? { reducedMotion: "reduce" } : {});
  const r = { view: viewName, exp, reduced };
  const state = () => page.evaluate(() => ({
    top: document.querySelector("#controls-drawer")?.dataset.open,
    tl: document.querySelector(".timeline-bar")?.dataset.drawerOpen,
    time: document.querySelector(".timeline-time")?.getAttribute("datetime"),
    playing: !!document.querySelector('[aria-label="Pause playback"]'),
    pick: document.querySelector('[aria-label="Select object"]')?.value,
  }));
  const center = (sel) => page.locator(sel).first().boundingBox().then((b) => b && ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }));
  const drag = async (from, dy) => { await page.mouse.move(from.x, from.y); await page.mouse.down(); for (let i = 1; i <= 8; i++) await page.mouse.move(from.x, from.y + (dy * i) / 8); await page.mouse.up(); await page.waitForTimeout(400); };
  r.initial = await state();
  if (r.initial.top !== "false" || r.initial.tl !== "false") fail(`${viewName}/${exp}: drawers not closed at start ${JSON.stringify(r.initial)}`);
  // Scene drags in several directions, including just above the timeline and just below the pill.
  const W = VIEWS[viewName].viewport.width, H = VIEWS[viewName].viewport.height;
  const tl = (await page.locator(".timeline-bar").boundingBox());
  const pill = (await page.locator(".controls-pill").boundingBox());
  for (const [p, dy] of [[{ x: W / 2, y: H / 2 }, -180], [{ x: W / 2, y: H / 2 }, 180], [{ x: W / 2, y: tl.y - 12 }, -150], [{ x: W / 2, y: pill.y + pill.height + 12 }, 150]]) await drag(p, dy);
  const afterDrags = await state();
  if (afterDrags.top !== "false" || afterDrags.tl !== "false") fail(`${viewName}/${exp}: scene drag opened a drawer ${JSON.stringify(afterDrags)}`);
  // Play, then open each drawer by tap and by swipe; state must survive.
  await page.locator('[aria-label="Play playback"]').click();
  await page.waitForTimeout(300);
  await page.locator(".controls-pill").click();
  await page.waitForTimeout(500);
  const s1 = await state();
  if (s1.top !== "true" || !s1.playing) fail(`${viewName}/${exp}: pill tap ${JSON.stringify(s1)}`);
  if (reduced) { const t = await page.evaluate(() => getComputedStyle(document.querySelector("#controls-drawer")).transitionDuration); r.reducedTransition = t; if (!/^0s(, 0s)*$/.test(t)) fail(`${viewName}/${exp}: reduced motion transition ${t}`); }
  await page.locator('[aria-label="Hide controls"]').click();
  await page.waitForTimeout(500);
  const s2 = await state();
  if (s2.top !== "false" || !s2.playing) fail(`${viewName}/${exp}: hide controls ${JSON.stringify(s2)}`);
  await drag(await center(".controls-pill"), 120); // swipe down on the pill opens
  const s3 = await state();
  if (s3.top !== "true") fail(`${viewName}/${exp}: pill swipe down did not open`);
  await drag(await center('[aria-label="Hide controls"]'), -120);
  const s4 = await state();
  if (s4.top !== "false") fail(`${viewName}/${exp}: handle swipe up did not close`);
  await drag(await center('[aria-label="Timeline drawer"]'), -120);
  const s5 = await state();
  if (s5.tl !== "true" || !s5.playing) fail(`${viewName}/${exp}: timeline swipe up ${JSON.stringify(s5)}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const s6 = await state();
  if (s6.tl !== "false") fail(`${viewName}/${exp}: Escape did not close timeline drawer`);
  await page.locator('[aria-label="Timeline drawer"]').click();
  await page.waitForTimeout(400);
  const s7 = await state();
  if (s7.tl !== "true") fail(`${viewName}/${exp}: timeline tap did not open`);
  r.timelineDrawer = await page.evaluate(() => { const d = document.querySelector("#timeline-drawer"); const b = d.getBoundingClientRect(); return { height: Math.round(b.height), top: Math.round(b.top), slider: !!document.querySelector('[aria-label="Speed slider"]') }; });
  if (!r.timelineDrawer.slider) fail(`${viewName}/${exp}: no speed slider in timeline drawer`);
  await page.locator('[aria-label="Timeline drawer"]').click();
  await page.waitForTimeout(400);
  // Pause, open info from the controls, Sources closed, sheet clear of Play.
  await page.locator('[aria-label="Pause playback"]').click();
  await page.locator(".controls-pill").click();
  await page.waitForTimeout(400);
  const info = page.locator('.controls-drawer [aria-label^="Information about"]').first();
  if (await info.count()) {
    await info.click();
    await page.waitForTimeout(700);
    r.info = await page.evaluate(() => {
      const panel = document.querySelector("#info-panel"); const play = document.querySelector('[aria-label="Play playback"]');
      if (!panel) return { panel: false };
      const pr = panel.getBoundingClientRect(), pl = play.getBoundingClientRect();
      const hit = document.elementFromPoint(pl.x + pl.width / 2, pl.y + pl.height / 2);
      const src = panel.querySelector("details.sources-section");
      return { panel: true, sheetBottom: Math.round(pr.bottom), playTop: Math.round(pl.top), playReachable: play.contains(hit), sourcesOpen: src?.open ?? null, hasSources: !!src, drawerOpen: document.querySelector("#controls-drawer").dataset.open };
    });
    if (!r.info.panel) fail(`${viewName}/${exp}: info sheet did not open`);
    else {
      if (!r.info.playReachable) fail(`${viewName}/${exp}: info sheet covers Play ${JSON.stringify(r.info)}`);
      if (r.info.hasSources && r.info.sourcesOpen !== false) fail(`${viewName}/${exp}: sources not closed by default`);
    }
  } else fail(`${viewName}/${exp}: no Info button in drawer`);
  // Developer panel on a phone: fits, headings 44 px.
  await page.locator('[aria-label="Developer mode"]').click();
  await page.waitForTimeout(700);
  r.dev = await page.evaluate(() => { const d = document.querySelector(".developer-tools"); if (!d) return null; const b = d.getBoundingClientRect(); const hs = [...d.querySelectorAll(".collapsible-toggle")].map((h) => Math.round(h.getBoundingClientRect().height)); return { left: Math.round(b.left), right: Math.round(b.right), w: innerWidth, headings: hs, open: [...d.querySelectorAll(".collapsible-toggle[aria-expanded='true']")].length }; });
  if (!r.dev || r.dev.left < 0 || r.dev.right > r.dev.w + 1) fail(`${viewName}/${exp}: developer panel ${JSON.stringify(r.dev)}`);
  else if (r.dev.headings.some((h) => h < 44)) fail(`${viewName}/${exp}: dev headings ${r.dev.headings}`);
  r.errors = errors;
  if (errors.length) fail(`${viewName}/${exp}: console errors ${errors.join(" | ")}`);
  out.phone.push(r);
  console.log("phone", viewName, exp, JSON.stringify(r));
  await ctx.close();
}
for (const [v, e, red] of [["phone-portrait", "apollo", false], ["phone-portrait", "perseids", true], ["phone-landscape", "jupiter-io", false], ["phone-small", "earth-moon", true]]) {
  try { await phoneFlow(v, e, red); } catch (err) { fail(`${v}/${e}: flow threw ${String(err).split("\n")[0]}`); }
}

// Story panel on a phone never covers Play: Perseids panels open from the timeline markers.
try {
  const { ctx, page, errors } = await open("phone-portrait", "perseids");
  const marks = page.locator('[aria-label^="Open story panel"]');
  const n = await marks.count();
  const res = [];
  for (let i = 0; i < n; i++) {
    await marks.nth(i).click({ force: true });
    await page.waitForTimeout(700);
    res.push(await page.evaluate(() => { const play = document.querySelector('[aria-label="Play playback"],[aria-label="Pause playback"]'); const b = play.getBoundingClientRect(); const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); const s = document.querySelector(".story-panel"); return { story: !!s, ok: play.contains(hit), src: s?.querySelector("details.sources-section")?.open ?? null }; }));
  }
  out.story = { n, res, errors };
  if (n === 0) fail("perseids phone: no story markers");
  res.forEach((x, i) => { if (!x.story || !x.ok || x.src === true) fail(`perseids phone story ${i}: ${JSON.stringify(x)}`); });
  console.log("story", JSON.stringify(out.story));
  await ctx.close();
} catch (err) { fail(`story flow threw ${String(err).split("\n")[0]}`); }

// Folds: a first-time viewer who never touches a fold, moving from Apollo to Earth-Moon.
try {
  const ctx = await browser.newContext(VIEWS.desktop);
  const page = await ctx.newPage();
  const openFolds = async (q) => { await page.goto(BASE + q); await page.waitForSelector(".timeline-bar", { timeout: 90000 }); await page.locator('[aria-label="Developer mode"]').click(); await page.waitForTimeout(800); return page.evaluate(() => [...document.querySelectorAll(".developer-tools .collapsible-toggle")].filter((b) => !b.closest(".collapsible-nested")).map((b) => `${b.dataset.foldToggle}:${b.getAttribute("aria-expanded")}`)); };
  const a = await openFolds("");
  const e = await openFolds("?experience=earth-moon");
  const ctx2 = await browser.newContext(VIEWS.desktop); const p2 = await ctx2.newPage();
  await p2.goto(BASE + "?experience=earth-moon"); await p2.waitForSelector(".timeline-bar", { timeout: 90000 }); await p2.locator('[aria-label="Developer mode"]').click(); await p2.waitForTimeout(800);
  const fresh = await p2.evaluate(() => [...document.querySelectorAll(".developer-tools .collapsible-toggle")].filter((b) => !b.closest(".collapsible-nested")).map((b) => `${b.dataset.foldToggle}:${b.getAttribute("aria-expanded")}`));
  out.collapsible = { apollo: a, earthMoonAfterApollo: e, earthMoonFresh: fresh };
  console.log("folds", JSON.stringify(out.collapsible));
  await ctx.close(); await ctx2.close();
} catch (err) { fail(`folds threw ${String(err).split("\n")[0]}`); }

await browser.close();
const fs = await import("node:fs");
fs.writeFileSync(process.env.OUT ?? "probe-results.json", JSON.stringify(out, null, 2));
console.log(`failures: ${out.failures.length}`);
