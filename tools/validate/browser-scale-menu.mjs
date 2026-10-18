// T-079: the three-scale menu (O-020 Decision 7), driven in a small dev-server harness because no shipped experience offers three scales yet.
// Scenarios: closed by default; opens on press and on ArrowDown from the button; focus lands on the current scale; ArrowDown/ArrowUp wrap;
// Home/End; Escape closes and returns focus; Enter chooses and closes; the button's name tracks the choice; an outside press closes.
//   ASTRAEUS_URL=http://localhost:5491/app.html PLAYWRIGHT_CORE=... node tools/validate/browser-scale-menu.mjs
import assert from "node:assert/strict";
import { scaleMenu } from "./driver.mjs";
const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = (pw.default ?? pw).chromium;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 600, height: 400 } });
await p.goto(new URL("/tools/validate/harness/scale-menu.html", process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html").href); const ui = scaleMenu(p); await ui.waitForTrigger();
assert.equal(await ui.isOpen(), false);
await ui.open(); assert.equal(await ui.isOpen(), true);
assert.equal(await ui.expanded(), "true");
assert.equal(await ui.focusedScale(), "true-scale", "focus on current");
await ui.key("ArrowDown"); assert.equal(await ui.focusedScale(), "readable-scale");
await ui.key("End"); assert.equal(await ui.focusedScale(), "solar-system");
await ui.key("ArrowDown"); assert.equal(await ui.focusedScale(), "true-scale", "wraps");
await ui.key("ArrowUp"); assert.equal(await ui.focusedScale(), "solar-system");
await ui.key("Escape"); assert.equal(await ui.isOpen(), false); assert.equal(await ui.triggerFocused(), true, "Escape returns focus");
assert.equal(await ui.chosenLabel(), "True");
await ui.openByKey("ArrowDown"); assert.equal(await ui.isOpen(), true);
await ui.key("ArrowDown"); await ui.key("Enter");
assert.equal(await ui.chosenLabel(), "Readable"); assert.equal(await ui.isOpen(), false);
assert.equal(await ui.triggerName(), "Scale: Readable, choose another");
await ui.open(); await ui.pressOutside(); assert.equal(await ui.isOpen(), false, "outside click closes");
await ui.open(); await ui.chooseItem("Solar system");
assert.equal(await ui.chosenLabel(), "Solar system");
console.log("scale menu ok"); await b.close();
