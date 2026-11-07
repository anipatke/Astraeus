// Journey "Views" (O-051 T-221), a step of `npm run check:browser`: the made-up views scene (`?experience=synthetic-views`, dev server only: two made-up probes about Earth, three views) at 1280x720 and 375x667 with touch.
// A visitor switch (menu, timeline events and panel markers, clock and speed unchanged, the view choice clear of the other controls), a host `setView` (the dev page hands its host link to the scene), and the camera rule:
// the "stay" rule holds the camera still while the clock runs and the "follow" rule moves it with the probe. Everything goes through driver.mjs and the scene's own readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-views.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];
const IN_VIEW = {
  a: { bodies: ["earth", "probe-a"], hiddenBodies: ["probe-b"], events: ["Probe A event", "Shared event"], hiddenEvents: ["Probe B event"], panels: ["panel-a", "panel-shared"] },
  b: { bodies: ["earth", "probe-b"], hiddenBodies: ["probe-a"], events: ["Probe B event", "Shared event"], hiddenEvents: ["Probe A event"], panels: ["panel-b", "panel-shared"] },
  both: { bodies: ["earth", "probe-a", "probe-b"], hiddenBodies: [], events: ["Probe A event", "Probe B event", "Shared event"], hiddenEvents: [], panels: ["panel-a", "panel-b", "panel-shared"] },
};

await checkScript({ name: "journey-views", viewports: SIZES }, async (page, { name }) => {
  await ui.loadAddress(page, appUrl("experience=synthetic-views"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  const options = await ui.viewChoice(page);
  assert.deepEqual(options.map((option) => option.id), ["a", "b", "both"], "the bar offers the three views in order");
  assert.deepEqual(options.map((option) => option.label), ["Probe A", "Probe B", "Both"]);
  assert.equal(await ui.shownView(page), "a", "the scene opens on its first view");
  assert.equal(await ui.hostView(page), "a", "the host link reports the view showing");
  const fit = await ui.viewChoiceFit(page);
  assert.ok(fit.insideWindow && fit.overlaps.length === 0, `${name}: the view choice is inside the window and clear of the other controls (overlaps: ${fit.overlaps.join(", ") || "none"})`);
  const minButtonPx = name === "phone" ? 44 : 24;
  assert.ok(fit.smallestButtonPx >= minButtonPx, `${name}: the view buttons are big enough to press (${fit.smallestButtonPx} px, need ${minButtonPx})`);
  await ui.watchHostChanges(page);
  await expectView(page, "a");

  // A visitor switch keeps the clock and the speed, and the host hears it as a visitor's.
  const before = { clock: await ui.clockIso(page), speed: await ui.speed(page) };
  for (const id of ["b", "both", "a"]) {
    await ui.chooseView(page, id);
    await ui.waitForViewSettled(page);
    assert.equal(await ui.shownView(page), id, `the ${id} button shows as chosen`);
    await expectView(page, id);
    assert.equal(await ui.clockIso(page), before.clock, `switching to ${id} leaves the clock where it was`);
    assert.equal(await ui.speed(page), before.speed, `switching to ${id} leaves the speed as it was`);
  }
  const heard = await ui.hostChanges(page);
  assert.ok(heard.some((change) => change.view === "b" && change.cause === "visitor"), "the host hears the visitor's switch to b");

  // The camera rules, with the clock running: from a (following probe a, chosen from the camera menu) to b, the rule "follow probe b" moves the camera with probe b, so Earth moves on screen; from b back to a, probe b is gone and
  // the rule "stay" holds the camera where it was, so Earth stays put (the readout is the projected centre, valid even when off screen).
  await ui.pickBody(page, "probe-a");
  await ui.chooseCamera(page, "follow-probe-a");
  await ui.waitForBodySettled(page, "probe-a"); // the camera flies to probe a
  await ui.setFastestSpeed(page);
  await ui.ensurePlaying(page);
  await ui.chooseView(page, "b");
  await ui.waitForBodySettled(page, "probe-b"); // the camera has flown to probe b and follows it (probe b holds the middle of the view while Earth moves)
  const move1 = await ui.sceneBody(page, "earth");
  const move2 = await ui.waitForBodyMoved(page, "earth", move1); // up to the 2 s the old fixed wait gave
  assert.ok(Math.abs(move1.x - move2.x) + Math.abs(move1.y - move2.y) > 0.01, `Earth moves on screen while the camera follows probe b (${move1.x},${move1.y} -> ${move2.x},${move2.y})`);
  await ui.chooseView(page, "a");
  await ui.waitForBodySettled(page, "earth"); // the camera has stopped after the switch
  const still1 = await ui.sceneBody(page, "earth");
  await page.waitForTimeout(2000); // fixed on purpose: Earth must hold still for these 2 s with the clock running, so the length of the window is what is asserted
  const still2 = await ui.sceneBody(page, "earth");
  assert.ok(Math.abs(still1.x - still2.x) < 0.002 && Math.abs(still1.y - still2.y) < 0.002, `Earth holds still on screen while playing in the stay view (${still1.x},${still1.y} -> ${still2.x},${still2.y})`);
  assert.ok((await ui.clockMs(page)) > Date.parse(before.clock), "the clock ran on while the views were switched");
  await ui.ensurePaused(page);
  await ui.waitForClockSettled(page);

  // A host switch: the buttons follow, the host hears it as the host's, and the clock stays.
  const clock = await ui.clockIso(page);
  await ui.hostSetView(page, "b");
  await ui.waitForViewSettled(page);
  assert.equal(await ui.hostView(page), "b");
  assert.equal(await ui.shownView(page), "b", "the buttons follow a host's setView");
  await expectView(page, "b");
  assert.equal(await ui.clockIso(page), clock, "a host's setView leaves the clock where it was");
  const last = (await ui.hostChanges(page)).at(-1);
  assert.deepEqual({ view: last.view, cause: last.cause }, { view: "b", cause: "host" }, "the host hears its own switch as host");
  return { fit, still: [still1.x, still1.y, still2.x, still2.y], hostHeard: (await ui.hostChanges(page)).length };
});

/** The menu, the timeline's events and panel markers and the drawn paths of a view. */
async function expectView(page, id) {
  const want = IN_VIEW[id];
  const menu = await ui.bodyOptions(page);
  for (const body of want.bodies) assert.ok(menu.includes(body), `view ${id}: the Object list holds ${body} (${menu.join(", ")})`);
  for (const body of want.hiddenBodies) assert.ok(!menu.includes(body), `view ${id}: the Object list leaves out ${body}`);
  await ui.openEventList(page);
  const rows = (await ui.eventRowTexts(page)).join("\n");
  await ui.closeEventList(page);
  for (const event of want.events) assert.ok(rows.includes(event), `view ${id}: the timeline lists "${event}"`);
  for (const event of want.hiddenEvents) assert.ok(!rows.includes(event), `view ${id}: the timeline leaves out "${event}"`);
  assert.deepEqual(await ui.listedStoryPanelIds(page), [...want.panels].sort(), `view ${id}: the timeline carries only this view's panel markers`);
  await ui.waitForProbePathsSettled(page); // the path readouts update with the next drawn frame
  for (const probe of ["probe-a", "probe-b"]) {
    const shown = want.bodies.includes(probe);
    const path = await ui.scenePath(page, probe);
    assert.equal(path?.visible === true, shown, `view ${id}: ${probe}'s line is ${shown ? "drawn" : "hidden"}`);
  }
}
