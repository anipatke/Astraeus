// Journey "Group labels" (O-101 T-463), a step of `npm run check:browser` (full tier): ?experience=synthetic-group-labels, two made-up swarms of four brightness groups each with one host label on each (dev server only), at 1440x900 with a mouse and 390x844 with touch.
// Paused at the opening time: both swarm labels are shown and none of the eight groups' own names is; each swarm label's rectangle lies within 24 px of its four groups' dots' box;
// a drag starting on a label turns the camera and selects nothing; a tap selects the swarm, and opens its card on the wide layout only. Everything goes through driver.mjs and the page's own data- readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-group-labels.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const EDGE_PX = 24;
const SWARMS = [
  { label: "swarm-ahead", groups: [1, 2, 3, 4].map((n) => `ahead-${n}`) },
  { label: "swarm-behind", groups: [1, 2, 3, 4].map((n) => `behind-${n}`) },
];

await checkScript({ name: "journey-group-labels", viewports: SIZES }, async (page, { name, viewport }) => {
  const phone = viewport.isMobile === true;
  await page.goto(appUrl("experience=synthetic-group-labels"));
  await page.waitForSelector("[data-label-id]", { state: "attached", timeout: 60000 });
  await ui.ensurePaused(page);
  const shown = await ui.waitUntil(
    page,
    () => ui.shownSceneLabelIds(page),
    (ids) => SWARMS.every((swarm) => ids.includes(swarm.label)),
    { timeout: 15000, what: "both swarm labels shown at the opening view" },
  );
  const own = SWARMS.flatMap((swarm) => swarm.groups).filter((id) => shown.includes(id));
  assert.deepEqual(
    own,
    [],
    `${name}: none of the eight groups shows a name of its own (shown: ${JSON.stringify(shown)})`,
  );

  // Each swarm label sits on its swarm: its rectangle within 24 px of the union of its four groups' in-view dot boxes (shares of the view).
  const [canvas] = await ui.canvasBoxes(page);
  const offsets = {};
  for (const swarm of SWARMS) {
    const boxes = (await Promise.all(swarm.groups.map((id) => ui.scenePointGroup(page, id)))).filter(
      (group) => group?.drawn && group.inView > 0,
    );
    assert.equal(boxes.length, swarm.groups.length, `${name}: all four of ${swarm.label}'s groups have dots in view`);
    const left = canvas.x + Math.min(...boxes.map((b) => b.minX)) * canvas.width;
    const right = canvas.x + Math.max(...boxes.map((b) => b.maxX)) * canvas.width;
    const top = canvas.y + Math.min(...boxes.map((b) => b.minY)) * canvas.height;
    const bottom = canvas.y + Math.max(...boxes.map((b) => b.maxY)) * canvas.height;
    const tag = await ui.labelBox(page, swarm.label);
    assert.ok(tag !== null, `${name}: ${swarm.label} is showing`);
    // The name is drawn beside its anchor, so its rectangle (not its centre) is what stands on the dots: how far the rectangle lies outside the dots' own box (0 where they overlap), per axis.
    const outX = Math.max(left - tag.right, tag.left - right, 0);
    const outY = Math.max(top - tag.bottom, tag.top - bottom, 0);
    offsets[swarm.label] = { outX: Math.round(outX), outY: Math.round(outY) };
    assert.ok(
      outX <= EDGE_PX && outY <= EDGE_PX,
      `${name}: ${swarm.label} (${JSON.stringify(tag)}) sits on its dots (box ${[left, top, right, bottom].map(Math.round)} plus ${EDGE_PX} px)`,
    );
  }

  // The opening view has settled (the labels stand still) before anything is pressed.
  await ui.waitUntilStable(page, () => Promise.all(shown.map((id) => ui.labelCentre(page, id))), {
    reads: 5,
    every: 150,
  });
  // A drag from the behind swarm's label turns the camera (another shown label moves, or goes) and selects nothing. That swarm sits high on a phone; the ahead one sits low, near the bottom controls, where a press may start on them.
  const first = SWARMS[1];
  const selected = await ui.selectedObjectValue(page);
  const others = shown.filter((id) => id !== first.label);
  const before = new Map(await Promise.all(others.map(async (id) => [id, await ui.labelCentre(page, id)])));
  await ui.dragFromLabel(page, first.label, 60, 30);
  const moved = await ui.waitUntil(
    page,
    async () => {
      const now = await Promise.all(others.map((id) => ui.labelCentre(page, id)));
      return now.some((at, n) => {
        const was = before.get(others[n]);
        return was !== null && (at === null || Math.hypot(at.x - was.x, at.y - was.y) > 5);
      });
    },
    (done) => done === true,
    { timeout: 5000, what: `${name}: another label moving with a drag that started on the first swarm's label` },
  );
  assert.equal(moved, true, `${name}: a drag from a label moves the camera`);
  assert.equal(await ui.selectedObjectValue(page), selected, `${name}: a drag from a label selects nothing`);
  assert.equal(await ui.infoOpen(page), false, `${name}: a drag from a label opens no card`);
  // Turn back, so the tap reads the label where it began.
  const grip = (await Promise.all(shown.map(async (id) => [id, await ui.labelCentre(page, id)]))).find(
    ([, at]) => at !== null,
  );
  assert.ok(grip, `${name}: a label is still on screen to drag the camera back`);
  await ui.dragFromLabel(page, grip[0], -60, -30);

  // A tap on the first swarm label selects it: a card on the wide layout, none on the phone.
  await ui.waitUntil(
    page,
    () => ui.labelCentre(page, first.label),
    (at) => at !== null,
    {
      timeout: 5000,
      what: `${first.label} on screen before the tap`,
    },
  );
  await ui.tapLabel(page, first.label);
  await ui.waitForPicked(page, first.label);
  if (!phone) {
    await ui.waitForInfo(page, { timeout: 5000 });
    assert.equal(await ui.infoTargetId(page), first.label, `${name}: the card opened is ${first.label}'s`);
  } else {
    assert.equal(await ui.infoOpen(page), false, `${name}: a tap opens no card on the phone`);
  }
  return { shown, phone, offsets };
});
