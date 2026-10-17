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
  infoPanel: "#info-panel",
  infoClose: "#info-panel .info-panel-close",
  provenanceBadge: ".provenance-badge",
  provenanceDetail: ".provenance",
  sourcesSection: ".sources-section",
  controlsPill: "button.controls-pill",
  controlsDrawer: ".controls-drawer",
  timelineHandle: "button.drawer-handle-top",
  timelineDrawer: ".timeline-drawer",
  controlsHandle: "button.drawer-handle-bottom",
  eventsDetails: "details.timeline-event-list",
  eventsSummary: "details.timeline-event-list summary",
  eventRows: ".timeline-expanded li button",
  eventContext: ".timeline-event-context",
  currentEventButton: ".timeline-event-current",
  timeLabel: ".timeline-time",
  windowPeak: "button.timeline-window-peak",
  glow: ".timeline-glow",
  track: ".timeline-track",
  storyPanel: ".story-panel",
  storyMarker: ".timeline-panel-marker",
  developerPanel: ".developer-tools",
  missionPanel: ".mission",
  infoToggle: ".object-info-toggle",
  sceneLabels: ".scene-labels",
  anchorLabels: ".anchor-labels",
};

const squash = (text) => text.replace(/\s+/g, " ");

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Phone drawers (T-081): on a phone the top controls and the timeline's speed slider and events sit in drawers. The functions below that press a
// control inside one call `reveal` first, which opens the drawer that holds it; on a larger screen there are no drawers and `reveal` does nothing.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Whether the page is in the phone layout (it has the controls pill). */
export const isPhoneLayout = async (page) => (await page.locator(HOOK.controlsPill).count()) > 0;
/** Opens the top drawer when the layout has one and it is closed. */
export async function openControlsDrawer(page) {
  const pill = page.locator(HOOK.controlsPill);
  if ((await pill.count()) > 0 && (await pill.getAttribute("aria-expanded")) !== "true") { await pill.click(); await page.locator(`${HOOK.controlsDrawer}[data-open="true"]`).waitFor(); }
}
/** Closes the top drawer by its handle when it is open. */
export async function closeControlsDrawer(page) {
  const pill = page.locator(HOOK.controlsPill);
  if ((await pill.count()) > 0 && (await pill.getAttribute("aria-expanded")) === "true") { await page.locator(HOOK.controlsHandle).click(); await page.locator(`${HOOK.controlsDrawer}[data-open="false"]`).waitFor({ state: "attached" }); }
}
/** Opens the timeline drawer when the layout has one and it is closed. */
export async function openTimelineDrawer(page) {
  const handle = page.locator(HOOK.timelineHandle);
  if ((await handle.count()) > 0 && (await handle.getAttribute("aria-expanded")) !== "true") { await handle.click(); await page.locator(`${HOOK.timelineDrawer}[data-open="true"]`).waitFor(); }
}
/** Closes the timeline drawer by its handle when it is open. */
export async function closeTimelineDrawer(page) {
  const handle = page.locator(HOOK.timelineHandle);
  if ((await handle.count()) > 0 && (await handle.getAttribute("aria-expanded")) === "true") { await handle.click(); await page.locator(`${HOOK.timelineDrawer}[data-open="false"]`).waitFor({ state: "attached" }); }
}
/** Waits until no drawer or sheet is still sliding (a control that is about to be hidden still counts as showing while it moves). */
const drawersSettled = (page) => page.waitForFunction((hooks) => [...document.querySelectorAll(hooks)].every((element) => element.getAnimations().every((animation) => animation.playState !== "running")), `${HOOK.controlsDrawer}, ${HOOK.timelineDrawer}, #info-panel, ${HOOK.storyPanel}`);
/** Makes the control a locator names reachable: opens the top drawer, then the timeline drawer, until it shows. Returns the locator. */
async function reveal(page, locator) {
  if (await isPhoneLayout(page)) await drawersSettled(page);
  if (!(await isPhoneLayout(page)) || (await locator.first().isVisible())) return locator;
  await openControlsDrawer(page);
  if (await locator.first().isVisible()) return locator;
  await openTimelineDrawer(page);
  return locator;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The shell as a whole
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Waits until the timeline controls (so the shell) are on the page. */
export const waitForShell = (page, options) => page.getByRole("region", { name: "Timeline controls" }).waitFor(options);

/** The timeline controls' visible text (time, rate readouts). */
export const timelineText = (page) => page.getByRole("region", { name: "Timeline controls" }).innerText();

/** Everything the page shows as text. */
export const pageText = (page) => page.locator("body").innerText();

/** Presses a key on the page (for example "Escape"). */
export const pressKey = (page, key) => page.keyboard.press(key);

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
export const seekTo = (page, timeUtcMs) => seekSlider(page).evaluate((input, time) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}, timeUtcMs);

/** Seeks to a fraction (0 to 1) of the timeline with the slider focused, firing the input and change events a keyboard user's move would. */
export async function seekToFraction(page, fraction) {
  await seekSlider(page).focus();
  await seekSlider(page).evaluate((input, f) => {
    const min = Number(input.min), max = Number(input.max);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(min + (max - min) * f));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, fraction);
}

/** Types an instant into the developer panel's "UTC date and time" field. */
export const setUtc = (page, utc) => page.getByLabel("UTC date and time").fill(utc);
/** Types an instant into that field and presses "Seek (UTC)". */
export async function seekToUtcText(page, utc) {
  await setUtc(page, utc);
  await page.getByRole("button", { name: "Seek (UTC)", exact: true }).click();
}
/** Presses "Jump to event" in the developer panel (after choosing a Mission event). */
export const jumpToMissionEvent = (page) => page.getByRole("button", { name: "Jump to event", exact: true }).click();
/** Waits for that field (to appear, or with `{state: "hidden"}` to go). */
export const waitForUtcField = (page, options) => page.getByLabel("UTC date and time").waitFor(options);
export const utcFieldVisible = (page) => page.getByLabel("UTC date and time").isVisible();

/** The clock as the timeline prints it (for example "1969-07-16T13:32:00.000Z"). */
export const clockText = (page) => page.locator(HOOK.timeLabel).innerText();
/** The clock's machine-readable instant (ISO). */
export const clockIso = (page) => page.locator(HOOK.timeLabel).getAttribute("datetime");
/** The clock as UTC milliseconds. */
export const clockMs = async (page) => Date.parse(await clockIso(page));
/** The clock's instant in the timeline text (first ISO instant in it), as milliseconds. */
export const clockMsFromTimelineText = async (page) => Date.parse((await timelineText(page)).match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0]);

const pauseButton = (page) => page.getByRole("button", { name: "Pause playback", exact: true });
const playButton = (page) => page.getByRole("button", { name: "Play playback", exact: true });

/** Pauses the clock; fails when it was not playing. */
export const pausePlayback = (page) => pauseButton(page).click();
/** Pauses the clock when it is playing; does nothing when it is already paused. */
export async function ensurePaused(page) { if (await pauseButton(page).count()) await pauseButton(page).click(); }
/** Pauses when playing, giving up quietly after 5 s (for a page that may be busy). */
export async function ensurePausedQuietly(page) { if (await pauseButton(page).count()) await pauseButton(page).click({ timeout: 5000 }).catch(() => undefined); }
/** Starts the clock; fails when it was not paused. */
export const playPlayback = (page) => playButton(page).click();
/** Starts the clock when it is paused. */
export async function ensurePlaying(page) { if (await playButton(page).count()) await playButton(page).click(); }
/** The "Continue playback" button a story panel offers after it paused the clock. */
export const continuePlayback = (page) => page.getByRole("button", { name: "Continue playback" }).click();
/** Whether the clock is running. */
export const isPlaying = async (page) => (await page.getByRole("button", { name: /(Pause|Play) playback/ }).getAttribute("aria-label")) === "Pause playback";
/** Waits until the clock is running. */
export const waitUntilPlaying = (page, timeout) => pauseButton(page).waitFor({ timeout });
/** Whether the "Open panels automatically" setting is on. */
export const storyAutoOpenOn = (page) => toggleOn(page, "story-auto-open");
/** Pauses by clicking in the page itself (skips actionability waits, for pages busy rendering). */
export const pausePlaybackNow = (page) => page.evaluate(() => document.querySelector('button[aria-label="Pause playback"]')?.click());

/** Chooses a playback rate (for example 100 or "100"). */
export const setSpeed = (page, rate) => page.getByLabel("Playback speed").selectOption(String(rate));
/** Chooses the fastest playback rate the picker offers; returns its value. */
export async function setFastestSpeed(page) {
  const picker = page.getByLabel("Playback speed");
  const last = await picker.evaluate((select) => select.options[select.options.length - 1].value);
  await picker.selectOption(last);
  return last;
}
/** The playback rate in force, as the picker holds it. */
export const speed = (page) => page.getByLabel("Playback speed").inputValue();

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Events and windows
// ---------------------------------------------------------------------------------------------------------------------------------------------

const nextButton = (page) => page.getByRole("button", { name: /^Next/, exact: false }).first();
const previousButton = (page) => page.getByRole("button", { name: /^Previous/, exact: false }).first();

/** Steps the clock to the next event or window stop. */
export const nextEvent = (page) => nextButton(page).click();
export const previousEvent = (page) => previousButton(page).click();
/** Whether there is a further stop ahead. */
export const hasNextEvent = async (page) => !(await nextButton(page).isDisabled());
/** What the next-stop button says it will do (for example "Next: window opens"). */
export const nextEventLabel = (page) => nextButton(page).getAttribute("aria-label");

/** Opens or closes the Events list. */
export async function toggleEventList(page) {
  if (await isPhoneLayout(page)) await page.locator(HOOK.timelineHandle).click();
  else await page.locator(HOOK.eventsSummary).click();
}
export const eventListOpen = async (page) => ((await isPhoneLayout(page))
  ? (await page.locator(HOOK.timelineHandle).getAttribute("aria-expanded")) === "true"
  : page.locator(HOOK.eventsDetails).evaluate((element) => element.open));
export async function openEventList(page) { if (!(await eventListOpen(page))) await toggleEventList(page); }
export async function closeEventList(page) { if (await eventListOpen(page)) await toggleEventList(page); }
/** Text of the Events list (the list itself, open or not). */
export const eventListText = async (page) => ((await isPhoneLayout(page)) ? page.locator(HOOK.timelineDrawer) : page.locator(HOOK.eventsDetails)).innerText();
/** The Events list's rows as `{label, utc}` (the list needs to be rendered, open or not). */
export const eventRows = (page) => page.locator(HOOK.eventRows).evaluateAll((buttons) => buttons.map((button) => ({
  label: button.querySelector("span")?.textContent?.trim() ?? "",
  utc: button.querySelector("time")?.getAttribute("datetime") ?? "",
})));
/** The Events rows as plain text, one per row. */
export const eventRowTexts = (page) => page.locator(HOOK.eventRows).allTextContents();
export const eventRowCount = (page) => page.locator(HOOK.eventRows).count();
/** Clicks the n-th row of the (open) Events list: seeks to it and opens its information. */
export const pickEventRow = async (page, index) => (await reveal(page, page.locator(HOOK.eventRows))).nth(index).click();
/** The label text of the n-th Events row. */
export const eventRowLabel = async (page, index) => (await page.locator(HOOK.eventRows).nth(index).locator("span").textContent()).trim();
/** The "Just happened / Up next / Inside" text. */
export const eventContextText = (page) => page.locator(HOOK.eventContext).innerText();
/** The "Inside: window" line (needs the Events list open). */
export const insideText = (page) => page.locator(".timeline-window-current").innerText();
/** Presses the "Just happened" line, which opens that event's information. */
export const openCurrentEventInfo = async (page) => (await reveal(page, page.locator(HOOK.currentEventButton))).click();
/** Chooses an event in the developer panel's "Mission event" list by value. */
export const missionEventOptions = (page) => page.getByLabel("Mission event").locator("option").evaluateAll((options) => options.map((option) => ({
  value: option.value,
  label: option.textContent?.trim() ?? "",
})));
export const pickMissionEvent = (page, value) => page.getByLabel("Mission event").selectOption(value);
/** Waits until the clock reads a UTC instant (any parseable form). */
export const waitForClock = (page, target, timeout = 5000) => page.waitForFunction((wanted) => Date.parse(document.querySelector(".timeline-time")?.getAttribute("datetime") ?? "") === Date.parse(wanted), target, { timeout });

/** The timeline bar's box on the page. */
export const timelineBox = (page) => page.locator(".timeline-bar").boundingBox();
/** A picture of the scene canvas with the timeline bar blacked out: the canvas lies behind the bar, so a pixel count must not count the bar's own colours (T-084; the old purple strip was once counted as the comet's orbit). */
export const sceneCanvasPng = (page) => page.getByTestId("earth-moon-canvas").screenshot({ mask: [page.locator(".timeline-bar")], maskColor: "#000000" });
/** The scene alone, for brightness sums: the first canvas with every interface layer over it blacked out (top bar, drawers, timeline, developer panel, labels stay as drawn). */
export const sceneOnlyPng = (page) => page.locator("canvas").first().screenshot({ mask: [page.locator(".top-bar"), page.locator(".controls-drawer"), page.locator(".timeline-bar"), page.locator(".developer-tools")], maskColor: "#000000" });
/** The activity window's peak marker (a button on the timeline line). */
export const windowPeak = (page) => page.locator(HOOK.windowPeak);
/** The activity glow drawn inside the timeline track (T-084): how many there are (0 or 1), its text equivalent, and its gradient. */
export const glowCount = (page) => page.locator(HOOK.glow).count();
export const glowText = (page) => page.locator(HOOK.glow).getAttribute("aria-label");
export const glowGradients = (page) => page.locator(HOOK.glow).evaluate((element) => ({ ahead: element.style.getPropertyValue("--glow-ahead"), played: element.style.getPropertyValue("--glow-played") }));
/** The track's tooltip text, after the pointer has moved to a fraction (0-1) of the track's width. */
export async function glowTooltipAt(page, fraction) {
  const box = await page.locator(HOOK.track).boundingBox();
  await page.mouse.move(box.x + 8 + (box.width - 16) * fraction, box.y + box.height / 2);
  await page.waitForTimeout(100);
  return page.locator(HOOK.track).getAttribute("title");
}
/** What the timeline draws for activity: the glow, the peak mark, the track and slider, for reading boxes. */
export const windowParts = (page) => ({
  glow: page.locator(HOOK.glow),
  peak: page.locator(HOOK.windowPeak),
  inside: page.locator(".timeline-window-current"),
  scrubber: page.locator(".timeline-scrubber"),
  bar: page.locator(".timeline-bar"),
  slider: seekSlider(page),
});
/** The peak marker's own instant (UTC ms), or null. */
export const windowPeakTimeMs = async (page) => Number(await page.locator(HOOK.windowPeak).evaluate((button) => button.dataset.timeUtcMs ?? 0)) || null;
/** Presses the window's peak marker: seeks to the peak and opens the window's information. */
export const goToWindowPeak = (page, options) => page.locator(HOOK.windowPeak).click(options);
/** Presses a named window's own peak button ("Go to peak of <label>"). */
export const goToNamedWindowPeak = (page, label) => page.getByRole("button", { name: `Go to peak of ${label}` }).click();
/** Opens a window's information from its button in the Events list. */
export const openNamedWindowInfo = async (page, label) => (await reveal(page, page.getByRole("button", { name: `Information about ${label}` }))).click();
// ---------------------------------------------------------------------------------------------------------------------------------------------
// Bodies, information, camera
// ---------------------------------------------------------------------------------------------------------------------------------------------

const bodyPicker = (page) => page.getByLabel("Select object");
const revealedBodyPicker = async (page) => reveal(page, bodyPicker(page));

/** Picks a body (or other object) in the Object list by its id. */
export const pickBody = async (page, id) => (await revealedBodyPicker(page)).selectOption(id);
/** Picks the first entry of the Object list. */
export const pickFirstBody = async (page) => (await revealedBodyPicker(page)).selectOption({ index: 0 });
/** The id of the picked object. */
export const pickedBody = (page) => bodyPicker(page).inputValue();
/** The ids the Object list holds, in order. */
export const bodyOptions = (page) => bodyPicker(page).evaluate((select) => [...select.options].map((option) => option.value));
/** The Object list's entries, with their labels and whether each can be picked now. */
export const bodyOptionDetails = (page) => bodyPicker(page).evaluate((select) => [...select.options].map((option) => ({ value: option.value, label: option.textContent.trim(), disabled: option.disabled })));
/** How many entries the Object list holds for this id (0 or 1). */
export const bodyOptionCount = (page, id) => bodyPicker(page).locator(`option[value="${id}"]`).count();
/** Waits until the Object list entry is available or unavailable at the clock's instant. */
export const waitForBodyAvailability = (page, id, available) => page.waitForFunction(([body, wanted]) => {
  const option = [...document.querySelectorAll('select[aria-label="Select object"] option')].find((o) => o.value === body);
  return option !== undefined && option.disabled === !wanted;
}, [id, available]);
export async function bodyAvailable(page, id) { return bodyPicker(page).evaluate((select, body) => { const option = [...select.options].find((o) => o.value === body); return option !== undefined && !option.disabled; }, id); }
/** Waits for the Object list to be on the page. */
/** Waits for the Object list to be on the page (on a phone it sits in the closed top drawer, so attached, not necessarily showing). */
export const waitForBodyPicker = (page, options) => bodyPicker(page).waitFor({ state: "attached", ...options });
/** The Object list's entries that can be picked now: `{value, text}` each. */
export const pickableBodies = (page) => bodyPicker(page).evaluate((element) => [...element.options].filter((option) => !option.disabled).map((option) => ({ value: option.value, text: option.textContent.trim() })));
/** What the Object list says about one entry: the span it is available over (UTC ms), whether it is disabled, its text. */
export const bodyOptionInfo = (page, id) => bodyPicker(page).locator(`option[value="${id}"]`).evaluate((option) => ({
  from: Number(option.getAttribute("data-available-from")),
  to: Number(option.getAttribute("data-available-to")),
  disabled: option.disabled,
  text: option.textContent,
}));
/** Waits until the page has fallen back to the overview with Earth picked and this object unavailable (the clock left the object's span while it was followed). */
export const waitForFallbackToOverview = (page, unavailableId) => page.waitForFunction((id) => document.querySelector('select[aria-label="Select object"]').value === "earth"
  && [...document.querySelectorAll("option")].find((o) => o.value === id).disabled
  && document.querySelector('[data-camera-preset="overview"]').getAttribute("aria-pressed") === "true", unavailableId);
/** The first listed object that can be picked now, or null. */
export const firstPickableBody = (page, exclude = []) => bodyPicker(page).evaluate((select, skip) => [...select.options].find((o) => !o.disabled && !skip.includes(o.value))?.value ?? null, exclude);

/** The information panel, for reading (text, counts). */
export const infoPanel = (page) => page.locator(HOOK.infoPanel);
export const infoOpen = async (page) => (await page.locator(HOOK.infoPanel).count()) > 0;
export const infoPanelFor = (page, id) => page.locator(`${HOOK.infoPanel}[data-info-id="${id}"]`);
export const waitForInfo = (page, options) => page.locator(HOOK.infoPanel).waitFor(options);
/** Waits for the information panel to go. */
export const waitForInfoClosed = (page) => page.locator(HOOK.infoPanel).waitFor({ state: "detached" });
/** The information panel's text with white space squeezed. */
export const infoText = async (page) => squash(await page.locator(HOOK.infoPanel).innerText());
/** Its Metric Visuals block (text) and its metric count. */
export const infoMetricsText = (page) => page.locator(`${HOOK.infoPanel} .info-panel-metrics`).innerText();
export const infoMetricCount = (page) => page.locator(`${HOOK.infoPanel} .metric`).count();
/** Presses the info toggle beside the Object list. */
export const toggleInfo = async (page) => (await reveal(page, page.locator(HOOK.infoToggle))).click();
export const focusInfoToggle = (page) => page.locator(HOOK.infoToggle).focus();
/** Opens the information for what is picked, unless it is already open. `label` is the object's name as the button announces it (a string or RegExp). */
export async function openInfo(page, label, options) {
  if (await infoOpen(page)) return;
  const name = label === undefined ? /^Info/ : label instanceof RegExp ? label : new RegExp(`^Information about ${label}$`);
  await (await reveal(page, page.getByRole("button", { name }))).first().click(options);
}
/** Opens the information through the first "Information about ..." button (for example a timeline event's). */
export const pressInformationButton = async (page, name) => (await reveal(page, page.getByRole("button", { name }))).first().click();
/** Closes the information panel when it is open. */
export async function closeInfo(page) { if (await infoOpen(page)) await page.locator(HOOK.infoClose).click(); }
/** Closes it when open, giving up quietly after 5 s. */
export async function closeInfoQuietly(page) { if (await infoOpen(page)) await page.locator(HOOK.infoClose).click({ timeout: 5000 }).catch(() => undefined); }
/** Closes it; fails when it is not open. */
export const closeInfoStrict = (page) => page.locator(HOOK.infoClose).click();
/** Closes it with the Escape key from its close button (a phone has no pointer). */
export async function closeInfoByKeyboard(page) { await page.locator(HOOK.infoClose).focus(); await page.keyboard.press("Escape"); }
/** Closes it the way the viewport suits: Escape on a phone, a press on a larger screen. */
export async function closeInfoForViewport(page) {
  if (page.viewportSize().width < 600) await closeInfoByKeyboard(page); else await closeInfoStrict(page);
}
export const focusInfoClose = (page) => infoPanel(page).getByRole("button", { name: "Close information" }).focus();
export const closeInfoByPanelButton = (page) => infoPanel(page).getByRole("button", { name: "Close information" }).click();
/** The provenance badge (a locator, for reading), pressing it, and the detail it opens. */
export const provenanceBadge = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.provenanceBadge}`);
export const provenanceBadgeText = (page) => provenanceBadge(page).innerText();
export async function openProvenance(page) {
  await provenanceBadge(page).first().click();
  await openSources(page);
}
/** The Sources section of the open information panel (a locator), whether it is open, opening and closing it (O-020 Decision 4: closed by default). */
export const sourcesSection = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.sourcesSection}`);
export const sourcesOpen = (page) => sourcesSection(page).evaluate((element) => element.open);
export async function openSources(page) { if (!(await sourcesOpen(page))) await sourcesSection(page).locator("summary").click(); }
export async function closeSources(page) { if (await sourcesOpen(page)) await sourcesSection(page).locator("summary").click(); }
/** The Sources lines in the information panel, read whether the section is open or closed. */
export const sourceLines = (page) => sourcesSection(page).locator("li").allTextContents();
export const provenanceDetail = (page) => page.locator(`${HOOK.infoPanel} ${HOOK.provenanceDetail}`);
export const provenanceDetailText = async (page) => squash(await provenanceDetail(page).innerText());
export const provenanceDetailRaw = (page) => provenanceDetail(page).innerText();
export const provenanceDetailContent = (page) => provenanceDetail(page).textContent();
export const provenanceDetailVisible = (page) => provenanceDetail(page).isVisible();

/** Presses the button on a body that selects its related object (for example an orbit line). */
export const pressRelatedObject = async (page, id) => (await reveal(page, page.locator(`[data-related-object="${id}"]`))).click();
export const relatedObject = (page, id) => page.locator(`[data-related-object="${id}"]`);
/** Picks a body, then selects an orbit line the Object list no longer holds through the body's related button. */
export async function selectOrbit(page, bodyId, orbitId) {
  await pickBody(page, bodyId);
  await pressRelatedObject(page, orbitId);
}

/** Chooses a camera by its preset id (for example "overview", "focus-columbia", "follow-moon", "whole-orbit"). */
export const chooseCamera = async (page, presetId) => (await reveal(page, page.locator(`[data-camera-preset="${presetId}"]`))).click();
/** Whether a camera preset is offered. */
export const cameraOffered = async (page, presetId) => (await page.locator(`[data-camera-preset="${presetId}"]`).count()) > 0;
/** Whether a camera preset is the one in force. */
export const cameraActive = async (page, presetId) => (await page.locator(`[data-camera-preset="${presetId}"]`).getAttribute("aria-pressed")) === "true";
/** Waits for the camera in force to be this preset. */
export const waitForCamera = (page, presetId) => page.waitForFunction((id) => document.querySelector(`[data-camera-preset="${id}"]`)?.getAttribute("aria-pressed") === "true", presetId);
/** Picks a body and aims the camera at it with a preset, closing its information (the usual set-up for a picture). */
export async function pickBodyWithCamera(page, bodyId, presetId) {
  await pickBody(page, bodyId);
  await closeInfo(page);
  await chooseCamera(page, presetId);
}

/** Focuses the first marker on the timeline; whether it then shows its label. */
export const focusFirstTimelineMarker = (page) => page.locator(".timeline-marker").first().focus();
export const firstTimelineMarkerLabelVisible = (page) => page.locator(".timeline-marker").first().locator(".timeline-marker-label").isVisible();

/** Labels the scene draws, for reading. */
export const sceneLabel = (page, id) => page.locator(`[data-label-id="${id}"]`);
export const shownSceneLabelIds = (page) => page.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId));
export const sceneLabelVisible = (page, id) => page.locator(`[data-label-id="${id}"]`).isVisible();
/** The boxes of the scene labels showing, as `{left, top, right, bottom}`. */
export const visibleSceneLabelBoxes = (page) => page.locator(".scene-object-label:visible").evaluateAll((elements) => elements.map((element) => {
  const { left, top, right, bottom } = element.getBoundingClientRect();
  return { left, top, right, bottom };
}));
/** Hides the scene's text labels while a picture is taken, and brings them back. */
export const hideSceneLabels = (page) => page.evaluate((hook) => { for (const el of document.querySelectorAll(hook)) el.style.visibility = "hidden"; }, HOOK.sceneLabels);
export const showSceneLabels = (page) => page.evaluate((hook) => { for (const el of document.querySelectorAll(hook)) el.style.visibility = ""; }, HOOK.sceneLabels);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The developer drawer
// ---------------------------------------------------------------------------------------------------------------------------------------------

const developerButton = (page) => page.getByRole("button", { name: "Developer mode" });

/** Opens or closes the developer drawer. */
export const toggleDeveloper = (page) => developerButton(page).click();
export const developerButtonCount = (page) => developerButton(page).count();
export const developerOpen = async (page) => (await developerButton(page).getAttribute("aria-pressed")) === "true";
export async function openDeveloper(page) {
  if (await developerOpen(page)) return;
  await toggleDeveloper(page);
  // Park the pointer off the controls so no control is read in its hover state (the orbit-look picture sums were sensitive to it).
  await page.mouse.move(5, 500);
}
export async function closeDeveloper(page) { if (await developerOpen(page)) await toggleDeveloper(page); }
/** Presses the drawer's button from inside the page (a phone drawer covers some controls). */
export const pressDeveloperNow = (page) => developerButton(page).evaluate((element) => element.click());
export const developerPanel = (page) => page.locator(HOOK.developerPanel);
export const missionPanel = (page) => page.locator(HOOK.missionPanel);
export const missionReadouts = (page) => page.locator(".mission .readout").allTextContents();
export const waitForMission = (page) => page.locator(HOOK.missionPanel).waitFor();
/** One metric visual by its data id, and the readouts inside the drawer. */
export const metric = (page, id) => page.locator(`[data-metric="${id}"]`);
export const missionMetricSvg = (page, kind) => page.locator(`.mission .metric-${kind} svg[role="img"]`);
export const missionRadars = (page) => page.locator('.mission [data-metric$="-position"] svg.metric-radar');
/** The metrics that overflow their box at the current width (their data ids). */
export const overflowingMetrics = (page) => page.evaluate(() => [...document.querySelectorAll(".metric")]
  .filter((metric) => metric.getBoundingClientRect().right > window.innerWidth + 0.5 || metric.scrollWidth > metric.clientWidth + 1)
  .map((metric) => metric.getAttribute("data-metric")));
export const instrumentMetrics = (page) => page.locator(".scientific-instruments .metric");
export const missionMetrics = (page, kind) => page.locator(`.mission .metric-${kind}`);
export const advancedReadouts = (page) => ({ summary: page.locator(".advanced-readouts summary"), list: page.locator("dl.overlay") });
export const openAdvancedReadouts = (page) => page.locator(".advanced-readouts summary").click();
/** A drawer section, for a picture. */
export const drawerSection = (page, which) => {
  const hooks = { telemetry: ".hud-section:has(#developer-telemetry-heading)", scene: ".hud-section:has(#developer-scene-heading)", journey: ".hud-section-clock" };
  return page.locator(hooks[which]);
};
export const scrollDrawerToTelemetry = (page) => page.locator(HOOK.developerPanel).evaluate((panel) => { panel.scrollTop = panel.querySelector("#developer-telemetry-heading").offsetTop - 8; });

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
};
const toggle = (page, id) => { assert.ok(TOGGLES[id], `driver: unknown toggle ${id}`); return page.getByRole("button", { name: TOGGLES[id], exact: true }); };
export const pressToggle = (page, id) => toggle(page, id).click();
export const pressToggleNow = (page, id) => toggle(page, id).evaluate((element) => element.click());
export const toggleOn = async (page, id) => (await toggle(page, id).getAttribute("aria-pressed")) === "true";
export const toggleVisible = (page, id) => toggle(page, id).isVisible();
export const toggleCount = (page, id) => toggle(page, id).count();

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
  "glow-curve": ["Timeline glow curve", "glow-curve-value"],
  "glow-floor": ["Timeline played floor", "glow-floor-value"],
  "glow-thickness": ["Timeline glow thickness", "glow-thickness-value"],
  "glow-halo": ["Timeline glow halo", "glow-halo-value"],
};
const slider = (page, id) => { assert.ok(SLIDERS[id], `driver: unknown slider ${id}`); return page.getByRole("slider", { name: SLIDERS[id][0] }); };
export const setSlider = (page, id, value) => slider(page, id).fill(String(value));
/** Moves a drawer slider by setting its value and firing the input event (as a drag would), for sliders `fill` cannot drive. */
export const dragSlider = (page, id, value) => slider(page, id).evaluate((element, v) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, String(v));
  element.dispatchEvent(new Event("input", { bubbles: true }));
}, value);
export const sliderValue = (page, id) => slider(page, id).inputValue();
export const sliderCount = (page, id) => slider(page, id).count();
export const sliderReadout = (page, id) => page.getByTestId(SLIDERS[id][1]).innerText();

/** Waits for the developer drawer's "Orbit lines" settings group to show. */
export const waitForOrbitLines = (page, options) => page.getByRole("group", { name: "Orbit lines" }).waitFor(options);
/** Presses "Reset orbit lines" in the drawer. */
export const resetOrbitLines = (page) => page.getByRole("button", { name: "Reset orbit lines" }).click();

/** Presses the first enabled control of a kind from inside the page ("scale", "overview", "focus", "follow"); false when there is none. */
export async function pressFirstControlNow(page, kind) {
  const hooks = { scale: page.getByRole("button", { name: /^Scale: / }), overview: page.locator('[data-camera-preset="overview"]'), focus: page.locator('[data-camera-preset^="focus-"]'), follow: page.locator('[data-camera-preset^="follow-"]') };
  assert.ok(hooks[kind], `driver: unknown control kind ${kind}`);
  const button = hooks[kind].first();
  if ((await button.count()) === 0 || !(await button.isEnabled())) return false;
  await button.evaluate((element) => element.click());
  return true;
}

/** A story-panel setting in the drawer: the group, and its pause readout. */
export const storySettings = (page) => page.getByRole("group", { name: "Story panels" });
/** The orbit-set switch in the drawer ("All orbits" / "Reliable only", with counts) and the source switch ("Orbits from ..."). */
/** Presses an orbit-set button ("all" or "reliable"); whether one is the set in force. */
const ORBIT_SETS = { all: /^All orbits/, reliable: /^Reliable only/ };
export const orbitSetPressed = async (page, which) => (await page.getByRole("button", { name: ORBIT_SETS[which] }).getAttribute("aria-pressed")) === "true";
export const orbitSetButtons = (page) => page.getByRole("button", { name: /^(All orbits|Reliable only)/ });
export const orbitSourceButtons = (page) => page.getByRole("button", { name: /^Orbits from/ });
/** Presses an orbit-set button by its exact label and waits for the page to reload with the matching URL query. */
export const pressOrbitSetAndWait = (page, which, urlPattern) => Promise.all([page.waitForURL(urlPattern), page.getByRole("button", { name: ORBIT_SETS[which] }).click()]);
/** The camera view readout and link in the drawer. */
export const viewValuesText = (page) => page.getByTestId("view-values").innerText();
export const copyViewLink = (page) => page.getByRole("button", { name: "Copy view link" }).click();
export const viewLinkValue = (page) => page.getByTestId("view-link").inputValue();
export const viewLinkNote = (page) => page.locator(".view-link-field span").innerText();
/** The frame-rate readout and graph in the drawer. */
export const frameRate = (page) => page.getByTestId("frame-rate");

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Story panels
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The open story panel (or the one with this id), for reading. */
export const storyPanel = (page, id) => id === undefined ? page.locator(HOOK.storyPanel) : page.locator(`${HOOK.storyPanel}[data-panel-id="${id}"]`);
export const waitForStoryPanel = (page, id, options) => storyPanel(page, id).waitFor(options);
export const openStoryPanelIds = (page) => page.locator(HOOK.storyPanel).evaluateAll((els) => els.map((el) => el.dataset.panelId));
export const storyPanelBadge = (page) => page.locator(`${HOOK.storyPanel} .story-badge`).getAttribute("data-badge");
/** Whether the scene's story marker carrying this panel is pressed (one of its panels open). */
export const sceneStoryMarkerPressed = async (page, id) => (await sceneStoryMarker(page, id).getAttribute("aria-pressed")) === "true";
export const storyPanelSources = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} li`).count();
/** The story panel's Sources section: whether it is open, and opening it with one tap. */
export const storySourcesOpen = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection}`).evaluate((element) => element.open);
export const openStorySources = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} summary`).click();
/** The story panel's one folded section: how many there are, its label, its details paragraphs (read open or closed), and folding it away. */
export const storySectionCount = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection}`).count();
export const storySectionLabel = async (page) => (await page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} summary`).innerText()).replace(/\s+/g, " ").trim();
export const storyPanelDetails = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} .sources-details p`).allTextContents();
/** The story panel's details paragraphs a person can see right now: none while the section is folded, all of them once it is open. */
export const storyPanelDetailsShown = (page) => page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} .sources-details p`).evaluateAll((els) => els.filter((el) => el.checkVisibility()).map((el) => el.textContent));
export const closeStorySources = async (page) => { if (await storySourcesOpen(page)) await page.locator(`${HOOK.storyPanel} ${HOOK.sourcesSection} summary`).click(); };
export const storyPanelHandleVisible = (page) => page.locator(`${HOOK.storyPanel} .sheet-handle`).isVisible();
export const storyPanelBox = (page) => page.locator(HOOK.storyPanel).boundingBox();
export const storyPanelBadgeElement = (page) => page.locator(`${HOOK.storyPanel} .story-badge`);
/** The timeline's story-panel markers (a locator, for counts and attributes). */
export const storyMarkers = (page, id) => id === undefined ? page.locator(HOOK.storyMarker) : page.locator(`${HOOK.storyMarker}[data-panel-id="${id}"]`);
/** The id of the first story-panel marker on the timeline. */
export const firstStoryMarkerId = (page) => storyMarkers(page).first().getAttribute("data-panel-id");
/** Presses a story panel's marker on the timeline. */
export const openStoryPanel = (page, id, options) => storyMarkers(page, id).click(options);
/**
 * The scene marker that carries a panel. Panels naming the same object share one marker (I-031); its
 * `data-panel-ids` lists them in time order.
 */
export const sceneStoryMarker = (page, id) => page.locator(`.story-marker[data-panel-ids~="${id}"]`);
/** The panel ids one scene marker carries, in time order. */
export const sceneStoryMarkerPanelIds = async (page, id) => ((await sceneStoryMarker(page, id).getAttribute("data-panel-ids")) ?? "").split(" ").filter(Boolean);
/** Presses the scene marker carrying a panel once (a shared marker opens the panel the clock has reached, or the next after the open one). */
export const pressSceneStoryMarkerOnce = (page, id) => sceneStoryMarker(page, id).click();
/** Presses the scene marker carrying a panel until that panel is open (at most once per panel on the marker); fails when it never opens. */
export async function pressSceneStoryMarker(page, id) {
  const count = (await sceneStoryMarkerPanelIds(page, id)).length;
  for (let press = 0; press < Math.max(count, 1); press += 1) {
    await sceneStoryMarker(page, id).click();
    const opened = await page.locator(`${HOOK.storyPanel}[data-panel-id="${id}"]`).waitFor({ timeout: 2000 }).then(() => true, () => false);
    if (opened) return press + 1;
  }
  throw new Error(`the scene marker never opened story panel ${id}`);
}
/** Closes the open story panel; fails when none is open. */
export const closeStoryPanel = (page) => page.getByRole("button", { name: "Close story panel" }).click();
/** Closes the story panel when one is open (no wait when none). */
export async function closeStoryPanelIfPresent(page) { const close = page.getByRole("button", { name: "Close story panel" }); if (await close.count()) await close.click(); }
/** The seek slider's position as an ISO instant. */
export const seekPositionIso = (page) => seekSlider(page).evaluate((input) => new Date(Number(input.value)).toISOString());
/** Closes a story panel if one is open, quickly. */
export const closeStoryPanelIfOpen = (page, timeout = 1500) => page.locator(".story-panel-close").click({ timeout }).catch(() => {});
export const closeStoryPanelNow = (page) => page.evaluate(() => { for (const b of document.querySelectorAll('button[aria-label="Close story panel"]')) b.click(); });
/** Closes any open panel (story or information) from inside the page, whatever is covering it. */
export const closeAllPanelsNow = (page) => page.evaluate(() => { for (const b of document.querySelectorAll('button[aria-label="Close story panel"], #info-panel .info-panel-close')) b.click(); });

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The Scale control, as the top bar presents it (a toggle for two scales, a menu for three, nothing at all for one scale) and its ⓘ explanation
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The label a scale id carries in the top bar. */
const SCALE_LABELS = { "true-scale": "True", "readable-scale": "Readable", "solar-system": "Solar system" };
const scaleControl = (page) => page.locator(".scale-control");
const scaleTrigger = (page) => scaleControl(page).locator("button.scale-toggle");

/** The id of the scale in force (for example "true-scale"). */
export const currentScale = async (page) => ((await hasScaleControl(page)) ? scaleControl(page).getAttribute("data-scale-current") : null);
/** Whether the top bar shows a scale control at all (an experience with one scale shows none). */
export const hasScaleControl = async (page) => (await scaleControl(page).count()) > 0;
/** The ids the control offers, in order; empty when there is no control (one scale). */
export const scaleOptions = async (page) => ((await hasScaleControl(page)) ? (await scaleControl(page).getAttribute("data-scale-options")).split(",") : []);
/** Whether the control offers the scale with this label. */
export const offersScale = async (page, label) => (await scaleOptions(page)).some((id) => SCALE_LABELS[id] === label);
/** Chooses a scale by its label ("True", "Readable" or "Solar system"), whichever form the control takes; a no-op when it is already in force. */
export async function chooseScale(page, label) {
  if (!(await hasScaleControl(page))) {
    // One scale, so no control: only True is ever in force there.
    if (label === "True") return;
    throw new Error(`there is no scale control here (one scale, True), so the ${label} scale cannot be chosen`);
  }
  const control = scaleControl(page);
  const trigger = scaleTrigger(page);
  await reveal(page, trigger);
  if ((await trigger.getAttribute("data-scale-label")) === label) return;
  if ((await trigger.getAttribute("aria-haspopup")) === "menu") {
    await trigger.click();
    await control.getByRole("menuitemradio", { name: label, exact: true }).click();
  } else {
    await trigger.click();
  }
  const now = SCALE_LABELS[await currentScale(page)];
  if (now !== label) throw new Error(`could not choose the ${label} scale (now ${now})`);
}
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
  if (!offered.includes(scaleId)) throw new Error(`driver: the experience does not offer scale "${scaleId}" (it offers ${offered.join(", ")}); the address would fall back silently`);
  const now = (await hasScaleControl(page)) ? await currentScale(page) : "true-scale";
  if (now !== scaleId) throw new Error(`driver: asked for scale "${scaleId}" but "${now}" is in force`);
}
/** The toggle's accessible name and tooltip (it states the scale in force and what a press does). */
export const scaleToggleName = (page) => scaleControl(page).locator(".scale-toggle").getAttribute("aria-label");
export const scaleToggleTitle = (page) => scaleControl(page).locator(".scale-toggle").getAttribute("title");

/** The ⓘ button beside the scale control: its accessible name, its box (for the touch-target rule), and the explanation it opens. */
const scaleInfo = (page) => scaleControl(page).locator("button.scale-info");
export const hasScaleExplanation = async (page) => (await scaleInfo(page).count()) > 0;
export const scaleInfoName = (page) => scaleInfo(page).getAttribute("aria-label");
export const scaleInfoBox = async (page) => (await reveal(page, scaleInfo(page))).boundingBox();
export const scaleInfoOpen = async (page) => (await scaleInfo(page).getAttribute("aria-expanded")) === "true";
/** Presses the ⓘ once (opens the explanation, or closes it when open). */
export const pressScaleInfo = async (page) => (await reveal(page, scaleInfo(page))).click();
/** Presses the ⓘ from inside the page (for a phone, where the developer panel can cover it). */
export const pressScaleInfoNow = async (page) => (await reveal(page, scaleInfo(page))).evaluate((element) => element.click());
/** The explanation's text when it is showing, else null. */
export async function scaleExplanationText(page) {
  const panel = scaleControl(page).locator(".scale-explanation-panel");
  return (await panel.isVisible()) ? panel.innerText() : null;
}

/** The Scale menu on its own (the isolated harness page `harness/scale-menu.html`): open, read, move with the keyboard, close. */
export function scaleMenu(page) {
  const trigger = page.locator(".scale-menu-trigger");
  return {
    waitForTrigger: () => page.waitForSelector(".scale-menu-trigger"),
    open: () => trigger.click(),
    openByKey: (key) => trigger.press(key),
    isOpen: () => page.locator(".scale-menu").isVisible(),
    expanded: () => trigger.getAttribute("aria-expanded"),
    chosenLabel: () => trigger.getAttribute("data-scale-label"),
    triggerName: () => trigger.getAttribute("aria-label"),
    focusedScale: () => page.evaluate(() => document.activeElement.dataset.scale),
    triggerFocused: () => page.evaluate(() => document.activeElement.className.includes("scale-menu-trigger")),
    key: (name) => page.keyboard.press(name),
    chooseItem: (label) => page.getByRole("menuitemradio", { name: label, exact: true }).click(),
    pressOutside: () => page.click("#outside"),
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Scene readouts the driver does not hide: the canvas and its data attributes are read directly by scripts.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The scene canvas (pictures and its `data-*` readouts). */
export const sceneCanvas = (page) => page.getByTestId("earth-moon-canvas");
/** The anchor-label layer: whether it is hidden, how many labels it holds, how many are on screen. */
export const anchorLayerHidden = async (page) => (await page.locator(HOOK.anchorLabels).getAttribute("hidden")) !== null;
export const anchorLabelCount = (page) => page.locator(`${HOOK.anchorLabels} .anchor-label`).count();
export async function visibleAnchorLabelCount(page) {
  if (await anchorLayerHidden(page)) return 0;
  return page.locator(`${HOOK.anchorLabels} .anchor-label:not([hidden])`).count();
}
export const waitForAnchorLayer = (page, hidden) => page.waitForFunction(([hook, wanted]) => document.querySelector(hook)?.hasAttribute("hidden") === wanted, [HOOK.anchorLabels, hidden]);
/** Waits for a drawn line in the frame-rate graph. */
export const waitForFrameGraphLine = (page, options) => frameRate(page).locator(".fps-graph line.tone-good, .fps-graph line.tone-warn, .fps-graph line.tone-bad").first().waitFor(options);

// Layout measurements of the shell (what a viewer sees fit or not fit; the selectors are the shell's structure, kept here).

/** The bounds of the shell's main parts that are showing: `{selector, left, top, right, bottom}` each. */
export const shellBounds = async (page) => { await drawersSettled(page); return page.evaluate(() => {
  const selectors = [".shell-toolbar", ".developer-mode-toggle", ".timeline-bar", "#info-panel"];
  return selectors.flatMap((selector) => {
    const element = document.querySelector(selector);
    if (!element || getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden") return [];
    const rect = element.getBoundingClientRect();
    return [{ selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
  });
}); };

/** Every primary control that is showing, with its height: `{selector, label, height}` each (for the touch-target rule). */
export const primaryControlTargets = async (page) => {
  const wasOpen = (await drawerStates(page)).controls;
  await openControlsDrawer(page);
  await drawersSettled(page);
  const targets = await page.evaluate(() => {
  const selectors = [
    ".object-controls button",
    ".object-controls select",
    ".scale-control button",
    ".info-panel button",
    ".timeline-transport button",
    ".timeline-speed select",
    ".timeline-event-list summary",
    '.timeline-track input[type="range"]',
  ];
  return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    })
    .map((element) => ({ selector, label: element.getAttribute("aria-label") ?? element.textContent.trim(), height: element.getBoundingClientRect().height })));
  });
  if (!wasOpen) await closeControlsDrawer(page);
  return targets;
};

// The home page (not the shell): its experience cards.

/** The addresses the home page's experience cards link to. */
export const homeDemoLinks = (page) => page.locator("a.demo").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
/** The sources of card pictures that did not load. */
export const homeBrokenPictures = (page) => page.locator("a.demo img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute("src")));

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The phone layout and the shared control look (T-081, O-020)
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Whether each phone drawer is open: `{controls, timeline}`; both false on a larger screen. */
export async function drawerStates(page) {
  const open = async (hook) => (await page.locator(hook).count()) > 0 && (await page.locator(hook).getAttribute("aria-expanded")) === "true";
  return { controls: await open(HOOK.controlsPill), timeline: await open(HOOK.timelineHandle) };
}
/** The name on the pill (the picked object's name), or null on a larger screen. */
export async function controlsPillName(page) {
  const pill = page.locator(HOOK.controlsPill);
  return (await pill.count()) > 0 ? (await pill.innerText()).trim() : null;
}
/** Boxes of the parts of the phone layout, for reading: pill, top drawer, timeline bar, timeline handle, play button. */
export const phoneBoxes = async (page) => { await drawersSettled(page); return page.evaluate(({ pill, drawer, handle, controlsHandle }) => {
  const box = (selector) => { const element = document.querySelector(selector); if (element === null) return null; const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  return { pill: box(pill), drawer: box(drawer), bar: box(".timeline-bar"), handle: box(handle), controlsHandle: box(controlsHandle), play: box(".timeline-play"), cog: box(".developer-mode-toggle"), sheet: box("#info-panel"), story: box(".story-panel") };
}, { pill: HOOK.controlsPill, drawer: HOOK.controlsDrawer, handle: HOOK.timelineHandle, controlsHandle: HOOK.controlsHandle }); };

/** Presses the pill and the handles (a tap). */
export const tapPill = (page) => page.locator(HOOK.controlsPill).click();
export const tapControlsHandle = (page) => page.locator(HOOK.controlsHandle).click();
export const tapTimelineHandle = (page) => page.locator(HOOK.timelineHandle).click();
/** Waits until a drawer has finished moving to the open or closed state. */
export const waitForDrawer = (page, which, open) => page.waitForFunction(([hook, wanted]) => {
  const element = document.querySelector(hook);
  return element !== null && element.getAttribute("data-open") === String(wanted) && element.getAnimations().every((a) => a.playState !== "running");
}, [which === "controls" ? HOOK.controlsDrawer : HOOK.timelineDrawer, open]);

/** One finger drag with real touch events (so the page sees what a phone would send): from a point to a point in steps. */
async function touchDrag(page, from, to, steps = 8) {
  const client = await page.context().newCDPSession(page);
  const point = (p) => [{ x: p.x, y: p.y, id: 1 }];
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(from) });
  for (let i = 1; i <= steps; i += 1) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point({ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }) });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
const centreOf = async (locator) => { const box = await locator.boundingBox(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; };
/** Swipes from a drawer's handle (or the pill) by `dy` pixels (negative: up). */
async function swipeFrom(page, locator, dy) {
  const from = await centreOf(locator);
  await touchDrag(page, from, { x: from.x, y: from.y + dy });
}
export const swipePillDown = (page, dy = 120) => swipeFrom(page, page.locator(HOOK.controlsPill), dy);
export const swipeControlsHandleUp = (page, dy = 120) => swipeFrom(page, page.locator(HOOK.controlsHandle), -dy);
export const swipeTimelineHandleUp = (page, dy = 120) => swipeFrom(page, page.locator(HOOK.timelineHandle), -dy);
export const swipeTimelineHandleDown = (page, dy = 120) => swipeFrom(page, page.locator(HOOK.timelineHandle), dy);
/** A drag on the scene itself, in every direction a drawer swipe could be mistaken for (a touch drag on the canvas, away from every control). */
export async function dragOnScene(page) {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  for (const [dx, dy] of [[0, 160], [0, -160], [120, 0]]) await touchDrag(page, { x, y }, { x: x + dx, y: y + dy });
}
/** A touch swipe down on the open information sheet, from its top edge (it dismisses the sheet). */
export async function swipeInfoSheetDown(page, dy = 160) {
  const box = await page.locator(HOOK.infoPanel).boundingBox();
  await touchDrag(page, { x: box.x + box.width / 2, y: box.y + 14 }, { x: box.x + box.width / 2, y: box.y + 14 + dy });
}
/** Whether the page scrolls sideways. */
export const scrollsSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1);
/** The story panel is open and its box does not overlap the timeline's Play button. */
export const storyPanelClearOfPlay = async (page) => { const { story, play } = await phoneBoxes(page); return story !== null && play !== null && story.bottom <= play.top + 0.5; };
/** The viewer's own time and the playing state, to prove a drawer swipe leaves them alone. */
export const clockAndPlaying = async (page) => ({ time: await clockIso(page), playing: await isPlaying(page) });
/** The open information panel's Sources section is closed (the default). */
export const infoSourcesClosed = async (page) => !(await sourcesOpen(page));
/** The speed slider in the timeline drawer: position and the playback speed the select holds. */
export const speedSliderValue = (page) => page.getByLabel("Speed slider").inputValue();
export const setSpeedSlider = async (page, index) => {
  await openTimelineDrawer(page);
  await page.getByLabel("Speed slider").evaluate((input, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, index);
};

/**
 * Every control showing that takes its look from the shared stylesheet (`controls.css`), with the computed values that make up that look and its box.
 * Left out on purpose: the developer panel (its own tool), the timeline's and the scene's event markers (marks on a track, not controls), and
 * anything not showing. `kind` is dropdown, icon, row, bare or button; `variant` names the deliberate differences (ghost, accent, pill, selected).
 */
export const controlStyles = async (page) => {
  await drawersSettled(page);
  // A control under the pointer shows its hover state; read the resting look.
  await page.mouse.move(0, page.viewportSize().height / 2);
  return page.evaluate(() => {
  const selector = ".astraeus-shell button, .astraeus-shell select, .astraeus-shell summary.ui-button";
  const shown = (element) => {
    if (element.closest(".developer-tools, .timeline-markers, .story-markers, .scene-labels, .anchor-labels") !== null) return false;
    if (!element.checkVisibility({ checkVisibilityCSS: true })) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
  };
  return [...document.querySelectorAll(selector)].filter(shown).map((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const has = (name) => element.classList.contains(name);
    const kind = element.tagName === "SELECT" ? "dropdown" : has("ui-bare") ? "bare" : has("ui-row") ? "row" : has("ui-icon") ? "icon" : "button";
    const selected = element.matches('[aria-pressed="true"], [aria-expanded="true"], [aria-checked="true"], [aria-current]');
    const variant = [has("ui-ghost") && "ghost", has("ui-accent") && "accent", has("ui-pill") && "pill", selected && "selected", element.disabled === true && "disabled"].filter(Boolean).join("+");
    return {
      name: element.getAttribute("aria-label") ?? (element.textContent ?? "").trim().slice(0, 30),
      kind,
      variant,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      look: {
        minHeight: style.minHeight,
        ...(kind === "row" || kind === "bare" ? {} : { height: style.height }),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
        borderTopStyle: style.borderTopStyle,
        borderRadius: style.borderTopLeftRadius,
        arrow: element.tagName === "SELECT" ? style.backgroundImage : "",
        paddingRight: element.tagName === "SELECT" ? style.paddingRight : "",
      },
    };
  });
}); };
/** The transition the top drawer carries (for example "0.24s", or "0s" under reduced motion or with the animation setting at 0). */
export const drawerTransition = (page) => page.locator(HOOK.controlsDrawer).evaluate((element) => getComputedStyle(element).transitionDuration.split(",")[0].trim());
/** Whether the object list, the speed slider and the opened sources are showing (a drawer or a Sources section may hide them). */
export const objectListShown = (page) => bodyPicker(page).isVisible();
export const speedSliderShown = (page) => page.getByLabel("Speed slider").isVisible();
export const infoSourceLinesShown = (page) => sourcesSection(page).locator("li").first().isVisible();
/** The phone layout's live settings in the developer panel (Display settings > Phone layout), by the name each slider carries. */
export const PHONE_LAYOUT_SLIDERS = ["Phone drawer animation", "Phone top drawer height", "Phone timeline drawer height", "Phone sheet height", "Phone swipe distance"];
export const phoneSettingShown = (page, name) => page.getByRole("slider", { name }).isVisible();
export const setPhoneSetting = (page, name, value) => page.getByRole("slider", { name }).fill(String(value));
