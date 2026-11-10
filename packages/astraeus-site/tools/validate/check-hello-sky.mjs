// The sky example (O-067 T-306), a step of `npm run check:browser`: examples/hello-sky, built from the packed `astraeus` and `astraeus-data-constellations` tarballs, is opened at desktop and phone size.
// It opens looking out from Earth toward Orion with the first of three steps open and Orion hidden; each step turns the view, the second and third select and trace Orion (the `sky-trace:Ori` and `sky-selected:Ori`
// line sets in `data-sky-lines` appear), leaving a step clears the trace, Back and Next are on or off as the step says, Orion's name opens its card, the ecliptic switch draws its line, and nothing collides.
// Read through the driver; no screenshot is taken.
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];
const near = (a, b, within) => Math.abs(a.raDeg - b.raDeg) < within && Math.abs(a.decDeg - b.decDeg) < within;
const panelId = async (page) => (await ui.openStoryPanelIds(page))[0] ?? null;

await checkScript({ name: "check-hello-sky", viewports: SIZES }, async (page, { name }) => {
  await ui.loadAddress(page, appUrl());
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  await ui.waitForStoryPanel(page, "the-hunter");
  // The first step: the view is the sky around Orion, Orion's figure is hidden, its neighbours show.
  await ui.waitForSkyLines(page, { present: ["sky-figures:Tau", "sky-figures:Gem"], absent: ["sky-figures:Ori", "sky-trace:Ori", "sky-selected:Ori"] });
  const start = await ui.waitForExampleCamera(page, (pose) => pose?.lookOut === "earth" && pose.fovDeg === 60);
  assert.ok(start?.lookOut === "earth" && near(start, { raDeg: 83.7, decDeg: 0 }, 1), `${name}: step 1 looks out from Earth toward Orion (${JSON.stringify(start)})`);
  assert.equal(await ui.storyStepEnabled(page, "back"), false, `${name}: Back is off on the first step`);
  assert.equal(await ui.storyStepEnabled(page, "next"), true, `${name}: Next is on the first step`);

  const fit = async (label) => {
    for (const which of ["back", "next"]) assert.equal(await ui.storyStepReachable(page, which), true, `${name}: ${label}: ${which} is not covered by anything`);
    assert.deepEqual(await ui.overlappingSceneLabels(page), [], `${name}: ${label}: no two labels overlap`);
    const box = await ui.storyPanelBox(page);
    const view = page.viewportSize();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= view.width + 0.5 && box.y + box.height <= view.height + 0.5, `${name}: ${label}: the story panel is inside the window (${JSON.stringify(box)})`);
    if (await ui.infoOpen(page)) {
      const card = await ui.infoPanel(page).boundingBox();
      assert.ok(card !== null && !(card.x < box.x + box.width && box.x < card.x + card.width && card.y < box.y + box.height && box.y < card.y + card.height), `${name}: ${label}: the card and the story panel do not overlap`);
    }
    for (const which of ["back", "next"]) {
      const b = await ui.storyStepBox(page, which);
      assert.ok(b && Math.min(b.width, b.height) >= (name === "phone" ? 44 : 24) && b.y + b.height <= view.height + 0.5, `${name}: ${label}: ${which} is big enough and inside the window`);
    }
  };
  await fit("step 1");

  await ui.pressStoryStep(page, "next");
  await ui.waitForOpenStoryPanel(page, "belt-and-sword");
  const belt = await ui.waitForExampleCamera(page, (pose) => pose?.lookOut === "earth" && pose.fovDeg === 28);
  assert.ok(belt?.lookOut === "earth" && near(belt, { raDeg: 84, decDeg: -3 }, 1), `${name}: step 2 turns to the belt and sword (${JSON.stringify(belt)})`);
  await ui.waitForSkyLines(page, { present: ["sky-trace:Ori", "sky-selected:Ori"] });
  await ui.waitForPicked(page, "Ori");
  assert.equal(await ui.storyStepEnabled(page, "back"), true, `${name}: Back is on in step 2`);
  await fit("step 2");

  await ui.pressStoryStep(page, "next");
  await ui.waitForOpenStoryPanel(page, "betelgeuse-and-rigel");
  const whole = await ui.waitForExampleCamera(page, (pose) => pose?.lookOut === "earth" && pose.fovDeg === 38);
  assert.ok(whole?.lookOut === "earth" && near(whole, { raDeg: 83.7, decDeg: 0 }, 1), `${name}: step 3 widens to the whole hunter (${JSON.stringify(whole)})`);
  await ui.waitForSkyLines(page, { present: ["sky-trace:Ori"] });
  assert.equal(await ui.storyStepEnabled(page, "next"), false, `${name}: Next is off on the last step`);
  await fit("step 3");
  await ui.waitForSceneLabel(page, "Ori", true);

  // Orion's name opens its card (the card is the engine's own).
  // On a wide screen the step's select has opened the card already; on a phone it opens no card (it would cover Back and Next), so the visitor opens it with the information button.
  if (name === "phone") assert.equal(await ui.infoOpen(page), false, `${name}: a step's select opens no card sheet on a phone`);
  else await ui.waitForInfo(page, { timeout: 5000 });
  if (name === "phone") await ui.toggleInfo(page);
  await ui.waitForInfo(page, { timeout: 5000 });
  assert.equal(await ui.infoTargetId(page), "Ori", `${name}: Orion's card opens`);
  assert.match(await ui.infoText(page), /Orion/, `${name}: the card names Orion`);
  await ui.closeInfo(page);

  // Back clears the trace Orion had in step 3 and traces it again for step 2; Back again returns to the hidden Orion.
  await ui.pressStoryStep(page, "back");
  await ui.waitForOpenStoryPanel(page, "belt-and-sword");
  await ui.pressStoryStep(page, "back");
  await ui.waitForOpenStoryPanel(page, "the-hunter");
  await ui.waitForSkyLines(page, { absent: ["sky-trace:Ori"] });
  assert.equal(await ui.storyStepEnabled(page, "back"), false, `${name}: Back is off again on the first step`);
  assert.equal(await panelId(page), "the-hunter", `${name}: the first step is open again`);

  // The ecliptic switch draws the Sun's path.
  assert.ok(!(await ui.displaySwitchOn(page, "ecliptic")), `${name}: the ecliptic starts off`);
  await ui.toggleDisplaySwitch(page, "ecliptic");
  await ui.waitForSkyLines(page, { present: ["sky-ecliptic"] });
  await ui.toggleDisplaySwitch(page, "ecliptic");
  await ui.waitForSkyLines(page, { absent: ["sky-ecliptic"] });
  return { start, belt, whole };
});
