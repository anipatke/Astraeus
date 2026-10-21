// Story panels (O-015 / T-059): auto-open on forward playback, brief pause, one at a time, markers, settings, phone sheet; T-089 adds the Geminids, Earth–Moon and Jupiter–Io stories.
// Run the app, then:
//   PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_URL=http://localhost:5401/app.html ASTRAEUS_OUT=docs/evidence/o015-t059-<UTC stamp> node tools/validate/browser-story-panels.mjs
// Writes results.json into ASTRAEUS_OUT, which must not already hold files (historical evidence is never overwritten).
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";
import { launchBrowser, openContext, pageIn, watchErrors } from "./harness.mjs";

const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const out = process.env.ASTRAEUS_OUT;
if (out === undefined) throw new Error("set ASTRAEUS_OUT to a fresh evidence directory");
mkdirSync(out, { recursive: true });
if (readdirSync(out).length > 0) throw new Error(`${out} is not empty; use a fresh directory`);

const readJson = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
const apolloPanels = readJson("data/stories/apollo11/panels.json").panels;
const perseidsPanels = readJson("data/stories/perseids/panels.json").panels;
const anchorTimes = new Map(readJson("data/apollo11/normalised/anchors.json").anchors.map((anchor) => [anchor.id, anchor.timeUtcMs]));
const eventTimes = new Map(readJson("data/apollo11/generated/events.json").events.map((event) => [event.id, event.timeUtcMs]));
const apolloTime = (panel) => panel.at.anchor !== undefined ? anchorTimes.get(panel.at.anchor) : panel.at.event !== undefined ? eventTimes.get(panel.at.event) : Date.parse(panel.at.utc);
// T-089: the three further stories, each a panels file under data/stories/<story>/ (times are utc, or the shower's peak event).
const geminidsPeak = Date.parse(readJson("data/showers/geminids.json").activity.peakUtc);
const utcOr = (events) => (panel) => panel.at.utc !== undefined ? Date.parse(panel.at.utc) : events[panel.at.event];
const moreStories = [
  { name: "Geminids", experience: "showers&shower=geminids", time: utcOr({ "geminids-peak": geminidsPeak }), file: "data/stories/geminids/panels.json" },
  { name: "Jupiter–Io", experience: "jupiter-io", time: utcOr({}), file: "data/stories/jupiter-io/panels.json" },
].map((story) => ({ ...story, panels: [...readJson(story.file).panels].sort((a, b) => story.time(a) - story.time(b)) }));
const perseidsUrl =process.env.ASTRAEUS_PERSEIDS_URL ?? `${url}?experience=showers`;
const TLI = -14542676800; // anchor A-02
const LANDING = -14182940100; // anchor A-LND
// O-034 T-112: STORY_ONLY=apollo|showers|jupiter limits the run to one demo's stories (each demo's set runs its own); unset runs all of them.
const storyOnly = process.env.STORY_ONLY;
const want = (demo) => storyOnly === undefined || storyOnly === demo;
const results = [];
const errors = [];
const note = (name, detail = "") => { results.push({ name, detail }); console.log(`ok  ${name}${detail === "" ? "" : ` (${detail})`}`); };

const browser = await launchBrowser();

async function open(viewport, extra = {}) {
  const context = await openContext(browser, { viewport, ...extra });
  const page = await pageIn(context);
  watchErrors(page, errors);
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  return { context, page };
}

const seekTo = ui.seekTo;
const isPlaying = ui.isPlaying;
const openPanelIds = ui.openStoryPanelIds;

try {
  // ---- Desktop ----
  if (want("apollo")) {
  const { context, page } = await open({ width: 1440, height: 900 });
  assert.equal(await ui.storyMarkers(page).count(), apolloPanels.length, "a timeline marker per panel");
  note("timeline shows a marker per panel", String(apolloPanels.length));

  // Panel 1 opens by itself as playback reaches the cutoff anchor, and playback holds.
  await ui.storyPanel(page, "tli-cutoff").waitFor({ timeout: 15000 });
  assert.equal(await isPlaying(page), false, "playback holds while the panel opens");
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  const panel = ui.storyPanel(page);
  const firstPanel = apolloPanels.find((entry) => entry.id === "tli-cutoff");
  assert.ok((await panel.innerText()).includes(firstPanel.title), "the first panel shows its title");
  assert.equal(await ui.storyPanelBadge(page), "observed");
  assert.ok((await ui.storyPanelSources(page)) >= 1, "a source line");
  // T-087: one folded section, closed by default, one tap opens it and another folds it away (details appear only where a panel has them).
  assert.equal(await ui.storySectionCount(page), 1, "one folded section per panel");
  assert.equal(await ui.storySourcesOpen(page), false, "the section is closed by default");
  const sectionLabel = await ui.storySectionLabel(page);
  assert.match(sectionLabel, (await ui.storyPanelDetails(page)).length > 0 ? /^The details and sources/ : /^Sources/, "label follows whether details exist");
  assert.deepEqual(await ui.storyPanelDetailsShown(page), [], "no details show while the section is folded");
  await ui.openStorySources(page);
  assert.equal(await ui.storySourcesOpen(page), true, "one tap opens the section");
  // C-066 / T-088: once opened, the panel's details paragraphs are what a person sees, word for word from the settings file.
  assert.deepEqual(await ui.storyPanelDetailsShown(page), firstPanel.details ?? [], "the panel's details show once the section opens");
  assert.equal(await ui.storySectionLabel(page), sectionLabel, "the label stays stable when opened");
  await ui.closeStorySources(page);
  assert.equal(await ui.storySourcesOpen(page), false, "another tap folds it away");
  await page.waitForTimeout(600); // the panel slides in; measure it at rest
  const box = await panel.boundingBox();
  assert.ok(box.x > 1440 / 2 && box.x + box.width <= 1440, "desktop side panel sits on the right");
  note("forward playback opens the first panel and holds playback", "side panel at right");

  // Resumes on its own after the pause length (6 s default).
  await ui.waitUntilPlaying(page, 12000);
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"], "panel stays open after resuming");
  note("playback resumes on its own after the pause", "panel stays open");

  // Close, then Continue-on-tap path: a second hold ended by the tap.
  await ui.closeStoryPanel(page);
  assert.equal((await openPanelIds(page)).length, 0);
  await ui.pausePlayback(page);
  await seekTo(page, LANDING - 60_000);
  await page.waitForTimeout(400);
  assert.equal((await openPanelIds(page)).length, 0, "a seek forward opens nothing");
  await ui.playPlayback(page);
  await ui.storyPanel(page, "touchdown").waitFor({ timeout: 10000 });
  assert.equal(await isPlaying(page), false);
  await ui.continuePlayback(page);
  assert.equal(await isPlaying(page), true, "Continue resumes at once");
  note("a tap on Continue resumes playback early");

  // Scrubbing across both markers never opens a panel or stacks one.
  await ui.closeStoryPanel(page);
  // While playing, a seek far past the markers opens nothing (the check starts again from the new time, and 150 ms of playback is short).
  for (const t of [LANDING + 1000, TLI - 3_600_000 * 2, (TLI + LANDING) / 2]) {
    await seekTo(page, Math.round(t));
    await page.waitForTimeout(150);
    assert.equal((await openPanelIds(page)).length, 0, "a seek while playing opens nothing");
  }
  await ui.pausePlayback(page);
  for (const t of [TLI + 1000, LANDING + 1000, TLI - 5000, LANDING - 5000, TLI - 1, LANDING - 1]) { await seekTo(page, Math.round(t)); await page.waitForTimeout(150); }
  assert.equal((await openPanelIds(page)).length, 0, "scrubbing while paused opens nothing");
  note("scrubbing back and forth past the markers opens nothing");

  // Timeline marker: seeks and opens; a second marker replaces, never stacks.
  await ui.openStoryPanel(page, "tli-cutoff");
  await ui.storyPanel(page, "tli-cutoff").waitFor({ timeout: 5000 });
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  await ui.openStoryPanel(page, "touchdown");
  await ui.storyPanel(page, "touchdown").waitFor({ timeout: 5000 });
  assert.deepEqual(await openPanelIds(page), ["touchdown"]);
  assert.equal(await ui.storyMarkers(page, "touchdown").getAttribute("aria-pressed"), "true");
  note("timeline markers open their panel, one at a time");

  // Scene marker on Eagle (touchdown time, Eagle in bounds). I-031: panels naming one object share one marker, and every one opens from it.
  await ui.closeStoryPanel(page);
  await ui.pickBody(page, "eagle");
  await ui.chooseCamera(page, "focus-eagle");
  await page.waitForTimeout(1800);
  assert.equal(await ui.sceneStoryMarker(page, "touchdown").isVisible(), true, "scene marker shows on Eagle");
  const eaglePanels = apolloPanels.filter((entry) => entry.object === "eagle").sort((a, b) => apolloTime(a) - apolloTime(b)).map((entry) => entry.id);
  assert.ok(eaglePanels.length >= 2, "the story names Eagle in more than one panel");
  for (const id of eaglePanels) assert.equal(await ui.sceneStoryMarker(page, id).count(), 1, `${id} sits on exactly one scene marker`);
  assert.deepEqual(await ui.sceneStoryMarkerPanelIds(page, "touchdown"), eaglePanels, "one Eagle marker carries all its panels, in time order");
  await ui.pressSceneStoryMarker(page, "touchdown");
  await ui.storyPanel(page, "touchdown").waitFor({ timeout: 5000 }); // the panel renders after the click; under load the first read came back empty (T-071)
  assert.deepEqual(await openPanelIds(page), ["touchdown"]);
  assert.equal(await ui.sceneStoryMarkerPressed(page, "touchdown"), true);
  for (const id of eaglePanels.filter((entry) => entry !== "touchdown")) {
    await ui.pressSceneStoryMarker(page, id);
    assert.deepEqual(await openPanelIds(page), [id], `${id} opens from the shared Eagle marker`);
  }
  await ui.pressSceneStoryMarker(page, "touchdown");
  note("scene marker on the named body reopens its panel; a shared marker reaches every panel on it", eaglePanels.join(", "));
  await ui.pressKey(page, "Escape");
  assert.equal((await openPanelIds(page)).length, 0);
  note("Escape closes the panel");

  // Every Apollo panel opens in order as playback reaches it (T-061): start 60 s before each, play, wait for it.
  const ordered = [...apolloPanels].sort((a, b) => apolloTime(a) - apolloTime(b));
  const opened = [];
  for (const panel of ordered) {
    await ui.pausePlayback(page).catch(() => {});
    await seekTo(page, apolloTime(panel) - 20_000);
    await page.waitForTimeout(250);
    await ui.playPlayback(page);
    await ui.storyPanel(page, panel.id).waitFor({ timeout: 15000 });
    opened.push((await openPanelIds(page)).join(","));
    const shown = ui.storyPanel(page);
    assert.equal(await ui.storyPanelBadge(page), panel.badge, `${panel.id} badge`);
    assert.match(await shown.innerText(), new RegExp(panel.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok((await ui.storyPanelSources(page)) >= 1, `${panel.id} has a source line`);
    await ui.openStorySources(page);
    assert.deepEqual(await ui.storyPanelDetailsShown(page), panel.details ?? [], `${panel.id} details show in the opened section`);
    await ui.closeStorySources(page);
    await ui.closeStoryPanel(page);
  }
  assert.deepEqual(opened, ordered.map((panel) => panel.id), "panels opened one at a time, in time order");
  note("every Apollo panel opens in order on playback", opened.join(" > "));

  // Settings: live controls in Developer > Display settings.
  await ui.toggleDeveloper(page);
  await ui.storySettings(page).waitFor();
  await ui.dragSlider(page, "story-panel-pause", 0);
  assert.equal(await ui.sliderReadout(page, "story-panel-pause"), "off");
  await seekTo(page, TLI - 60_000);
  if (!(await isPlaying(page))) await ui.playPlayback(page);
  await ui.storyPanel(page, "tli-cutoff").waitFor({ timeout: 10000 });
  assert.equal(await isPlaying(page), true, "pause 0 never holds playback");
  note("pause length 0 opens a panel without pausing");
  // With seven panels the clock soon reaches the next one, which would replace the Developer drawer: hold the clock for the settings checks.
  await ui.pausePlayback(page);

  await ui.dragSlider(page, "story-panel-pause", 2);
  assert.equal(await ui.sliderReadout(page, "story-panel-pause"), "2.0");
  await ui.closeStoryPanel(page);
  await seekTo(page, TLI - 60_000);
  if (!(await isPlaying(page))) await ui.playPlayback(page);
  await ui.storyPanel(page, "tli-cutoff").waitFor({ timeout: 10000 });
  const heldAt = Date.now();
  assert.equal(await isPlaying(page), false);
  await ui.waitUntilPlaying(page, 8000);
  const held = Date.now() - heldAt;
  assert.ok(held >= 1000 && held < 4500, `held about 2 s (measured from when the panel was seen, so a little under), got ${held} ms`);
  note("pause length setting is live", `held ${held} ms for a 2 s setting`);

  assert.equal(await ui.toggleOn(page, "story-auto-open"), true);
  await ui.pressToggle(page, "story-auto-open");
  assert.equal(await ui.toggleOn(page, "story-auto-open"), false);
  await ui.closeStoryPanel(page);
  await seekTo(page, TLI - 60_000);
  await page.waitForTimeout(2500);
  assert.equal((await openPanelIds(page)).length, 0, "auto-open off opens nothing");
  assert.equal(await isPlaying(page), true);
  await ui.openStoryPanel(page, "tli-cutoff");
  await ui.storyPanel(page, "tli-cutoff").waitFor({ timeout: 5000 });
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  note("auto-open off: playback crosses silently, markers still open panels");
  await context.close();

  // ---- Phone ----
  const phone = await open({ width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = phone.page;
  await ui.storyPanel(p, "tli-cutoff").waitFor({ timeout: 15000 });
  const sheet = ui.storyPanel(p);
  await p.waitForTimeout(600); // the sheet slides in; measure it at rest
  const sbox = await sheet.boundingBox();
  // T-081: the sheet rides above the timeline bar (the Play button stays reachable), nearly full width.
  const { bar: phoneBar } = await ui.phoneBoxes(p);
  assert.ok(sbox.y + sbox.height <= phoneBar.top + 0.5 && sbox.width >= 370, "phone sheet sits above the timeline, nearly full width");
  assert.equal(await ui.storyPanelHandleVisible(p), true, "grab handle shows");
  assert.equal(await ui.storySectionCount(p), 1, "phone sheet: one folded section");
  assert.equal(await ui.storySourcesOpen(p), false, "phone sheet: section closed by default");
  await ui.openStorySources(p);
  assert.equal(await ui.storySourcesOpen(p), true, "phone sheet: one tap opens it");
  await ui.closeStorySources(p);
  assert.equal(await ui.storySourcesOpen(p), false, "phone sheet: another tap folds it");
  assert.ok(sbox.height <= 844 / 2 + 1, "sheet is at most half the screen");
  const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(scrollWidth <= 390, `no horizontal scroll, got ${scrollWidth}`);
  note("phone shows a bottom sheet with a handle", `${Math.round(sbox.height)} px tall`);

  const cdp = await phone.context.newCDPSession(p);
  const touch = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 195, y }] });
  const startY = sbox.y + 14;
  await touch("touchStart", startY);
  for (let dy = 20; dy <= 140; dy += 20) await touch("touchMove", startY + dy);
  await touch("touchEnd", startY + 140);
  await p.waitForTimeout(300);
  assert.equal((await openPanelIds(p)).length, 0, "a swipe down dismisses the sheet");
  note("swipe down dismisses the phone sheet");

  // A short drag does not dismiss.
  await ui.openStoryPanel(p, "touchdown", { force: true });
  await ui.storyPanel(p, "touchdown").waitFor();
  const b2 = await ui.storyPanel(p).boundingBox();
  await touch("touchStart", b2.y + 14);
  await touch("touchMove", b2.y + 40);
  await touch("touchEnd", b2.y + 40);
  await p.waitForTimeout(200);
  assert.deepEqual(await openPanelIds(p), ["touchdown"], "a short drag keeps the sheet");
  note("a short drag keeps the sheet open");
  await phone.context.close();

  // Apollo phone shots of two longer panels.
  const apolloPhone = await open({ width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  for (const id of ["ascent-docking", "splashdown"]) {
    await ui.openStoryPanel(apolloPhone.page, id, { force: true });
    await ui.storyPanel(apolloPhone.page, id).waitFor();
    await apolloPhone.page.waitForTimeout(300);
    await ui.closeStoryPanel(apolloPhone.page);
  }
  note("phone sheets for two Apollo panels captured");
  await apolloPhone.context.close();

  }

  if (want("showers")) {
  // ---- Perseids (T-062): the same panel capability, carried by the shower settings file ----
  const per = await (async () => {
    const context = await openContext(browser, { viewport: { width: 1440, height: 900 } });
    const page = await pageIn(context);
    watchErrors(page, errors);
    await page.goto(perseidsUrl);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    return { context, page };
  })();
  const pp = per.page;
  assert.equal(await ui.storyMarkers(pp).count(), perseidsPanels.length, "a Perseids timeline marker per panel");
  const perseidsOpened = [];
  for (const panel of perseidsPanels) {
    await ui.storyPanel(pp, panel.id).waitFor({ timeout: 90000 });
    perseidsOpened.push((await openPanelIds(pp)).join(","));
    const shown = ui.storyPanel(pp);
    assert.equal(await ui.storyPanelBadge(pp), panel.badge, `${panel.id} badge`);
    assert.match(await shown.innerText(), /Sources|Source/i);
    await ui.openStorySources(pp);
    assert.deepEqual(await ui.storyPanelDetailsShown(pp), panel.details ?? [], `${panel.id} details show in the opened section`);
    await ui.closeStorySources(pp);
    await pp.waitForTimeout(600);
  }
  assert.deepEqual(perseidsOpened, perseidsPanels.map((panel) => panel.id), "Perseids panels open in order on playback");
  note("Perseids panels open in order on playback", perseidsOpened.join(" > "));
  await per.context.close();

  const perPhone = await openContext(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pq = await pageIn(perPhone);
  watchErrors(pq, errors);
  await pq.goto(perseidsUrl);
  await pq.waitForSelector("canvas");
  for (const id of ["stream-shape", "earth-crossing"]) {
    await ui.openStoryPanel(pq, id, { force: true });
    await ui.storyPanel(pq, id).waitFor();
    await pq.waitForTimeout(500);
    await ui.closeStoryPanel(pq);
  }
  note("phone sheets for two Perseids panels captured");
  await perPhone.close();

  }

  // ---- T-089: the Geminids, Earth–Moon and Jupiter–Io stories, through the same generic panel path ----
  // Each panel: seek to half a second of playback before it, play, and it must open by itself, in time order, with its badge,
  // a source line, and one folded section, closed by default, that holds its details.
  const openStory = async (experience) => {
    const context = await openContext(browser, { viewport: { width: 1440, height: 900 } });
    const page = await pageIn(context);
    watchErrors(page, errors);
    await page.goto(`${url}?experience=${experience}`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    return { context, page };
  };
  for (const story of moreStories.filter((entry) => want(entry.name === "Jupiter–Io" ? "jupiter" : "showers"))) {
    const { context, page } = await openStory(story.experience);
    assert.equal(await ui.storyMarkers(page).count(), story.panels.length, `${story.name}: a timeline marker per panel`);
    const rate = Number(await ui.speed(page));
    const storyOpened = [];
    for (const panel of story.panels) {
      await ui.ensurePaused(page);
      await seekTo(page, Math.round(story.time(panel) - rate * 500));
      await page.waitForTimeout(250);
      assert.equal((await openPanelIds(page)).includes(panel.id), false, `${panel.id}: a seek does not open it`);
      await ui.playPlayback(page);
      await ui.storyPanel(page, panel.id).waitFor({ timeout: 15000 });
      storyOpened.push((await openPanelIds(page)).join(","));
      assert.equal(await ui.storyPanelBadge(page), panel.badge, `${panel.id} badge`);
      assert.match(await ui.storyPanel(page).innerText(), new RegExp(panel.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.ok((await ui.storyPanelSources(page)) >= 1, `${panel.id} has a source line`);
      assert.equal(await ui.storySectionCount(page), 1, `${panel.id}: one folded section`);
      assert.equal(await ui.storySourcesOpen(page), false, `${panel.id}: the section is closed by default`);
      await ui.openStorySources(page);
      assert.ok((await ui.storyPanelDetails(page)).length >= 1, `${panel.id}: details sit in the folded section`);
      await ui.closeStorySources(page);
      await page.waitForTimeout(600);
      await ui.closeStoryPanel(page);
    }
    assert.deepEqual(storyOpened, story.panels.map((panel) => panel.id), `${story.name} panels open in order on playback`);
    // A timeline marker reopens a panel after playback has passed it.
    await ui.ensurePaused(page);
    await ui.openStoryPanel(page, story.panels[0].id);
    await ui.storyPanel(page, story.panels[0].id).waitFor({ timeout: 5000 });
    assert.deepEqual(await openPanelIds(page), [story.panels[0].id], `${story.name}: a marker reopens its panel`);
    note(`${story.name} panels open in order on playback; a marker reopens one`, storyOpened.join(" > "));
    await context.close();
  }

  // The Geminids' shower-only view (span=activity) keeps the two December panels and leaves out the Phaethon one (1 November 2019, outside the activity window).
  if (want("showers")) {
    const { context, page } = await openStory("showers&shower=geminids&span=activity");
    assert.equal(await ui.storyMarkers(page).count(), 2, "Geminids activity view: two markers");
    assert.equal(await ui.storyMarkers(page, "phaethon").count(), 0, "Geminids activity view: the Phaethon panel is left out");
    note("Geminids activity view keeps the two December panels");
    await context.close();
  }

  assert.deepEqual(errors, [], "zero console errors");
  note("zero console errors");
} catch (error) {
  writeFileSync(`${out}/results.json`, JSON.stringify({ passed: false, results, errors, failure: String(error?.stack ?? error) }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
if (process.exitCode !== 1) writeFileSync(`${out}/results.json`, JSON.stringify({ passed: true, command: "node tools/validate/browser-story-panels.mjs", url, at: new Date().toISOString(), results, errors }, null, 2));
