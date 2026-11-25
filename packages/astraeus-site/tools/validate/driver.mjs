// The one place that knows what Astraeus's interface looks like to a browser check (O-020 T-083).
//
// Every browser script drives the app through these functions: one per user action ("pause", "pick a body", "open a story panel") and one per
// readout ("the time", "the information text"). A script never finds a control itself, so an interface change (a button's label, an icon in place
// of a word, a menu in place of a toggle) is repaired here and nowhere else. `tools/validate/driver-guard.mjs` fails the tests when a script reaches around it.
//
// How elements are found: by accessible name or role, by a stable `data-*` attribute or `data-testid`, and only where a control carries none of those
// (the Events summary, the information panel, a few readout containers) by the structural hook named in one constant below. Never by visible text
// shown in the page body and never by position on screen. Pass logical ids ("focus-columbia", "anchor-labels"), not labels, so a renamed label
// changes the table below and no script.
//
// Rules for scripts are in `docs/BROWSER_CHECKS.md` ("The interface driver").

import assert from "node:assert/strict";

/** Structural hooks used only where a control has no accessible name or data attribute. One place, so one repair. */
const HOOK = {
  infoPanel: ".info-panel",
  infoClose: ".info-panel .info-panel-close",
  provenanceBadge: ".provenance-badge",
  provenanceDetail: ".provenance",
  sourcesSection: ".sources-section",
  menu: "button.bar-menu-button",
  controlsDrawer: ".controls-drawer",
  timelineHandle: "button.drawer-handle-top",
  timelineDrawer: ".timeline-drawer",
  controlsHandle: "button.drawer-handle-bottom",
  eventsDetails: "details.timeline-event-list",
  eventsSummary: "details.timeline-event-list summary",
  eventRows: ".timeline-expanded li button",
  timeLabel: ".timeline-time",
  windowPeak: "button.timeline-window-peak",
  storyPanel: ".story-panel",
  storyMarker: ".timeline-panel-marker",
  developerPanel: ".developer-tools",
  infoToggle: ".object-info-toggle",
  sceneLabels: ".scene-labels",
  anchorLabels: ".anchor-labels",
  switchPanelToggle: "button.switch-panel-toggle",
  switchPanel: ".switch-panel",
};

const squash = (text) => text.replace(/\s+/g, " ");

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Phone drawers (T-081): on a phone the top controls and the timeline's speed slider and events sit in drawers. The functions below that press a
// control inside one call `reveal` first, which opens the drawer that holds it; on a larger screen there are no drawers and `reveal` does nothing.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Whether the page is in the phone layout (the viewer root says so: one decision, areas/screen.ts). */
export const isPhoneLayout = async (page) =>
  (await page.locator(".astraeus-shell").first().getAttribute("data-phone")) === "true";
/** Opens the menu (a phone's drawer, a wide bar's ⋯ drop-down) when the bar has a menu button and the menu is closed. */
export async function openMenu(page) {
  const button = page.locator(HOOK.menu);
  if ((await button.count()) > 0 && (await button.getAttribute("aria-expanded")) !== "true") {
    await button.click();
    await page.locator(`${HOOK.controlsDrawer}[data-open="true"]`).waitFor();
  }
}
/** Closes the menu when it is open: by its handle on a phone, by the menu button on a wide bar. */
export async function closeMenu(page) {
  const button = page.locator(HOOK.menu);
  if ((await button.count()) > 0 && (await button.getAttribute("aria-expanded")) === "true") {
    await ((await isPhoneLayout(page)) ? page.locator(HOOK.controlsHandle) : button).click();
    await page.locator(`${HOOK.controlsDrawer}[data-open="false"]`).waitFor({ state: "attached" });
  }
}
/** Opens the timeline drawer when the layout has one and it is closed. */
export async function openTimelineDrawer(page) {
  const handle = page.locator(HOOK.timelineHandle);
  if ((await handle.count()) > 0 && (await handle.getAttribute("aria-expanded")) !== "true") {
    await handle.click();
    await page.locator(`${HOOK.timelineDrawer}[data-open="true"]`).waitFor();
  }
}
/** Closes the timeline drawer by its handle when it is open. */
export async function closeTimelineDrawer(page) {
  const handle = page.locator(HOOK.timelineHandle);
  if ((await handle.count()) > 0 && (await handle.getAttribute("aria-expanded")) === "true") {
    await handle.click();
    await page.locator(`${HOOK.timelineDrawer}[data-open="false"]`).waitFor({ state: "attached" });
  }
}
/** Waits until no drawer or sheet is still sliding (a control that is about to be hidden still counts as showing while it moves). */
const drawersSettled = (page) =>
  page.waitForFunction(
    (hooks) =>
      [...document.querySelectorAll(hooks)].every((element) =>
        element.getAnimations().every((animation) => animation.playState !== "running"),
      ),
    `${HOOK.controlsDrawer}, ${HOOK.timelineDrawer}, .info-panel, ${HOOK.storyPanel}`,
  );
/** Makes the control a locator names reachable: opens the menu (the bar puts what does not fit there, on a wide screen too), then the timeline drawer, until it shows. Returns the locator. */
async function reveal(page, locator) {
  await drawersSettled(page);
  if (await locator.first().isVisible()) return locator;
  // Wait for each drawer to finish sliding after opening it, so a size or position read afterwards is the settled one (a busy machine
  // used to measure the scale ⓘ mid-slide, smaller than 44 px).
  await openMenu(page);
  await drawersSettled(page);
  if (await locator.first().isVisible()) return locator;
  await openTimelineDrawer(page);
  await drawersSettled(page);
  return locator;
}
/**
 * Reveals the control (opening the menu that holds it when it is hidden, as on a phone), runs `act` on it, then puts the menu back as it was:
 * closed again when it was closed (I-184: a read must not leave the menu open; a press marked `data-closes-drawer` has usually closed it already).
 */
export async function withRevealed(page, locator, act) {
  const menuWasOpen = (await drawerStates(page)).controls;
  await reveal(page, locator);
  const result = await act(locator);
  if (!menuWasOpen) {
    await drawersSettled(page);
    await closeMenu(page);
  }
  return result;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The shell as a whole
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Waits until the timeline controls (so the shell) are on the page. */
export const waitForShell = (page, options) => page.getByRole("region", { name: "Timeline controls" }).waitFor(options);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Time, playback, speed
// ---------------------------------------------------------------------------------------------------------------------------------------------

const seekSlider = (page) => page.getByLabel("Seek timeline", { exact: true });

/** The timeline's first and last instants, in UTC milliseconds. */
export async function seekRange(page) {
  const slider = seekSlider(page);
  return { min: Number(await slider.getAttribute("min")), max: Number(await slider.getAttribute("max")) };
}

/** Moves the clock to a UTC instant (milliseconds) through the seek slider. */
export const seekTo = (page, timeUtcMs) =>
  seekSlider(page).evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);

/** Seeks to a fraction (0 to 1) of the timeline with the slider focused, firing the input and change events a keyboard user's move would. */
export async function seekToFraction(page, fraction) {
  await seekSlider(page).focus();
  await seekSlider(page).evaluate((input, f) => {
    const min = Number(input.min),
      max = Number(input.max);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(min + (max - min) * f));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, fraction);
}

/**
 * Waits until the scene has caught up after a seek (I-123): the clock label shows the seeked instant (when `timeUtcMs` is given), the scene reports at least one body, and every id in `ids` is
 * a drawn sphere or marker (never "none"). It polls the scene's own readouts, so a slow data load is waited out instead of guessed at with a sleep. Fails with what it last saw.
 */
export async function waitForSceneReady(page, { timeUtcMs, ids = [], timeout = 60000 } = {}) {
  const started = Date.now();
  let seen = "nothing read";
  while (Date.now() - started < timeout) {
    const clock = Date.parse((await clockIso(page)) ?? "");
    const bodies = await sceneBodies(page);
    const missing = ids.filter((id) => !bodies.some((body) => body.id === id && body.as !== "none"));
    const clockOk = timeUtcMs === undefined || clock === timeUtcMs;
    if (clockOk && bodies.length > 0 && missing.length === 0) return bodies;
    seen = `clock ${Number.isNaN(clock) ? "unreadable" : new Date(clock).toISOString()}${clockOk ? "" : ` (wanted ${new Date(timeUtcMs).toISOString()})`}, ${bodies.length} bodies, missing [${missing.join(", ")}]`;
    await page.waitForTimeout(250);
  }
  throw new Error(`the scene was not ready after ${timeout} ms: ${seen}`);
}
/** Seeks to a UTC instant and waits for the scene to be ready there (see waitForSceneReady). */
export async function seekToReady(page, timeUtcMs, options = {}) {
  await seekTo(page, timeUtcMs);
  const settled = Number(await seekSlider(page).inputValue()); // the slider snaps the instant to its step and range; the clock must show what it settled on
  return waitForSceneReady(page, { ...options, timeUtcMs: settled });
}

/** The clock's machine-readable instant (ISO). */
export const clockIso = (page) => page.locator(HOOK.timeLabel).getAttribute("datetime");
/** The clock as UTC milliseconds. */
export const clockMs = async (page) => Date.parse(await clockIso(page));

const pauseButton = (page) => page.getByRole("button", { name: "Pause playback", exact: true });
const playButton = (page) => page.getByRole("button", { name: "Play playback", exact: true });

/** Pauses the clock when it is playing; does nothing when it is already paused. */
export async function ensurePaused(page) {
  if (await pauseButton(page).count()) await pauseButton(page).click();
}
/** Starts the clock when it is paused. */
export async function ensurePlaying(page) {
  if (await playButton(page).count()) await playButton(page).click();
}
/** Waits until the clock is running. */
export const waitUntilPlaying = (page, timeout) => pauseButton(page).waitFor({ timeout });

/** Chooses the fastest playback rate the picker offers; returns its value. */
export async function setFastestSpeed(page) {
  const picker = page.getByLabel("Playback speed");
  const last = await picker.evaluate((select) => select.options[select.options.length - 1].value);
  await picker.selectOption(last);
  return last;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Events and windows
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Opens or closes the Events list. */
export async function toggleEventList(page) {
  if (await isPhoneLayout(page)) await page.locator(HOOK.timelineHandle).click();
  else await page.locator(HOOK.eventsSummary).click();
}
export const eventListOpen = async (page) =>
  (await isPhoneLayout(page))
    ? (await page.locator(HOOK.timelineHandle).getAttribute("aria-expanded")) === "true"
    : page.locator(HOOK.eventsDetails).evaluate((element) => element.open);
export async function openEventList(page) {
  if (!(await eventListOpen(page))) await toggleEventList(page);
}
export async function closeEventList(page) {
  if (await eventListOpen(page)) await toggleEventList(page);
}
/** The Events list's rows as `{label, utc}` (the list needs to be rendered, open or not). */
export const eventRows = (page) =>
  page.locator(HOOK.eventRows).evaluateAll((buttons) =>
    buttons.map((button) => ({
      label: button.querySelector("span")?.textContent?.trim() ?? "",
      utc: button.querySelector("time")?.getAttribute("datetime") ?? "",
    })),
  );
/** The Events rows as plain text, one per row. */
export const eventRowTexts = (page) => page.locator(HOOK.eventRows).allTextContents();
export const eventRowCount = (page) => page.locator(HOOK.eventRows).count();
/** Waits until the clock reads a UTC instant (any parseable form). */
export const waitForClock = (page, target, timeout = 5000) =>
  page.waitForFunction(
    (wanted) =>
      Date.parse(document.querySelector(".timeline-time")?.getAttribute("datetime") ?? "") === Date.parse(wanted),
    target,
    { timeout },
  );

/** The activity window's peak marker (a button on the timeline line). */
export const windowPeak = (page) => page.locator(HOOK.windowPeak);
// ---------------------------------------------------------------------------------------------------------------------------------------------
// Bodies, information, camera
// ---------------------------------------------------------------------------------------------------------------------------------------------

const bodyPicker = (page) => page.getByLabel("Select object");
const revealedBodyPicker = async (page) => reveal(page, bodyPicker(page));

/** Picks a body (or other object) in the Object list by its id. */
export const pickBody = async (page, id) => (await revealedBodyPicker(page)).selectOption(id);
/** The id of the picked object. */
export const pickedBody = (page) => bodyPicker(page).inputValue();
/** The ids the Object list holds, in order. */
export const bodyOptions = (page) =>
  bodyPicker(page).evaluate((select) => [...select.options].map((option) => option.value));
/** The Object list's entries, with their labels and whether each can be picked now. */
export const bodyOptionDetails = (page) =>
  bodyPicker(page).evaluate((select) =>
    [...select.options].map((option) => ({
      value: option.value,
      label: option.textContent.trim(),
      disabled: option.disabled,
    })),
  );
/** The Object list's entries that can be picked now: `{value, text}` each. */
export const pickableBodies = (page) =>
  bodyPicker(page).evaluate((element) =>
    [...element.options]
      .filter((option) => !option.disabled)
      .map((option) => ({ value: option.value, text: option.textContent.trim() })),
  );

/** The information panel, for reading (text, counts). */
export const infoPanel = (page) => page.locator(HOOK.infoPanel);
export const infoOpen = async (page) => (await page.locator(HOOK.infoPanel).count()) > 0;
export const waitForInfo = (page, options) => page.locator(HOOK.infoPanel).waitFor(options);
/** The information panel's text with white space squeezed. */
export const infoText = async (page) => squash(await page.locator(HOOK.infoPanel).innerText());
/** Presses the info toggle beside the Object list. */
export const toggleInfo = async (page) => (await reveal(page, page.locator(HOOK.infoToggle))).click();
/** Closes the information panel when it is open. */
export async function closeInfo(page) {
  if (await infoOpen(page)) await page.locator(HOOK.infoClose).click();
}
/** Closes it when open, giving up quietly after 5 s. */
export async function closeInfoQuietly(page) {
  if (await infoOpen(page))
    await page
      .locator(HOOK.infoClose)
      .click({ timeout: 5000 })
      .catch(() => undefined);
}
/** Closes it; fails when it is not open. */
export async function closeInfoStrict(page) {
  const close = page.locator(HOOK.infoClose);
  // With the developer panel open and every group expanded (the driver does that), its box can cover the sheet's Close; then press it from inside the page.
  try {
    await close.click({ timeout: 3000 });
  } catch (error) {
    if (!/intercepts pointer events/.test(String(error?.message))) throw error;
    await close.evaluate((element) => element.click());
  }
}
/** The provenance badge (a locator, for reading), pressing it, and the detail it opens. */
export const provenanceBadge = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.provenanceBadge}`);
/** The Sources section of the open information panel (a locator), whether it is open, opening and closing it (O-020 Decision 4: closed by default). */
export const sourcesSection = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.sourcesSection}`);
export const provenanceDetail = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.provenanceDetail}`);

/** Chooses a camera by its preset id (for example "overview", "focus-columbia", "follow-moon", "focus-swift-tuttle"). */
export const chooseCamera = async (page, presetId) =>
  (await reveal(page, page.locator(`[data-camera-preset="${presetId}"]`))).click();
/** Whether a camera preset is offered. */
export const cameraOffered = async (page, presetId) =>
  (await page.locator(`[data-camera-preset="${presetId}"]`).count()) > 0;
/** Whether a camera preset is the one in force. */
export const cameraActive = async (page, presetId) =>
  (await page.locator(`[data-camera-preset="${presetId}"]`).getAttribute("aria-pressed")) === "true";

/** Resizes the page's viewport (a script's one way to test a second screen size on a loaded page); waits for the layout to settle. */
export async function resizeViewport(page, size) {
  await page.setViewportSize(size);
  await page.waitForTimeout(600);
}
/** The timeline's gathered marker groups (O-050 T-214): { label, expanded, count, box } for each numbered mark, where count is the number the mark shows. */
export const markerGroups = (page) =>
  page.locator(".timeline-marker-group").evaluateAll((groups) =>
    groups.map((group) => {
      const toggle = group.querySelector(".timeline-group-toggle");
      const box = toggle.getBoundingClientRect();
      return {
        label: toggle.getAttribute("aria-label"),
        expanded: toggle.getAttribute("aria-expanded") === "true",
        count: Number(toggle.textContent),
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    }),
  );
/** Presses a marker group's numbered mark by its position among the groups (opens or closes its list). */
export const pressMarkerGroup = async (page, index) =>
  (await reveal(page, page.locator(".timeline-group-toggle"))).nth(index).click();
/** The open marker group's list: its box and, for each item, { label, timeUtcMs, box } (all in page pixels), plus the viewport size. Null when no list is open. */
export const markerGroupList = (page) =>
  page.evaluate(() => {
    const list = document.querySelector(".timeline-group-list");
    if (list === null) return null;
    const rect = (element) => {
      const b = element.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    return {
      box: rect(list),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      items: [...list.querySelectorAll(".timeline-group-item")].map((item) => ({
        label: item.getAttribute("aria-label"),
        timeUtcMs: Number(item.dataset.timeUtcMs),
        box: rect(item),
      })),
    };
  });
/** Presses one item of the open marker group's list by its aria-label. */
export const pressMarkerGroupItem = (page, label) =>
  page.locator(`.timeline-group-item[aria-label="${label}"]`).click();

export const shownSceneLabelIds = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId),
  );

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The developer drawer
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The developer panel's own folds only (never the moons panel's, which share the fold control). */
const devFolds = (page) => page.locator("[data-developer-panel] [data-fold-toggle]");
const developerButton = (page) => page.getByRole("button", { name: "Developer mode" });

/**
 * Opens every fold in the developer panel, nested ones included (T-090: the panel's groups start closed except the first, and remember how a viewer
 * left them). Scripts reach a control by name; the driver opens the groups first so no script has to know the panel's layout.
 */
export async function expandDeveloperGroups(page) {
  await devFolds(page).first().waitFor({ timeout: 10000 });
  // I-165: finding a closed fold and pressing it is one step inside the page. Counting first and then re-resolving a locator for the click waited 30 s when the panel re-rendered between the two (the fold was gone).
  for (let guard = 0; guard < 30; guard++) {
    const pressed = await page.evaluate(() => {
      const fold = document.querySelector('[data-developer-panel] [data-fold-toggle][aria-expanded="false"]');
      if (fold === null) return false;
      fold.click();
      return true;
    });
    if (!pressed) break;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))); // let the panel draw the opened fold before looking again
  }
}
/** Opens or closes the developer drawer; an opened drawer has all its groups opened. */
export async function toggleDeveloper(page, { expand = true } = {}) {
  // On a phone the cog sits in the menu drawer, hidden while it is closed (I-184): reveal it, press it, and leave the menu as it was.
  await withRevealed(page, developerButton(page), (button) => button.click());
  if (await developerOpen(page)) {
    if (expand) await expandDeveloperGroups(page);
    else await devFolds(page).first().waitFor({ timeout: 10000 });
  }
}
/** Whether the developer drawer is open, read from the cog's pressed state; the cog is revealed first (the phone menu) and the menu restored after. */
export const developerOpen = async (page) =>
  withRevealed(page, developerButton(page), async (button) => (await button.getAttribute("aria-pressed")) === "true");
export const developerPanel = (page) => page.locator(HOOK.developerPanel);

/** A drawer toggle by its logical id: pressing, reading, waiting. */
const TOGGLES = {
  "anchor-labels": "Anchor labels",
  "milky-way-picture": "Milky Way picture",
  "story-auto-open": "Open panels automatically",
  "sun-label": "Sun label",
  "mission-window": "Mission window",
  ecliptic: "Planets' plane (ecliptic)",
  equatorial: "Earth's pole (equatorial)",
  "orbit-ring": "Orbit ring",
  "orbit-ring-fade": "Fade ring ends",
  "orbit-arc": "Trailing arc",
  "orbit-zoom-brighten": "Brighten when zoomed out",
  "moon-orbits": "Moon orbits",
};
const toggle = (page, id) => {
  assert.ok(TOGGLES[id], `driver: unknown toggle ${id}`);
  return page.getByRole("button", { name: TOGGLES[id], exact: true });
};

/** A drawer slider by its logical id. */
const SLIDERS = {
  "sun-glow-size": ["Sun glow size", "sun-glow-size-value"],
  "sun-glow-brightness": ["Sun glow brightness", null],
  "sun-glow-reach": ["Sun glow reach", null],
  "star-brightness": ["Star brightness", "star-brightness-value"],
  "milky-way-brightness": ["Milky Way brightness", "milky-way-brightness-value"],
  "story-panel-pause": ["Story panel pause", "story-pause-value"],
  "orbit-ring-opacity": ["Ring opacity", "orbit-base-opacity-value"],
  "orbit-end-fade": ["End fade", "orbit-end-fade-value"],
  "orbit-arc-length": ["Arc length", "orbit-arc-fraction-value"],
  "orbit-arc-opacity": ["Arc opacity", "orbit-arc-peak-value"],
  "orbit-fade-power": ["Fade curve", "orbit-arc-exponent-value"],
  "orbit-arc-segments": ["Arc segments", "orbit-arc-segments-value"],
  "orbit-arc-width": ["Arc width", "orbit-arc-width-value"],
  "orbit-zoom-boost-ring": ["Zoom boost (ring)", "orbit-zoom-boost-base-value"],
  "orbit-zoom-boost-arc": ["Zoom boost (arc)", "orbit-zoom-boost-arc-value"],
  "glow-quiet": ["Timeline quiet brightness", "glow-min-value"],
  "glow-steady": ["Timeline steady brightness", "glow-steady-value"],
  "glow-curve": ["Timeline glow curve", "glow-curve-value"],
  "glow-floor": ["Timeline played floor", "glow-floor-value"],
  "glow-thickness": ["Timeline glow thickness", "glow-thickness-value"],
  "glow-halo": ["Timeline glow halo", "glow-halo-value"],
  "ring-halo-opacity": ["Halo ring: opacity", "ring-halo-opacity"],
  "ring-main-opacity": ["Main ring: opacity", "ring-main-opacity"],
  "ring-amalthea-gossamer-opacity": ["Amalthea gossamer ring: opacity", "ring-amalthea-gossamer-opacity"],
  "ring-thebe-gossamer-opacity": ["Thebe gossamer ring: opacity", "ring-thebe-gossamer-opacity"],
};
const slider = (page, id) => {
  assert.ok(SLIDERS[id], `driver: unknown slider ${id}`);
  return page.getByRole("slider", { name: SLIDERS[id][0] });
};

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Story panels
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The open story panel (or the one with this id), for reading. */
export const storyPanel = (page, id) =>
  id === undefined ? page.locator(HOOK.storyPanel) : page.locator(`${HOOK.storyPanel}[data-panel-id="${id}"]`);
export const waitForStoryPanel = (page, id, options) => storyPanel(page, id).waitFor(options);
export const openStoryPanelIds = (page) =>
  page.locator(HOOK.storyPanel).evaluateAll((els) => els.map((el) => el.dataset.panelId));
export const storyPanelBadge = (page) => page.locator(`${HOOK.storyPanel} .story-badge`).getAttribute("data-badge");
export const storyPanelSources = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} li`).count();
export const storyPanelBox = (page) => page.locator(HOOK.storyPanel).boundingBox();
/** The value of the object list (the selected body or sky figure id). */
export const selectedObjectValue = (page) =>
  page.locator('select[aria-label="Select object"]').evaluate((select) => select.value);
/** Presses a step button of the open story panel: "back" or "next". */
export const pressStoryStep = (page, which) => page.locator(`${HOOK.storyPanel} .story-panel-${which}`).click();
export const storyStepEnabled = (page, which) => page.locator(`${HOOK.storyPanel} .story-panel-${which}`).isEnabled();
/** Whether the story step button is the topmost element at its centre (nothing covers it). */
export const storyStepReachable = (page, which) =>
  page.locator(`${HOOK.storyPanel} .story-panel-${which}`).evaluate((button) => {
    const r = button.getBoundingClientRect();
    const top = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return top === button || button.contains(top);
  });
export const storyStepBox = (page, which) => page.locator(`${HOOK.storyPanel} .story-panel-${which}`).boundingBox();
/** Waits until the open story panel is the one with this id. */
export const waitForOpenStoryPanel = (page, id, timeout = 8000) =>
  page.waitForFunction((want) => document.querySelector(".story-panel")?.dataset.panelId === want, id, { timeout });
/** The timeline's story-panel markers (a locator, for counts and attributes). */
export const storyMarkers = (page, id) =>
  id === undefined ? page.locator(HOOK.storyMarker) : page.locator(`${HOOK.storyMarker}[data-panel-id="${id}"]`);
/** The id of the first story-panel marker on the timeline. */
export async function firstStoryMarkerId(page) {
  if ((await storyMarkers(page).count()) > 0) return storyMarkers(page).first().getAttribute("data-panel-id");
  return (await markerGroupPanelIds(page))[0]?.id; // a panel whose marker sits within 22 px of another gathers under a numbered mark (O-050 T-214): read it from the group lists
}
/** Presses a story panel's marker on the timeline. */
export async function openStoryPanel(page, id, options) {
  if ((await storyMarkers(page, id).count()) > 0) return storyMarkers(page, id).click(options);
  const found = (await markerGroupPanelIds(page)).find((entry) => entry.id === id);
  if (found === undefined) return storyMarkers(page, id).click(options); // not gathered either: fail the way a missing marker always has
  if ((await markerGroupList(page)) === null) await pressMarkerGroup(page, found.group);
  return page.locator(`.timeline-group-item[data-panel-id="${id}"]`).click(options);
}
/** The story panels that sit under gathered marks: [{ id, group }] with group the index of the numbered mark holding it. Opens each list in turn to read it and leaves none open. */
async function markerGroupPanelIds(page) {
  const found = [];
  const groups = await markerGroups(page);
  for (let group = 0; group < groups.length; group += 1) {
    await pressMarkerGroup(page, group);
    const ids = await page
      .locator(".timeline-group-item[data-panel-id]")
      .evaluateAll((items) => items.map((item) => item.getAttribute("data-panel-id")));
    await pressMarkerGroup(page, group);
    for (const id of ids) found.push({ id, group });
  }
  return found;
}
/** Closes the open story panel; fails when none is open. */
export const closeStoryPanel = (page) => page.getByRole("button", { name: "Close story panel" }).click();
export const closeStoryPanelNow = (page) =>
  page.evaluate(() => {
    for (const b of document.querySelectorAll('button[aria-label="Close story panel"]')) b.click();
  });

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The Scale control, as the top bar presents it (a toggle for two scales, a menu for three, nothing at all for one scale) and its ⓘ explanation
// ---------------------------------------------------------------------------------------------------------------------------------------------

const scaleControl = (page) => page.locator(".scale-control");

/** The id of the scale in force (for example "true-scale"). */
export const currentScale = async (page) =>
  (await hasScaleControl(page)) ? scaleControl(page).getAttribute("data-scale-current") : null;
/** Whether the top bar shows a scale control at all (an experience with one scale shows none). */
export const hasScaleControl = async (page) => (await scaleControl(page).count()) > 0;
/** The ids the control offers, in order; empty when there is no control (one scale). */
export const scaleOptions = async (page) =>
  (await hasScaleControl(page)) ? (await scaleControl(page).getAttribute("data-scale-options")).split(",") : [];
/** Loads an address and, when it asks for `scale=<id>`, fails loudly unless the experience offers that scale and it is the one in force (I-036: an unknown or unoffered scale id silently fell back to the default, so a "Readable" case rendered True). */
export async function loadAddress(page, url, options) {
  await page.goto(url, options);
  await page.waitForSelector("canvas");
  const wanted = new URL(url).searchParams.get("scale");
  if (wanted === null) return;
  await assertScaleInUse(page, wanted);
}
/** Throws unless the scale id is offered by the experience and is the one in force. A one-scale experience offers only "true-scale". */
export async function assertScaleInUse(page, scaleId) {
  const offered = (await hasScaleControl(page)) ? await scaleOptions(page) : ["true-scale"];
  if (!offered.includes(scaleId))
    throw new Error(
      `driver: the experience does not offer scale "${scaleId}" (it offers ${offered.join(", ")}); the address would fall back silently`,
    );
  const now = (await hasScaleControl(page)) ? await currentScale(page) : "true-scale";
  if (now !== scaleId) throw new Error(`driver: asked for scale "${scaleId}" but "${now}" is in force`);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Scene readouts the driver does not hide: the canvas and its data attributes are read directly by scripts.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The scene canvas (pictures and its `data-*` readouts). */
export const sceneCanvas = (page) => page.getByTestId("earth-moon-canvas");
/**
 * Each drawn path line as the scene reports it (`data-paths`, I-040): { id, visible, vertices, inView, spanX, spanY }, where inView counts the vertices in front of the camera and
 * inside the view and spanX/spanY are the share of the view (0 to 1) they cover. It describes the line, never its label, so "the orbit is drawn" is asserted from this and not from colour.
 */
export async function scenePaths(page) {
  return JSON.parse((await page.locator("canvas").first().getAttribute("data-paths")) ?? "[]");
}
/** One path's readout by id (for example `earth-orbit`, `1p-orbit`), or undefined when the scene draws no such path. */
export async function scenePath(page, id) {
  return (await scenePaths(page)).find((path) => path.id === id);
}
/**
 * Each point group as the scene reports it (`data-points`, T-102): { id, drawn, members, inView, spanX, spanY }, where drawn means inside its time bounds and shown, inView is the number of
 * members in front of the camera and inside the view (an even sample scaled up), and spanX/spanY are the share of the view they cover. It describes the dots, never a picture of them.
 */
export async function scenePoints(page) {
  return JSON.parse((await page.locator("canvas").first().getAttribute("data-points")) ?? "[]");
}
/** One point group's readout by id, or undefined when the scene has no such group. */
export async function scenePointGroup(page, id) {
  return (await scenePoints(page)).find((group) => group.id === id);
}
/** The dots drawn in view across every group: the sum of `inView` over the groups that are drawn. */
export async function sceneDotsInView(page) {
  return (await scenePoints(page)).reduce((sum, group) => sum + (group.drawn ? group.inView : 0), 0);
}
/**
 * Each body as the scene reports it (`data-body-screen`, T-102): { id, as: "sphere" | "marker" | "none", radiusPx, x, y, inView }, with x and y the centre as shares of the view (0 to 1, y down)
 * and radiusPx the drawn sphere's radius in pixels (the size the marker rule judges).
 */
export async function sceneBodies(page) {
  return JSON.parse((await page.locator("canvas").first().getAttribute("data-body-screen")) ?? "[]");
}
/** One body's readout by id, or undefined when the scene does not draw it. */
export async function sceneBody(page, id) {
  return (await sceneBodies(page)).find((body) => body.id === id);
}
/**
 * Each Sun-centred orbit line's distance to its own body (`data-orbit-line-gap`, T-446), in pixels: { "earth-orbit": 0.4, ... }, from the body's drawn centre to the nearest drawn segment of the line, null when no segment is in front of the camera.
 * The scene reports it as a share of the view's height; this multiplies by the canvas height.
 */
export async function orbitLineGapsPx(page) {
  return page
    .locator("canvas")
    .first()
    .evaluate((canvas) => {
      const shares = JSON.parse(canvas.getAttribute("data-orbit-line-gap") ?? "{}");
      return Object.fromEntries(
        Object.entries(shares).map(([id, share]) => [id, share === null ? null : share * canvas.clientHeight]),
      );
    });
}
/** The sky as the scene reports it: star count, the star and Milky Way brightness in force, and whether the picture is on and shown. Stars is 0 when the scene has no sky. */
export async function sceneSky(page) {
  const data = await page
    .locator("canvas")
    .first()
    .evaluate((canvas) => ({ ...canvas.dataset }));
  return {
    stars: Number(data.skyStars ?? 0),
    starBrightness: data.skyStarBrightness === undefined ? null : Number(data.skyStarBrightness),
    milkyWayBrightness: data.skyMilkyWayBrightness === undefined ? null : Number(data.skyMilkyWayBrightness),
    picture: data.skyPicture === "on",
    pictureShown: data.skyPictureShown === "true",
  };
}
/** Whether the scene draws anything: some body as a sphere or marker in view, point group members in view, a path line in view, or the sky's stars. The readout form of "the canvas is not blank". */
export async function sceneDrawsSomething(page) {
  const bodies = (await sceneBodies(page)).filter((body) => body.as !== "none" && body.inView).length;
  return {
    bodies,
    dots: await sceneDotsInView(page),
    paths: (await scenePaths(page)).filter((path) => path.visible && path.inView > 0).length,
    stars: (await sceneSky(page)).stars,
  };
}
/**
 * Where `freeCanvasPoint` looks, in order: the middle first, then around it, then the upper band. On a phone an open card or story sheet is meant to fill
 * up to half the viewer above the timeline (the sheet cap, --sheet-max), so the free scene there is the band under the bar (I-185).
 */
export const FREE_POINT_PROBES = [
  [0.5, 0.5],
  [0.5, 0.4],
  [0.4, 0.5],
  [0.6, 0.5],
  [0.5, 0.6],
  [0.3, 0.3],
  [0.7, 0.3],
  [0.3, 0.6],
  [0.5, 0.2],
  [0.3, 0.2],
  [0.7, 0.2],
  [0.5, 0.15],
];
/** A point on the scene canvas where the canvas itself is on top (no story marker, label or panel over it), the middle first: where a wheel or drag reaches the camera. Null when nothing is free. */
export async function freeCanvasPoint(page) {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  for (const [fx, fy] of FREE_POINT_PROBES) {
    const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
    if (await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS", point)) return point;
  }
  return null;
}
/** How many frames the scene has drawn since it mounted (`data-frames-drawn`, O-031 T-149); 0 before the first. A paused, untouched scene stops counting. */
export async function framesDrawn(page) {
  return Number((await page.locator("canvas").first().getAttribute("data-frames-drawn")) ?? 0);
}
/** Waits until the frames-drawn count has not moved for `quietMs`; returns it. Throws if the scene is still drawing after `timeout`. Pause first: a playing scene never stops. */
export async function waitUntilSceneIdle(page, { quietMs = 1500, timeout = 10000 } = {}) {
  const deadline = Date.now() + timeout;
  let last = await framesDrawn(page);
  let since = Date.now();
  while (Date.now() < deadline) {
    await page.waitForTimeout(250);
    const now = await framesDrawn(page);
    if (now !== last) {
      last = now;
      since = Date.now();
    } else if (Date.now() - since >= quietMs) return last;
  }
  throw new Error(`the scene kept drawing for ${timeout} ms while paused and untouched (frames drawn: ${last})`);
}
/** Waits until the scene has drawn at least `count` more frames than `before`; returns the new count. Throws after `timeout`. */
export async function waitForMoreFrames(page, before, count = 3, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const now = await framesDrawn(page);
    if (now >= before + count) return now;
    await page.waitForTimeout(100);
  }
  throw new Error(
    `the scene drew fewer than ${count} frames in ${timeout} ms (frames drawn: ${await framesDrawn(page)}, was ${before})`,
  );
}
/**
 * Polls `read()` about every 100 ms until `done(value)` is true and returns that value; throws after `timeout` ms naming `what` never became true and the last value read (O-086 T-391).
 * This replaces a fixed sleep before an assertion: the step moves on as soon as the page shows what the assertion reads, and fails clearly when it never does.
 */
export async function waitUntil(page, read, done, { timeout = 10000, what = "the condition" } = {}) {
  const deadline = Date.now() + timeout;
  let value = await read();
  while (!done(value)) {
    if (Date.now() >= deadline)
      throw new Error(`${what} never became true in ${timeout} ms (last read: ${JSON.stringify(value)})`);
    await page.waitForTimeout(100);
    value = await read();
  }
  return value;
}
/**
 * Waits until `read()` gives the same value (compared as JSON) on `reads` polls in a row, `every` ms apart, and returns it (O-060 T-281). This stands in for a fixed sleep that waited for the scene to
 * stop moving: a camera easing to a body, or the clock catching up after a jump. It never fails by itself: when the value is still changing at `timeout` it returns the last one, and the caller's own
 * assertion on that value decides, exactly as it did after the fixed sleep.
 */
export async function waitUntilStable(page, read, { every = 100, reads = 3, timeout = 10000 } = {}) {
  const deadline = Date.now() + timeout;
  let value = JSON.stringify(await read());
  let same = 1;
  while (same < reads && Date.now() < deadline) {
    await page.waitForTimeout(every);
    const next = JSON.stringify(await read());
    same = next === value ? same + 1 : 1;
    value = next;
  }
  return value === undefined ? undefined : JSON.parse(value);
}
const round = (n, places) => (typeof n === "number" ? Math.round(n * 10 ** places) / 10 ** places : n);
/** Waits until the picked body `id` has stopped moving or growing on screen (centre to 0.001 of the view, radius to 0.1 px): the camera has finished easing to it or zooming on it. Returns its readout. */
export function waitForBodySettled(page, id, options = {}) {
  return waitUntilStable(
    page,
    async () => {
      const body = await sceneBody(page, id);
      return body === undefined
        ? null
        : {
            as: body.as,
            x: round(body.x, 3),
            y: round(body.y, 3),
            radiusPx: round(body.radiusPx, 1),
            inView: body.inView,
          };
    },
    options,
  );
}
/** Waits until path `id`'s drawn line has stopped moving on screen (its box to 0.001 of the view): the camera has caught up after a jump. Returns the readout. */
export function waitForPathSettled(page, id, options = {}) {
  return waitUntilStable(
    page,
    async () => {
      const path = await scenePath(page, id);
      return path === undefined
        ? null
        : {
            visible: path.visible,
            inView: path.inView,
            box: [
              path.lineMinX,
              path.lineMaxX,
              path.lineMinY,
              path.lineMaxY,
              path.minX,
              path.maxX,
              path.minY,
              path.maxY,
            ].map((n) => round(n, 3)),
          };
    },
    options,
  );
}
/** Waits until the clock has stopped moving (a seek or a press that sets it has landed); returns it as UTC milliseconds. */
export function waitForClockSettled(page, options = {}) {
  return waitUntilStable(page, () => clockMs(page), { reads: 2, ...options });
}
/** A wheel turn over the scene, where the canvas itself is on top: moves the camera, so a resting scene draws again. Returns false when no free point exists. */
export async function nudgeCamera(page) {
  const point = await freeCanvasPoint(page);
  if (point === null) return false;
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, 120);
  return true;
}
/**
 * Wheel turns of `deltaY` at `point`, at most `turns`, stopping once the camera has stopped taking them (O-060 T-281): `read()` is the scene readout the zoom changes, and when it gives the same value
 * on `same` turns in a row the camera has reached its zoom limit, so further turns could not change what is asserted afterwards. This replaces 60 turns each followed by a fixed 30 to 40 ms pause,
 * most of which were turns at the limit. The caller then waits for the scene to settle (`waitForBodySettled`, `waitForPathSettled`) and asserts. Returns the turns made.
 */
export async function wheelUntilSettled(page, point, deltaY, read, { turns = 60, same = 3 } = {}) {
  await page.mouse.move(point.x, point.y);
  let last = JSON.stringify(await read());
  let still = 0;
  let made = 0;
  while (made < turns && still < same) {
    await page.mouse.wheel(0, deltaY);
    made += 1;
    const now = JSON.stringify(await read());
    still = now === last ? still + 1 : 0;
    last = now;
  }
  return made;
}
/** The readout a zoom on body `id` changes: where it is on screen and how big, to the finest figure the scene reports. */
export const bodyZoomReadout = (page, id) => async () => {
  const body = await sceneBody(page, id);
  return body === undefined
    ? null
    : [body.as, body.inView, round(body.x, 6), round(body.y, 6), round(body.radiusPx, 6)];
};
/** The readout a zoom on path `id` changes: how many of its vertices are in view and the box they cover. */
export const pathZoomReadout = (page, id) => async () => {
  const path = await scenePath(page, id);
  return path === undefined ? null : [path.visible, path.inView, round(path.spanX, 6), round(path.spanY, 6)];
};
/** Zooms the camera out on path `id` as far as it goes (the camera clamps at its farthest zoom-out). Returns false when no free point exists. The caller waits for the scene to settle (`waitForPathSettled`). */
export async function zoomOutFully(page, id, { turns = 60 } = {}) {
  const point = await freeCanvasPoint(page);
  if (point === null) return false;
  await wheelUntilSettled(page, point, 600, pathZoomReadout(page, id), { turns });
  return true;
}
/** A tap (click) on the scene where the canvas itself is on top: goes through the pointer listeners, so a resting scene draws again (O-031 I-073). Returns false when no free point exists. */
export async function tapCanvas(page) {
  const point = await freeCanvasPoint(page);
  if (point === null) return false;
  await page.mouse.move(point.x, point.y);
  await page.mouse.click(point.x, point.y);
  return true;
}
export const anchorLabelCount = (page) => page.locator(`${HOOK.anchorLabels} .anchor-label`).count();
/** How many body-name labels the scene shows now (labels switched off or out of range are hidden). */
export const visibleSceneLabelCount = (page) =>
  page.locator(`${HOOK.sceneLabels} .scene-object-label:not([hidden])`).count();

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The phone layout and the shared control look (T-081, O-020)
// ---------------------------------------------------------------------------------------------------------------------------------------------

export async function drawerStates(page) {
  const open = async (hook) =>
    (await page.locator(hook).count()) > 0 && (await page.locator(hook).getAttribute("aria-expanded")) === "true";
  return { controls: await open(HOOK.menu), timeline: await open(HOOK.timelineHandle) };
}
/** The name in the bar's title place (the picked object's name until About lands), or null when the bar has no title place (a wide screen). */
export async function barTitleName(page) {
  const title = page.locator("[data-bar-title] .bar-sr");
  return (await title.count()) > 0 ? (await title.innerText()).trim() : null;
}
/** Whether the host picker's switch shows on the bar's row itself (no menu opened): the phone's one row holds the switch as tabs. */
export const switchInBarRow = (page) => page.locator(".top-bar [data-switch-param]").first().isVisible();

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The experience switch (O-024 T-091): a group of buttons in the top bar (the phone drawer) that opens another version of the experience
// ---------------------------------------------------------------------------------------------------------------------------------------------

const experienceSwitch = (page) => page.locator("[data-switch-param]");
/** Whether the experience offers a switch. */
export const hasExperienceSwitch = async (page) => (await experienceSwitch(page).count()) > 0;
/** The switch's accessible name, its address parameter and its options (value, label, active). Null when there is no switch. */
export async function experienceSwitchState(page) {
  if (!(await hasExperienceSwitch(page))) return null;
  await reveal(page, experienceSwitch(page));
  return experienceSwitch(page).evaluate(readSwitchGroup);
}
/**
 * Reads a switch element in either of its forms (I-184): the buttons (`[data-switch-value]`, pressed = active) or the fit rule's compact native
 * `<select>` (its options, selected = active). Runs inside the page; self-contained so it can be handed to `evaluate`.
 */
export function readSwitchGroup(group) {
  const compact = group.tagName === "SELECT";
  const options = compact
    ? [...group.options].map((option) => ({
        value: option.value,
        label: option.textContent.trim(),
        active: option.selected,
      }))
    : [...group.querySelectorAll("[data-switch-value]")].map((button) => ({
        value: button.getAttribute("data-switch-value"),
        label: button.textContent.trim(),
        active: button.getAttribute("aria-pressed") === "true",
      }));
  return { name: group.getAttribute("aria-label"), param: group.getAttribute("data-switch-param"), compact, options };
}
/** Whether the switch element shows `value` as its active option, in either form (the page-side test `chooseSwitchOption` waits on). */
export function switchShowsActive(value) {
  const group = document.querySelector("[data-switch-param]");
  if (group === null) return false;
  return group.tagName === "SELECT"
    ? group.value === value
    : group.querySelector(`[data-switch-value="${value}"][aria-pressed="true"]`) !== null;
}
/** Presses a switch option by its value (a button, or the compact select's option) and waits for the experience to open again (the address changes, the new option is the active one, the shell is there). The page is switched in place, not reloaded. */
export async function chooseSwitchOption(page, value) {
  const group = experienceSwitch(page);
  const param = await group.getAttribute("data-switch-param");
  await reveal(page, group);
  const compact = await group.first().evaluate((element) => element.tagName === "SELECT");
  const choose = compact
    ? () => group.first().selectOption(value)
    : () => group.locator(`[data-switch-value="${value}"]`).first().click();
  await Promise.all([page.waitForURL((address) => new URL(address).searchParams.get(param) === value), choose()]);
  await page.waitForFunction(switchShowsActive, value);
  await page.waitForSelector("canvas");
  await waitForShell(page);
}
/** Sets a marker on the page's window; it survives a switch made in place and is gone after a reload. */
export const markPage = (page) =>
  page.evaluate(() => {
    window.__pageKept = true;
  });
/** Whether the marker set by `markPage` is still there (the page was not reloaded). */
export const pageWasKept = (page) => page.evaluate(() => window.__pageKept === true);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Tap or click an object in the scene to focus on it (O-022 T-109): the pointer actions and the scene's pick readouts.
// A touch page (a context made with `hasTouch`) sends real touch events through the DevTools protocol, so the app sees pointerType "touch";
// any other page sends the mouse. Positions given to these functions are CSS px from the canvas's top left unless the name says "page".
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** "touch" on a page made with touch support, otherwise "mouse". */
export const scenePointer = async (page) =>
  (await page.evaluate(() => navigator.maxTouchPoints > 0)) ? "touch" : "mouse";
const sceneBox = (page) => page.locator("canvas").first().boundingBox();

/** One or more fingers moving in a straight line each (`paths`: `{from, to}` in page px), with real touch events. A path with from equal to to is a tap. */
async function touchGesture(page, paths, steps = 8) {
  const client = await page.context().newCDPSession(page);
  const at = (i) =>
    paths.map((p, n) => {
      const f = steps === 0 ? 0 : i / steps;
      return { x: p.from.x + (p.to.x - p.from.x) * f, y: p.from.y + (p.to.y - p.from.y) * f, id: n + 1 };
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) });
  for (let i = 1; i <= steps; i += 1)
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i) });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
/** A tap (touch) or click (mouse) at a point of the page. */
async function tapPagePoint(page, x, y) {
  if ((await scenePointer(page)) === "touch") await touchGesture(page, [{ from: { x, y }, to: { x, y } }], 0);
  else {
    await page.mouse.move(x, y);
    await page.mouse.click(x, y);
  }
  await page.waitForTimeout(150);
}
/** Reads a point until it stops moving (the camera is still flying after a tap), then returns it. */
async function settledPoint(read) {
  let last = await read();
  for (let i = 0; i < 40; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const now = await read();
    if (last !== null && now !== null && Math.hypot(now.x - last.x, now.y - last.y) < 0.5) return now;
    last = now;
  }
  return last;
}

/** Waits until the Object list holds this id (a tap flew to it and the picker shows it). */
export const waitForPicked = (page, id, timeout = 8000) =>
  page.waitForFunction((wanted) => document.querySelector('select[aria-label="Select object"]')?.value === wanted, id, {
    timeout,
  });

/** Taps a shown name tag at its centre. Throws unless the tag is showing and the canvas is under that point. */
export async function tapLabel(page, id) {
  const read = () =>
    page.locator(`[data-label-id="${id}"]`).evaluate((element) => {
      if (element.hidden) return null;
      const r = element.getBoundingClientRect();
      return r.width === 0 ? null : { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    });
  const point = await settledPoint(read);
  if (point === null) throw new Error(`driver: ${id}'s name tag is not showing to tap`);
  await tapPagePoint(page, point.x, point.y);
  return point;
}
/** The page point of a name tag's centre, or null when it is not showing (a turned camera moves or hides it). */
export const labelCentre = (page, id) =>
  page.locator(`[data-label-id="${id}"]`).evaluate((element) => {
    if (element.hidden) return null;
    const r = element.getBoundingClientRect();
    return r.width === 0 ? null : { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
  });
/** The page rectangle of a name tag ({ left, top, right, bottom }), or null when it is not showing. */
export const labelBox = (page, id) =>
  page.locator(`[data-label-id="${id}"]`).evaluate((element) => {
    if (element.hidden) return null;
    const r = element.getBoundingClientRect();
    return r.width === 0 ? null : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
/** Presses on a shown name tag's centre and drags `(dx, dy)` page px from there, with the page's own pointer (touch or mouse). Throws unless the tag is showing. Returns where the press began. */
export async function dragFromLabel(page, id, dx, dy) {
  const point = await page.locator(`[data-label-id="${id}"]`).evaluate((element) => {
    if (element.hidden) return null;
    const r = element.getBoundingClientRect();
    return r.width === 0 ? null : { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
  });
  if (point === null) throw new Error(`driver: ${id}'s name tag is not showing to drag from`);
  const to = { x: point.x + dx, y: point.y + dy };
  if ((await scenePointer(page)) === "touch") await touchGesture(page, [{ from: point, to }]);
  else {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForTimeout(150);
  return point;
}
/** Taps a point of the scene in canvas px with the page's own pointer (touch or mouse). */
export async function tapScenePoint(page, x, y) {
  const box = await sceneBox(page);
  await tapPagePoint(page, box.x + x, box.y + y);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The moon panel (O-025 T-099): a planet's moons by family, a sliding panel on a wide screen and a section of the top drawer on a phone.
// ---------------------------------------------------------------------------------------------------------------------------------------------

const MOON_SHEET = ".moons-sheet";
/** The panel itself (a labelled region). */
export const moonPanel = (page) => page.getByRole("region", { name: /'s moons$/ });
/** Opens the moon panel: the moons button (in the bar, or in the menu when it did not fit) opens the sheet in the left place; choosing it closes the menu. */
export async function openMoonPanel(page) {
  const toggle = await reveal(page, page.locator("button.moons-toggle"));
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await page.locator(`${MOON_SHEET}[data-open="true"]`).waitFor();
  await page.waitForFunction(
    (hook) =>
      document
        .querySelector(hook)
        .getAnimations()
        .every((animation) => animation.playState !== "running"),
    MOON_SHEET,
  );
}
/** Taps a moon in the panel (the shell flies to it and opens its information). */
export const chooseMoon = (page, id) => moonPanel(page).locator(`[data-moon="${id}"]:visible`).first().click();
/** Whether the camera is on a body: its Focus button is the pressed camera choice. */
// Read in place, not revealed: on a phone revealing opens the controls drawer, which closes the information sheet the caller is about to read.
export const focusedOn = async (page, id) =>
  (await page.locator(`[data-camera-preset="focus-${id}"]`).first().getAttribute("aria-pressed")) === "true";
/** The id the information panel is about (empty when it is closed). */
export const infoTargetId = async (page) =>
  (await infoOpen(page)) ? page.locator(HOOK.infoPanel).getAttribute("data-info-id") : "";

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Tagged places on a body (O-025 T-103): a ringed marker on each place of a mapped moon, named on hover, opened in the information panel on a press.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The scene's feature-marker readout (`data-feature-markers`): `total` markers held and `shown` ones on screen as `{key, x, y}` fractions of the canvas, key being `<body>:<place>`. */
export const sceneFeatures = (page) =>
  page
    .locator("canvas")
    .first()
    .evaluate((canvas) =>
      canvas.dataset.featureMarkers ? JSON.parse(canvas.dataset.featureMarkers) : { total: 0, shown: [] },
    );
/** A place's marker as the viewer sees it: its screen point in CSS px from the page's top left, its name, whether it reads as selected; null while it is not shown. */
export const featureMarker = (page, key) =>
  page.locator(`[data-feature-key="${key}"]`).evaluate((element) => {
    if (element.hidden) return null;
    const box = element.getBoundingClientRect();
    return {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
      width: box.width,
      name: element.getAttribute("aria-label"),
      pressed: element.getAttribute("aria-pressed") === "true",
    };
  });
/** Presses (taps) a place's marker, which opens its information. */
export const pressFeature = (page, key) => page.locator(`[data-feature-key="${key}"]`).click();
/** The text of the information panel when it shows this place, or null when another or none is open. */
export async function featureInfoText(page, key) {
  const panel = page.locator(`${HOOK.infoPanel}[data-info-kind="feature"][data-info-id="${key}"]`);
  if ((await panel.count()) === 0) return null;
  return squash(await panel.innerText());
}
/** Waits for a place's information to open. */
export const waitForFeatureInfo = (page, key, options) =>
  page.locator(`${HOOK.infoPanel}[data-info-kind="feature"][data-info-id="${key}"]`).waitFor(options);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Display switches a story placed (O-041 T-170): buttons in the top bar (the phone drawer) and rows in one switch panel opened from a Display button.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The switch's own control, by logical id ("orbitLines", "labels", "milkyWay"); the top-bar button or the panel row. */
const displaySwitch = (page, id) => page.locator(`[data-display-switch="${id}"]`);
/** Opens the switch panel (and the phone drawer holding it) when it is closed. */
async function openSwitchPanel(page) {
  const toggle = await reveal(page, page.locator(HOOK.switchPanelToggle));
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await page.locator(HOOK.switchPanel).waitFor({ state: "visible" });
}
/** Closes the switch panel by its toggle when it is open. */
async function closeSwitchPanel(page) {
  const toggle = page.locator(HOOK.switchPanelToggle);
  if ((await toggle.count()) > 0 && (await toggle.first().getAttribute("aria-expanded")) === "true") {
    await toggle.first().click();
    await page.locator(HOOK.switchPanel).waitFor({ state: "hidden" });
  }
}
/**
 * Runs `act` (which may open the menu and the switch panel to reach a switch), then leaves both as it found them: the switch panel closed again when it was
 * closed, then the menu (I-184: a driver call changes nothing beyond the action asked; an open switch panel left in a phone's menu covered the site's controls).
 */
export async function withSwitchesRestored(page, act) {
  const menuWasOpen = (await drawerStates(page)).controls;
  const toggle = page.locator(HOOK.switchPanelToggle);
  const panelWasOpen = (await toggle.count()) > 0 && (await toggle.first().getAttribute("aria-expanded")) === "true";
  const result = await act();
  if (!panelWasOpen) await closeSwitchPanel(page);
  if (!menuWasOpen) {
    await drawersSettled(page);
    await closeMenu(page);
  }
  return result;
}
/** Reaches a placed switch: opens the switch panel when it lives there, else reveals it (the menu). */
async function reachSwitch(page, control) {
  if (await page.locator(HOOK.switchPanel).locator(control).count()) await openSwitchPanel(page);
  else await reveal(page, control);
}
/** Where each placed switch shows: the ids in the top bar and the ids in the switch panel (the panel is opened to read it, then the panel and menu are left as found). */
export const displaySwitchPlaces = (page) =>
  withSwitchesRestored(page, async () => {
    const bar = await reveal(page, page.locator(".display-switches > button[data-display-switch]"));
    const inBar = await bar.evaluateAll((buttons) => buttons.map((button) => button.dataset.displaySwitch));
    const hasPanel = (await page.locator(HOOK.switchPanelToggle).count()) > 0;
    if (hasPanel) await openSwitchPanel(page);
    const inPanel = hasPanel
      ? await page
          .locator(`${HOOK.switchPanel} [data-display-switch]`)
          .evaluateAll((rows) => rows.map((row) => row.dataset.displaySwitch))
      : [];
    return { topBar: inBar, panel: inPanel };
  });
/** Whether a placed switch is on (its pressed state); the panel and menu are left as found. */
export const displaySwitchOn = (page, id) =>
  withSwitchesRestored(page, async () => {
    const control = displaySwitch(page, id);
    await reachSwitch(page, control);
    return (await control.getAttribute("aria-pressed")) === "true";
  });
/** Presses a placed switch (opening the switch panel first when it lives there); the panel and menu are left as found. */
export const toggleDisplaySwitch = (page, id) =>
  withSwitchesRestored(page, async () => {
    const control = displaySwitch(page, id);
    await reachSwitch(page, control);
    await control.click();
  });
/** The open switch panel against the rest of the screen: whether it lies inside the window, and which of the cog, the timeline and the open information panel it overlaps. The panel is opened to measure it, then the panel and menu are left as found. */
export const switchPanelFit = (page) =>
  withSwitchesRestored(page, async () => {
    await openSwitchPanel(page);
    await drawersSettled(page);
    return page.evaluate(
      ([panelHook]) => {
        const box = (element) => {
          const r = element.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        };
        const panel = box(document.querySelector(panelHook));
        const crosses = (other) =>
          other.left < panel.right - 0.5 &&
          panel.left < other.right - 0.5 &&
          other.top < panel.bottom - 0.5 &&
          panel.top < other.bottom - 0.5;
        const others = {
          cog: ".developer-mode-toggle",
          timeline: ".timeline-bar",
          info: ".info-panel",
          story: ".story-panel",
          menu: "button.bar-menu-button",
        };
        const overlaps = Object.entries(others)
          .filter(([, selector]) => {
            const element = document.querySelector(selector);
            return element !== null && getComputedStyle(element).visibility !== "hidden" && crosses(box(element));
          })
          .map(([name]) => name);
        return {
          insideWindow: panel.left >= 0 && panel.top >= 0 && panel.right <= innerWidth && panel.bottom <= innerHeight,
          overlaps,
        };
      },
      [HOOK.switchPanel],
    );
  });

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Sky figures (O-065 T-298): the line sets the scene reports drawing (`data-sky-lines`) and the site's own trace control beside the viewer (`data-site-sky-trace`).
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The sky line sets drawn now, by name (`sky-figures`, `sky-boundaries`, `sky-ecliptic`, `sky-celestial-equator`, `sky-figures:<id>`). */
export const skyLinesShown = (page) =>
  page
    .locator("canvas")
    .first()
    .evaluate((canvas) => (canvas.dataset.skyLines ?? "").split(",").filter((name) => name !== ""));
/** Waits until the sky line sets drawn satisfy `wanted` (a list of names that must show, and `absent` names that must not). */
export const waitForSkyLines = (page, { present = [], absent = [] }, timeout = 8000) =>
  page.waitForFunction(
    ([yes, no]) => {
      const shown = (document.querySelector("canvas")?.dataset.skyLines ?? "").split(",");
      return yes.every((name) => shown.includes(name)) && no.every((name) => !shown.includes(name));
    },
    [present, absent],
    { timeout },
  );
const skyTrace = (page) => page.locator("[data-site-sky-trace]");
/** Whether the site's trace control is on the page, and the figures it offers. */
export async function skyTraceOptions(page) {
  if ((await skyTrace(page).count()) === 0) return null;
  return skyTrace(page)
    .locator("select option")
    .evaluateAll((options) => options.map((option) => ({ value: option.value, label: option.textContent.trim() })));
}
/** Opens the control (it is one small button until pressed) or closes it. */
export async function setSkyTraceOpen(page, open) {
  const toggle = skyTrace(page).locator("button[data-trace-toggle]");
  if (((await toggle.getAttribute("aria-expanded")) === "true") !== open) await toggle.click();
}
/** Picks the figure the control traces next. */
export async function chooseSkyTraceFigure(page, id) {
  await setSkyTraceOpen(page, true);
  await skyTrace(page).locator("select").selectOption(id);
}
/** Waits until the scene label `id` is shown (or, with `shown` false, not shown). */
export const waitForSceneLabel = (page, id, shown, timeout = 8000) =>
  page.waitForFunction(
    ([labelId, wanted]) =>
      [...document.querySelectorAll("[data-label-id]")].some((el) => el.dataset.labelId === labelId && !el.hidden) ===
      wanted,
    [id, shown],
    { timeout },
  );
/** Presses the control's "Stay | Fade" button (trace, then that) or its "Hide" button, opening the control first. */
export async function pressSkyTrace(page, after) {
  await setSkyTraceOpen(page, true);
  await skyTrace(page).locator(`button[data-trace-after="${after}"]`).click();
}
/** The control's status: idle, tracing, stay, fade, hiding or hidden (the site's account of the call). */
export const skyTraceStatus = (page) => skyTrace(page).locator("[data-trace-status]").getAttribute("data-trace-status");
export const waitForSkyTraceStatus = (page, status, timeout = 8000) =>
  page.waitForFunction(
    (wanted) =>
      document.querySelector("[data-site-sky-trace] [data-trace-status]")?.getAttribute("data-trace-status") === wanted,
    status,
    { timeout },
  );
/** The trace control against the window and the other controls: whether it lies inside the window, the smallest button side in px, and which of the cog, the timeline, the top bar, the pill and the information panels it overlaps. */
export const skyTraceFit = (page) =>
  page.evaluate(() => {
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const mine = box(document.querySelector("[data-site-sky-trace]"));
    const crosses = (other) =>
      other.left < mine.right - 0.5 &&
      mine.left < other.right - 0.5 &&
      other.top < mine.bottom - 0.5 &&
      mine.top < other.bottom - 0.5;
    const others = {
      cog: ".developer-mode-toggle",
      timeline: ".timeline-bar",
      toolbar: ".shell-toolbar",
      info: ".info-panel",
      story: ".story-panel",
      menu: "button.bar-menu-button",
      switches: ".switch-panel",
    };
    const overlaps = Object.entries(others)
      .filter(([, selector]) => {
        const element = document.querySelector(selector);
        return element !== null && getComputedStyle(element).visibility !== "hidden" && crosses(box(element));
      })
      .map(([name]) => name);
    const sides = [...document.querySelectorAll("[data-site-sky-trace] button, [data-site-sky-trace] select")]
      .filter((control) => control.getBoundingClientRect().width > 0)
      .map((control) => Math.min(control.getBoundingClientRect().width, control.getBoundingClientRect().height));
    return {
      insideWindow: mine.left >= 0 && mine.top >= 0 && mine.right <= innerWidth && mine.bottom <= innerHeight,
      smallestPx: Math.min(...sides),
      overlaps,
    };
  });
/** Pairs of the scene labels showing that overlap each other (by label id). */
export const overlappingSceneLabels = (page) =>
  page.evaluate(() => {
    const shown = [...document.querySelectorAll("[data-label-id]")]
      .filter((el) => !el.hidden && el.getBoundingClientRect().width > 0)
      .map((el) => ({ id: el.dataset.labelId, box: el.getBoundingClientRect() }));
    const pairs = [];
    for (let i = 0; i < shown.length; i += 1)
      for (let j = i + 1; j < shown.length; j += 1) {
        const a = shown[i].box,
          b = shown[j].box;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)
          pairs.push([shown[i].id, shown[j].id]);
      }
    return pairs;
  });

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Views a scene names (O-051 T-221): the view choice in the top bar (the phone drawer's grid), and the dev page's host link for the made-up views scene.
// ---------------------------------------------------------------------------------------------------------------------------------------------

const viewButtons = (page) => page.locator("[data-view-choice] button[data-view-id]");
/** The view choice as shown: [{ id, label, pressed }] in order (the phone drawer is opened to read it). Empty when the scene has no view buttons. */
export async function viewChoice(page) {
  await reveal(page, viewButtons(page));
  return viewButtons(page).evaluateAll((buttons) =>
    buttons.map((button) => ({
      id: button.dataset.viewId,
      label: button.textContent.trim(),
      pressed: button.getAttribute("aria-pressed") === "true",
    })),
  );
}
/** The id of the view the buttons show as chosen, or undefined. */
export async function shownView(page) {
  return (await viewChoice(page)).find((option) => option.pressed)?.id;
}
/** Presses a view's button, as a visitor would. */
export async function chooseView(page, id) {
  await (await reveal(page, page.locator(`[data-view-choice] button[data-view-id="${id}"]`))).click();
}
/** The view choice against the rest of the screen: inside the window, and which of its neighbours (the controls in the same bar or drawer), the cog, the timeline and the menu button it overlaps. */
export async function viewChoiceFit(page) {
  await reveal(page, viewButtons(page));
  await drawersSettled(page);
  return page.evaluate(() => {
    const group = document.querySelector("[data-view-choice]");
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const mine = box(group);
    const crosses = (other) =>
      other.left < mine.right - 0.5 &&
      mine.left < other.right - 0.5 &&
      other.top < mine.bottom - 0.5 &&
      mine.top < other.bottom - 0.5;
    const rows = [...group.parentElement.children].filter(
      (element) =>
        element !== group && getComputedStyle(element).display !== "none" && element.getBoundingClientRect().width > 0,
    );
    const named = [
      ...rows.map((element, index) => [`neighbour-${index}`, element]),
      ...[
        ["cog", ".developer-mode-toggle"],
        ["timeline", ".timeline-bar"],
        ["menu", "button.bar-menu-button"],
      ].map(([name, selector]) => [name, document.querySelector(selector)]),
    ];
    const overlaps = named
      .filter(
        ([, element]) => element !== null && getComputedStyle(element).visibility !== "hidden" && crosses(box(element)),
      )
      .map(([name]) => name);
    const buttons = [...group.querySelectorAll("button")].map(box);
    const smallest = Math.min(...buttons.map((b) => Math.min(b.right - b.left, b.bottom - b.top)));
    return {
      insideWindow: mine.left >= 0 && mine.top >= 0 && mine.right <= innerWidth && mine.bottom <= innerHeight,
      overlaps,
      smallestButtonPx: Math.round(smallest),
    };
  });
}
/** The ids of every story panel the timeline carries a marker for, alone or gathered under a numbered mark. */
export async function listedStoryPanelIds(page) {
  const single = await page
    .locator(HOOK.storyMarker)
    .evaluateAll((markers) => markers.map((marker) => marker.getAttribute("data-panel-id")));
  return [...single, ...(await markerGroupPanelIds(page)).map((entry) => entry.id)].sort();
}
/** Waits until the views scene has finished switching view (O-060 T-281): the chosen button, the host's view, the Object list and the timeline's panel markers read the same on three polls in a row. Returns that state. */
export function waitForViewSettled(page, options = {}) {
  return waitUntilStable(
    page,
    async () => [await shownView(page), await hostView(page), await bodyOptions(page), await listedStoryPanelIds(page)],
    options,
  );
}
/** Waits until both views-scene probes' drawn lines read the same on three polls in a row: the path readouts have caught up with the view after its next drawn frame. Returns the visibility of each. */
export function waitForProbePathsSettled(page, options = {}) {
  return waitUntilStable(
    page,
    async () => [
      (await scenePath(page, "probe-a"))?.visible === true,
      (await scenePath(page, "probe-b"))?.visible === true,
    ],
    options,
  );
}
/** Polls until body `id` is more than `minDelta` (share of the view) from where `from` had it, or `timeout` passes; returns its latest readout. The caller asserts on what comes back. */
export async function waitForBodyMoved(page, id, from, { minDelta = 0.01, timeout = 2000 } = {}) {
  const deadline = Date.now() + timeout;
  let now = await sceneBody(page, id);
  while (Date.now() < deadline && !(Math.abs(from.x - now.x) + Math.abs(from.y - now.y) > minDelta)) {
    await page.waitForTimeout(100);
    now = await sceneBody(page, id);
  }
  return now;
}
/** The dev page's host link for the views scene (the same one `mount` gives a host page): the view it reports, then `setView`, and the changes it has heard (`watchHostChanges` first). */
/** The camera pose the viewer handle of an example reports (`window.viewer.camera`, set by examples/hello-sky): a sky view `{ lookOut, raDeg, decDeg, fovDeg }`, or an orbit pose. */
export const exampleCamera = async (page) => roundedPose(await page.evaluate(() => window.viewer?.camera));
/** Polls `exampleCamera` until `done(pose)` is true or `timeout` passes; returns the last pose. */
export const waitForExampleCamera = async (page, done, timeout = 6000) => {
  const deadline = Date.now() + timeout;
  let pose = await exampleCamera(page);
  while (Date.now() < deadline && !done(pose)) {
    await page.waitForTimeout(200);
    pose = await exampleCamera(page);
  }
  return pose;
};
export const hostView = (page) => page.evaluate(() => window.astraeusHost?.view);
export const hostSetView = (page, id) => page.evaluate((view) => window.astraeusHost.setView(view), id);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The host page's own controls (O-056 T-264): examples/hello-planets draws sliders and a scale button of its own (`data-host="<id>"`) beside the viewer.
// ---------------------------------------------------------------------------------------------------------------------------------------------

const hostControl = (page, id) => page.locator(`[data-host="${id}"]`);
/** Sets one of the host page's sliders the way a visitor dragging it would (value, then an input event). */
export const setHostSlider = (page, id, value) =>
  hostControl(page, id).evaluate((input, next) => {
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
/** Presses one of the host page's buttons. */
export const pressHostButton = (page, id) => hostControl(page, id).click();
/** The host controls against the viewer and the window: every control inside the window, none overlapping another or the viewer's canvas, and no sideways scroll. */
export const hostControlsFit = (page) =>
  page.evaluate(() => {
    const boxOf = (element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const crosses = (a, b) =>
      a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const controls = [...document.querySelectorAll("[data-host]")].map((element) => ({
      id: element.dataset.host,
      ...boxOf(element),
    }));
    const canvas = boxOf(document.querySelector("canvas"));
    const overlaps = controls.flatMap((a, i) => [
      ...controls
        .slice(i + 1)
        .filter((b) => crosses(a, b))
        .map((b) => `${a.id}/${b.id}`),
      ...(crosses(a, canvas) ? [`${a.id}/canvas`] : []),
    ]);
    const outside = controls
      .filter((c) => c.left < 0 || c.top < 0 || c.right > innerWidth || c.bottom > innerHeight)
      .map((c) => c.id);
    return {
      count: controls.length,
      overlaps,
      outside,
      sideways: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The sky view (O-064 T-293): the camera reading in the Developer drawer's view line, and the camera menu's "Look out from" entry.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Rounds a sky pose the way the view line and view links do (`viewLink.ts` `round`): right ascension and declination to 2 decimals, field of view to 1 decimal. A field of view that is still gliding
 * toward its target is therefore compared to a 0.05 degree tolerance (planner decision 8) rather than waited out to exact equality. Anything that is not a sky pose passes through unchanged.
 */
const roundedPose = (pose) => {
  if (pose === null || typeof pose !== "object" || typeof pose.fovDeg !== "number") return pose;
  const to = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
  return { ...pose, raDeg: to(pose.raDeg, 2), decDeg: to(pose.decDeg, 2), fovDeg: to(pose.fovDeg, 1) };
};
/** The handle reports the opening camera before the first frame is drawn, whereas the drawer it replaces only showed a line after one; a reading therefore waits (up to 3 s) for the canvas's per-frame body readout, so a script that reads the scene next sees a drawn frame. */
const firstFrameDrawn = (page) =>
  page
    .waitForFunction(() => document.querySelector("canvas")?.hasAttribute("data-body-screen"), undefined, {
      timeout: 3000,
    })
    .catch(() => undefined);
/** The camera as the dev page's viewer handle (`window.astraeusHost.camera`) reports it now: a sky view `{ sky: true, body, raDeg, decDeg, fovDeg }` while the camera looks out, else `{ sky: false, text }` (the orbit pose as JSON). Opens no drawer. */
export async function cameraReading(page) {
  await firstFrameDrawn(page);
  const pose = roundedPose(await page.evaluate(() => window.astraeusHost?.camera));
  if (pose && typeof pose.lookOut === "string")
    return { sky: true, body: pose.lookOut, raDeg: pose.raDeg, decDeg: pose.decDeg, fovDeg: pose.fovDeg };
  return { sky: false, text: JSON.stringify(pose ?? null) };
}
/** Polls the camera reading about every 100 ms until `done(reading)` is true or `timeout` passes; returns the last reading. The caller asserts on what comes back. */
export async function waitForCameraReading(page, done, { timeout = 6000 } = {}) {
  const deadline = Date.now() + timeout;
  let reading = await cameraReading(page);
  while (Date.now() < deadline && !done(reading)) {
    await page.waitForTimeout(100);
    reading = await cameraReading(page);
  }
  return reading;
}
/**
 * Waits until the camera reading satisfies `done` (default: any) and its rounded pose has been the same on `polls` reads in a row, about 100 ms apart, then returns it (I-192). The viewer handle
 * reports the pose every frame, so the first reading that differs from the old view is mid-glide; a step-direction assertion reads the settled pose instead. Throws after `timeout` ms naming `what`
 * it waited for and the last reading, so a camera that never settles (or never reaches the target) fails clearly.
 */
export async function waitForSettledCamera(
  page,
  done = () => true,
  { timeout = 6000, polls = 3, what = "the camera to settle" } = {},
) {
  const deadline = Date.now() + timeout;
  let reading = await cameraReading(page);
  let same = 1;
  while (!(done(reading) && same >= polls)) {
    if (Date.now() >= deadline)
      throw new Error(`${what} never happened in ${timeout} ms (last reading: ${JSON.stringify(reading)})`);
    await page.waitForTimeout(100);
    const next = await cameraReading(page);
    same = JSON.stringify(next) === JSON.stringify(reading) ? same + 1 : 1;
    reading = next;
  }
  return reading;
}
/** One camera menu entry against the rest of the screen: inside the window and which neighbours (the controls in the same row, the cog, the timeline and the menu button) it overlaps, and its smaller side in pixels. */
export async function cameraEntryFit(page, presetId) {
  await reveal(page, page.locator(`[data-camera-preset="${presetId}"]`));
  await drawersSettled(page);
  return page.evaluate((id) => {
    const entry = document.querySelector(`[data-camera-preset="${id}"]`);
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const mine = box(entry);
    const crosses = (other) =>
      other.left < mine.right - 0.5 &&
      mine.left < other.right - 0.5 &&
      other.top < mine.bottom - 0.5 &&
      mine.top < other.bottom - 0.5;
    const rows = [...entry.parentElement.children].filter(
      (element) =>
        element !== entry && getComputedStyle(element).display !== "none" && element.getBoundingClientRect().width > 0,
    );
    const named = [
      ...rows.map((element, index) => [`neighbour-${index}`, element]),
      ...[
        ["cog", ".developer-mode-toggle"],
        ["timeline", ".timeline-bar"],
        ["menu", "button.bar-menu-button"],
      ].map(([name, selector]) => [name, document.querySelector(selector)]),
    ];
    const overlaps = named
      .filter(
        ([, element]) => element !== null && getComputedStyle(element).visibility !== "hidden" && crosses(box(element)),
      )
      .map(([name]) => name);
    return {
      insideWindow: mine.left >= 0 && mine.top >= 0 && mine.right <= innerWidth && mine.bottom <= innerHeight,
      overlaps,
      smallestPx: Math.round(Math.min(mine.right - mine.left, mine.bottom - mine.top)),
    };
  }, presetId);
}
/** A mouse wheel turn over the free canvas (desktop pages): zooms the sky view's field of view. Returns false when no free canvas point exists. */
export async function wheelOverCanvas(page, deltaY) {
  const point = await freeCanvasPoint(page);
  if (point === null || point === undefined) return false;
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, deltaY);
  return true;
}

// ---- The component catalogue page (O-080 T-335): components.html, one entry per shelf part, each with a Run button, a viewer box and its code. Every hook is a data- attribute the page sets. ----
const CATALOGUE_STAGE_TIMEOUT_MS = 60000;
/** The catalogue's entries in page order: `{ part, state }` with state idle, loading, running or failed. */
export async function catalogueParts(page) {
  await page.waitForSelector("[data-part]");
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-part]")].map((entry) => ({
      part: entry.getAttribute("data-part"),
      state: entry.getAttribute("data-state"),
    })),
  );
}
/** Presses an entry's Run button (it starts the example, or stops it when it is the one running). */
export async function pressCatalogueRun(page, part) {
  await page.locator(`[data-part="${part}"] [data-part-run]`).click();
}
/** Waits until an entry's state is `state` (idle, running or failed); a failed example reads its note from the box. */
export async function waitForCatalogueState(page, part, state) {
  await page.waitForSelector(`[data-part="${part}"][data-state="${state}"]`, { timeout: CATALOGUE_STAGE_TIMEOUT_MS });
}
/** The entries whose example is loading or running now. */
export async function catalogueActive(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-part]")]
      .filter((entry) => ["loading", "running"].includes(entry.getAttribute("data-state")))
      .map((entry) => entry.getAttribute("data-part")),
  );
}
/** How many viewers (scene canvases) the whole page draws now. */
export async function catalogueViewerCount(page) {
  return page.evaluate(() => document.querySelectorAll("[data-part-stage] canvas").length);
}
/** An entry's plain name, whether its For developers fold is open, its box text, the lines shown beside it and its whole code, as the page prints them (textContent, so a control the viewer folds into a menu still counts). */
export async function catalogueEntry(page, part) {
  return page.evaluate((name) => {
    const entry = document.querySelector(`[data-part="${name}"]`);
    const text = (hook) => entry.querySelector(`[${hook}]`).textContent;
    return {
      name: text("data-part-name"),
      devOpen: entry.querySelector("details.dev").open,
      stage: text("data-part-stage"),
      importLines: text("data-part-import"),
      addLines: text("data-part-add"),
      code: text("data-part-code"),
      runLabel: text("data-part-run"),
      runHeightPx: Math.round(entry.querySelector("[data-part-run]").getBoundingClientRect().height),
    };
  }, part);
}
/** Whether the page fits its window: no sideways scroll, each entry's words and its example side by side or stacked without crossing, and the viewer box inside the window's width. */
export async function catalogueFit(page) {
  return page.evaluate(() => {
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const crosses = (a, b) =>
      a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const overlaps = [];
    const outside = [];
    for (const entry of document.querySelectorAll("[data-part]")) {
      const name = entry.getAttribute("data-part");
      const text = box(entry.querySelector(".part-text"));
      const demo = box(entry.querySelector(".part-demo"));
      if (crosses(text, demo)) overlaps.push(name);
      const stage = box(entry.querySelector("[data-part-stage]"));
      if (stage.left < 0 || stage.right > innerWidth + 0.5) outside.push(name);
    }
    const root = document.documentElement;
    return { sidewaysScrollPx: Math.max(0, root.scrollWidth - innerWidth), overlaps, outside };
  });
}

// ---- The tile and the chart on the catalogue page (O-081 T-339). The shell's own classes are read here, never in a script. ----
/** What an entry's viewer shows of the readout tile: the full card (a wide viewer), the one-line strip (a phone) and the open sheet, with the strip's text and whether the card or the strip sits in the left half of the box. */
export async function catalogueTile(page, part) {
  return page.evaluate((name) => {
    const stage = document.querySelector(`[data-part="${name}"] [data-part-stage]`);
    const area = stage.querySelector('[data-area="tile"]');
    const strip = stage.querySelector(".tile-strip-button");
    const card = stage.querySelector(".tile-card");
    const sheet = stage.querySelector(".tile-sheet");
    const stageBox = stage.getBoundingClientRect();
    const shown = (card ?? strip)?.getBoundingClientRect();
    return {
      area: area !== null,
      card: card !== null,
      strip: strip !== null,
      sheet: sheet !== null,
      expanded: strip?.getAttribute("aria-expanded") === "true",
      text: (card ?? strip)?.textContent ?? "",
      leftHalf:
        shown !== undefined &&
        shown.left >= stageBox.left - 0.5 &&
        shown.left + shown.width / 2 < stageBox.left + stageBox.width / 2,
      inside: shown !== undefined && shown.left >= stageBox.left - 0.5 && shown.right <= stageBox.right + 0.5,
    };
  }, part);
}
/** Presses the tile's strip on an entry's viewer (a phone opens the sheet). */
export async function pressCatalogueTileStrip(page, part) {
  await page.locator(`[data-part="${part}"] [data-part-stage] .tile-strip-button`).click();
}
/** Waits until the tile's sheet is (or is not) open in an entry's viewer. */
export async function waitForCatalogueTileSheet(page, part, open) {
  await page.waitForSelector(`[data-part="${part}"] [data-part-stage] .tile-sheet`, {
    state: open ? "attached" : "detached",
    timeout: 10000,
  });
}
/** The text of the entry's tile (card or strip) after waiting up to `ms` for it to differ from `before`; the last text read. */
export async function waitForCatalogueTileChange(page, part, before, ms = 20000) {
  try {
    await page.waitForFunction(
      ({ name, text }) => {
        const stage = document.querySelector(`[data-part="${name}"] [data-part-stage]`);
        const shown = stage?.querySelector(".tile-card") ?? stage?.querySelector(".tile-strip-button");
        return shown !== null && shown !== undefined && shown.textContent !== text;
      },
      { name: part, text: before },
      { timeout: ms },
    );
  } catch {
    /* a value that did not move is reported by the caller from the text it gets back */
  }
  return (await catalogueTile(page, part)).text;
}
/** What the chart shows in an entry's viewer: its bars and how many are dimmed (the panel must be open to draw it). */
export async function catalogueChart(page, part) {
  return page.evaluate((name) => {
    const stage = document.querySelector(`[data-part="${name}"] [data-part-stage]`);
    const chart = stage.querySelector(".shelf-chart");
    if (chart === null) return { drawn: false, bars: 0, dimmed: 0, label: "" };
    return {
      drawn: true,
      bars: chart.querySelectorAll("[data-shelf-bar]").length,
      dimmed: chart.querySelectorAll("[data-shelf-bar].is-dim").length,
      label: chart.querySelector("svg")?.getAttribute("aria-label") ?? chart.textContent ?? "",
    };
  }, part);
}

// ---- The actions example on the catalogue page (O-095 T-442): a panel button, and the buttons inside the panel it opens. ----
/** Presses the bar button that opens an example's own panel; `names` is the button's full and short label as the bar shows them (the actions example's are "Fly to" and "Fly"). */
export async function pressCataloguePanelButton(page, part, names = ["Fly to", "Fly"]) {
  const escaped = names.map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  await page
    .locator(`[data-part="${part}"] [data-part-stage]`)
    .getByRole("button", { name: new RegExp(`^(${escaped.join("|")})$`) })
    .first()
    .click();
}
/**
 * Puts one 120-character word with no break opportunity at the end of every non-empty text inside an entry's open panel surface (the shelf panel, the tile's card or its sheet), then reads how far the surface spills sideways.
 * Left alone: the close button's glyph (a fixed symbol, not words), text inside the chart's svg (drawn labels, not wrapping words) and text whose element is `white-space: nowrap` (the tile's one-line strip and scale labels are one line by design).
 * Returns null when no surface is drawn; else the surface's clientWidth and scrollWidth, and each element whose right edge passes the surface's content box by more than 1 px.
 */
export async function catalogueLongWordFit(page, part) {
  const read = () =>
    page.evaluate(
      ({ name, word }) => {
        const stage = document.querySelector(`[data-part="${name}"] [data-part-stage]`);
        const surface = [...(stage?.querySelectorAll(".info-panel, .tile-card, .tile-sheet") ?? [])].find(
          (el) => el.getBoundingClientRect().width > 0,
        );
        if (surface === undefined) return null;
        const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
        const nodes = [];
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) nodes.push(node);
        for (const node of nodes) {
          const el = node.parentElement;
          if (node.data.trim() === "" || el === null || el.closest("svg") !== null) continue;
          if (el.closest(".info-panel-close") !== null || getComputedStyle(el).whiteSpace === "nowrap") continue;
          node.data += word;
        }
        return new Promise((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const box = surface.getBoundingClientRect();
              const style = getComputedStyle(surface);
              const edge =
                box.right - (parseFloat(style.borderRightWidth) || 0) - (parseFloat(style.paddingRight) || 0);
              const past = [...surface.querySelectorAll("*")]
                .filter((el) => el.closest("svg") === null || el.tagName === "svg")
                .filter((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().right > edge + 1)
                .map(
                  (el) =>
                    `${el.tagName.toLowerCase()}.${String(el.className).trim().replace(/\s+/g, ".")} +${Math.round(el.getBoundingClientRect().right - edge)}px`,
                );
              resolve({ clientWidth: surface.clientWidth, scrollWidth: surface.scrollWidth, past });
            }),
          ),
        );
      },
      { name: part, word: "W".repeat(120) },
    );
  await page.waitForFunction(
    (name) =>
      [
        ...document.querySelectorAll(
          `[data-part="${name}"] [data-part-stage] :is(.info-panel, .tile-card, .tile-sheet)`,
        ),
      ].some((el) => el.getBoundingClientRect().width > 0),
    part,
    { timeout: 10000 },
  );
  return read();
}
/** The drawn mark labels of the chart in an entry's viewer (`[data-shelf-mark] text`) as boxes, and the chart svg's box. */
export async function catalogueChartMarks(page, part) {
  return page.evaluate((name) => {
    const chart = document.querySelector(`[data-part="${name}"] [data-part-stage] .shelf-chart`);
    const svg = chart?.querySelector("svg") ?? null;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    return {
      svg: svg === null ? null : box(svg),
      labels: [...(chart?.querySelectorAll("[data-shelf-mark] text") ?? [])].map((el) => ({
        text: el.textContent,
        ...box(el),
      })),
    };
  }, part);
}

/** Presses one action button (by its id) inside the open panel of an entry's viewer. */
export async function pressCatalogueAction(page, part, actionId) {
  await page.locator(`[data-part="${part}"] [data-part-stage] [data-shelf-action="${actionId}"]`).click();
}
/** Whether an entry's viewer shows its action buttons now (the panel holding them is open and drawn). */
export async function catalogueActionsShown(page, part) {
  return page.evaluate((name) => {
    const button = document.querySelector(`[data-part="${name}"] [data-part-stage] [data-shelf-action]`);
    if (button === null) return false;
    const r = button.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }, part);
}
/** Waits until an entry's action buttons are shown (or not), up to `ms`; the last answer. */
export async function waitForCatalogueActions(page, part, shown, ms = 5000) {
  const end = Date.now() + ms;
  let now = await catalogueActionsShown(page, part);
  while (now !== shown && Date.now() < end) {
    await page.waitForTimeout(100);
    now = await catalogueActionsShown(page, part);
  }
  return now;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Frame-loop profile (O-087 T-394): CPU numbers for a fixed window, read from the browser's own metrics. No selectors beyond the scene canvas.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Call before `goto`: sets `globalThis.__ASTRAEUS_DIAGNOSTICS__` to `on` before any page script runs (the engine reads it from O-087 draft 02; before that it does nothing). */
export const requestDiagnostics = (page, on) =>
  page.addInitScript((value) => {
    globalThis.__ASTRAEUS_DIAGNOSTICS__ = value;
  }, on === true);

/** The Chrome DevTools Protocol metrics counted per second over a window. */
const FRAME_METRICS = [
  "ScriptDuration",
  "TaskDuration",
  "LayoutCount",
  "LayoutDuration",
  "RecalcStyleCount",
  "RecalcStyleDuration",
];

/**
 * Reads `Performance.getMetrics` before and after a `windowMs` wait and returns the per-second deltas of script, task, layout and style-recalc time and counts, the JS heap change in bytes,
 * and the frames drawn per second (`data-frames-drawn`). Durations are seconds of work per second of wall time.
 */
export async function frameMetrics(page, windowMs = 10000) {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Performance.enable");
    const read = async () =>
      Object.fromEntries((await session.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const framesBefore = await framesDrawn(page);
    const startedAt = Date.now();
    const before = await read();
    await page.waitForTimeout(windowMs);
    const after = await read();
    const framesAfter = await framesDrawn(page);
    const seconds = (Date.now() - startedAt) / 1000;
    const perSecond = Object.fromEntries(
      FRAME_METRICS.map((name) => [name, ((after[name] ?? 0) - (before[name] ?? 0)) / seconds]),
    );
    return {
      seconds,
      ...perSecond,
      JSHeapUsedSizeChange: (after.JSHeapUsedSize ?? 0) - (before.JSHeapUsedSize ?? 0),
      framesDrawnPerSecond: (framesAfter - framesBefore) / seconds,
    };
  } finally {
    await session.detach();
  }
}

// O-092 T-427: helpers for the two-viewers step. The page's scene canvases are counted and read by their place in the page (`n`, from 0); the viewers' handles are `window.astraeusHost` (the first) and `window.astraeusSecondHost` (the second).
/** How many scene canvases the page draws now. */
export const canvasCount = (page) => page.locator("canvas").count();
/** The frames drawn by the `n`th canvas (`data-frames-drawn`); 0 before its first. */
export async function framesDrawnOf(page, n) {
  return Number((await page.locator("canvas").nth(n).getAttribute("data-frames-drawn")) ?? 0);
}
/** Waits until the `n`th canvas has drawn at least `count` more frames than `before`; returns the new count. Throws after `timeout`. */
export async function waitForMoreFramesOf(page, n, before, count = 3, timeout = 5000) {
  const now = await waitUntil(
    page,
    () => framesDrawnOf(page, n),
    (frames) => frames >= before + count,
    {
      timeout,
      what: `canvas ${n} drawing ${count} more frames than ${before}`,
    },
  );
  return now;
}
/** Starts or pauses the first (`"first"`) or second (`"second"`) viewer through its handle. */
export const setViewerPlaying = (page, which, playing) =>
  page.evaluate(
    ({ which: w, playing: p }) => (w === "first" ? window.astraeusHost : window.astraeusSecondHost).setPlaying(p),
    { which, playing },
  );
/** Takes the first or second viewer down through its handle (`unmount`). */
export const unmountViewer = (page, which) =>
  page.evaluate((w) => (w === "first" ? window.astraeusHost : window.astraeusSecondHost).unmount(), which);
/** Each canvas's box on the page, in order: `{ x, y, width, height }`. */
export const canvasBoxes = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("canvas")].map((canvas) => {
      const { x, y, width, height } = canvas.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
/** Loses the `n`th canvas's graphics context, waits for the page to hear it, restores it and waits for `webglcontextrestored`; returns `{ lost, restored }` (what the canvas heard within `timeout` ms each). */
export const loseAndRestoreContext = (page, n, timeout = 5000) =>
  page.evaluate(
    async ({ n: index, timeout: ms }) => {
      const canvas = document.querySelectorAll("canvas")[index];
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      const extension = gl.getExtension("WEBGL_lose_context");
      const heard = (type) =>
        new Promise((resolve) => {
          const timer = setTimeout(() => resolve(false), ms);
          canvas.addEventListener(
            type,
            () => {
              clearTimeout(timer);
              resolve(true);
            },
            { once: true },
          );
        });
      const lost = heard("webglcontextlost");
      extension.loseContext();
      const wasLost = await lost;
      // The browser allows a restore only once it has finished dispatching the lost event ("context restoration not allowed" otherwise), so wait a moment first.
      await new Promise((resolve) => setTimeout(resolve, 200));
      const restored = heard("webglcontextrestored");
      extension.restoreContext();
      return { lost: wasLost, restored: await restored };
    },
    { n, timeout },
  );

// O-096 T-447: helpers for the no-WebGL pass of the two-viewers step.
/** Before the page loads: makes every canvas refuse a WebGL context (`getContext` answers null for `webgl`, `webgl2` and `experimental-webgl`), and records the code of the first unhandled rejection the page raises in `window.astraeusRejected` (and keeps the browser from reporting it as a page error). Call before `page.goto`. */
export const withoutWebgl = (page) =>
  page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return /webgl/i.test(String(kind)) ? null : original.call(this, kind, ...rest);
    };
    window.addEventListener("unhandledrejection", (event) => {
      window.astraeusRejected ??= event.reason?.code ?? String(event.reason);
      event.preventDefault();
    });
  });
/** What a no-WebGL page shows: the message element's text and box (or null), the number of canvases, and the code `ready` rejected with (undefined until it has). */
export const noWebglState = (page) =>
  page.evaluate(() => {
    const message = document.querySelector("[data-astraeus-no-webgl]");
    const box = message?.getBoundingClientRect();
    return {
      text: message?.textContent ?? null,
      box: box === undefined ? null : { x: box.x, y: box.y, width: box.width, height: box.height },
      canvases: document.querySelectorAll("canvas").length,
      rejected: window.astraeusRejected,
    };
  });
