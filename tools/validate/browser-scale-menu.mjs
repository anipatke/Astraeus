// T-079: the three-scale menu (O-020 Decision 7), driven in a small dev-server harness because no shipped experience offers three scales yet.
// Scenarios: closed by default; opens on press and on ArrowDown from the button; focus lands on the current scale; ArrowDown/ArrowUp wrap;
// Home/End; Escape closes and returns focus; Enter chooses and closes; the button's name tracks the choice; an outside press closes.
//   ASTRAEUS_URL=http://localhost:5491/app.html PLAYWRIGHT_CORE=... node tools/validate/browser-scale-menu.mjs
import assert from "node:assert/strict";
const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = (pw.default ?? pw).chromium;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 600, height: 400 } });
await p.goto(new URL("/tools/validate/harness/scale-menu.html", process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html").href); await p.waitForSelector(".scale-menu-trigger");
const trig = p.locator(".scale-menu-trigger"), menu = p.locator(".scale-menu");
assert.equal(await menu.isVisible(), false);
await trig.click(); assert.equal(await menu.isVisible(), true);
assert.equal(await trig.getAttribute("aria-expanded"), "true");
assert.equal(await p.evaluate(() => document.activeElement.dataset.scale), "true-scale", "focus on current");
if (process.env.ASTRAEUS_EVIDENCE_DIR) await p.screenshot({ path: `${process.env.ASTRAEUS_EVIDENCE_DIR}/scale-menu-open.png` });
await p.keyboard.press("ArrowDown"); assert.equal(await p.evaluate(() => document.activeElement.dataset.scale), "readable-scale");
await p.keyboard.press("End"); assert.equal(await p.evaluate(() => document.activeElement.dataset.scale), "solar-system");
await p.keyboard.press("ArrowDown"); assert.equal(await p.evaluate(() => document.activeElement.dataset.scale), "true-scale", "wraps");
await p.keyboard.press("ArrowUp"); assert.equal(await p.evaluate(() => document.activeElement.dataset.scale), "solar-system");
await p.keyboard.press("Escape"); assert.equal(await menu.isVisible(), false); assert.equal(await p.evaluate(() => document.activeElement.className.includes("scale-menu-trigger")), true, "Escape returns focus");
assert.equal(await trig.getAttribute("data-scale-label"), "True");
await trig.press("ArrowDown"); assert.equal(await menu.isVisible(), true);
await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter");
assert.equal(await trig.getAttribute("data-scale-label"), "Readable"); assert.equal(await menu.isVisible(), false);
assert.equal(await trig.getAttribute("aria-label"), "Scale: Readable, choose another");
await trig.click(); await p.click("#outside"); assert.equal(await menu.isVisible(), false, "outside click closes");
await trig.click(); await p.getByRole("menuitemradio", { name: "Solar system", exact: true }).click();
assert.equal(await trig.getAttribute("data-scale-label"), "Solar system");
console.log("scale menu ok"); await b.close();
