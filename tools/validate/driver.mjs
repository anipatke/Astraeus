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
  bootLoader: "#boot",
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
  // Wait for each drawer to finish sliding after opening it, so a size or position read afterwards is the settled one (a busy machine
  // used to measure the scale ⓘ mid-slide, smaller than 44 px).
  await openControlsDrawer(page);
  await drawersSettled(page);
  if (await locator.first().isVisible()) return locator;
  await openTimelineDrawer(page);
  await drawersSettled(page);
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
export const openCurrentEventInfo = async (page) => (await reveal(page, page.locator(HOOK.currentEventButton).first())).click();
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
export async function closeInfoStrict(page) {
  const close = page.locator(HOOK.infoClose);
  // With the developer panel open and every group expanded (the driver does that), its box can cover the sheet's Close; then press it from inside the page.
  try { await close.click({ timeout: 3000 }); } catch (error) { if (!/intercepts pointer events/.test(String(error?.message))) throw error; await close.evaluate((element) => element.click()); }
}
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

/** The developer panel's own folds only (never the moons panel's, which share the fold control). */
const devFolds = (page) => page.locator("[data-developer-panel] [data-fold-toggle]");
const developerButton = (page) => page.getByRole("button", { name: "Developer mode" });

/**
 * Opens every fold in the developer panel, nested ones included (T-090: the panel's groups start closed except the first, and remember how a viewer
 * left them). Scripts reach a control by name; the driver opens the groups first so no script has to know the panel's layout.
 */
export async function expandDeveloperGroups(page) {
  const closed = page.locator('[data-developer-panel] [data-fold-toggle][aria-expanded="false"]');
  await devFolds(page).first().waitFor({ timeout: 10000 });
  for (let guard = 0; guard < 30 && (await closed.count()) > 0; guard++) await closed.first().evaluate((element) => element.click());
}
/** Whether a group (fold) of the developer panel is open, by its id ("demo", "camera", "timeline", "orbit-lines", "orbit-fine-tune", "sky-sun", "labels", "phone-layout", "under-the-hood"). */
export const developerGroupOpen = async (page, id) => (await page.locator(`[data-developer-panel] [data-fold-toggle="${id}"]`).getAttribute("aria-expanded")) === "true";
/** The ids of the developer panel's groups, in order, with whether each is open. */
export const developerGroups = (page) => devFolds(page).evaluateAll((els) => els.map((el) => ({ id: el.dataset.foldToggle, open: el.getAttribute("aria-expanded") === "true", label: el.textContent.trim(), height: el.getBoundingClientRect().height })));
/** Opens or closes the developer drawer; an opened drawer has all its groups opened. */
export async function toggleDeveloper(page, { expand = true } = {}) {
  await developerButton(page).click();
  if (await developerOpen(page)) {
    if (expand) await expandDeveloperGroups(page);
    else await devFolds(page).first().waitFor({ timeout: 10000 });
  }
}
/** Opens or closes one group of the developer panel (by id) the way a viewer would: one press on its heading. */
export const toggleDeveloperGroup = (page, id) => page.locator(`[data-developer-panel] [data-fold-toggle="${id}"]`).click();
/** Opens one group of the developer panel (by id) unless it is already open. */
export async function openDeveloperGroup(page, id) {
  if ((await page.locator(`[data-developer-panel] [data-fold-toggle="${id}"]`).getAttribute("aria-expanded")) !== "true") await toggleDeveloperGroup(page, id);
}
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
  "moon-orbits": "Moon orbits",
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
/** One path's readout by id (for example `earth-path`, `1p-orbit`), or undefined when the scene draws no such path. */
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
/** The sky as the scene reports it: star count, the star and Milky Way brightness in force, and whether the picture is on and shown. Stars is 0 when the scene has no sky. */
export async function sceneSky(page) {
  const data = await page.locator("canvas").first().evaluate((canvas) => ({ ...canvas.dataset }));
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
  return { bodies, dots: await sceneDotsInView(page), paths: (await scenePaths(page)).filter((path) => path.visible && path.inView > 0).length, stars: (await sceneSky(page)).stars };
}
/** A point on the scene canvas where the canvas itself is on top (no story marker, label or panel over it), the middle first: where a wheel or drag reaches the camera. Null when nothing is free. */
export async function freeCanvasPoint(page) {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.4], [0.4, 0.5], [0.6, 0.5], [0.5, 0.6], [0.3, 0.3], [0.7, 0.3], [0.3, 0.6]]) {
    const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
    if (await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS", point)) return point;
  }
  return null;
}
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
/** Taps the Object list (as a thumb would, opening it) without choosing anything. */
export const tapObjectPicker = async (page) => { await bodyPicker(page).click(); await page.keyboard.press("Escape"); };
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
/** The phone layout's live settings in the developer panel (the "Phone layout" group), by the name each slider carries. */
export const PHONE_LAYOUT_SLIDERS = ["Phone drawer animation", "Phone top drawer height", "Phone timeline drawer height", "Phone sheet height", "Phone swipe distance"];
export const phoneSettingShown = (page, name) => page.getByRole("slider", { name }).isVisible();
export const setPhoneSetting = (page, name, value) => page.getByRole("slider", { name }).fill(String(value));

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
  return experienceSwitch(page).evaluate((group) => ({
    name: group.getAttribute("aria-label"),
    param: group.getAttribute("data-switch-param"),
    options: [...group.querySelectorAll("[data-switch-value]")].map((button) => ({ value: button.getAttribute("data-switch-value"), label: button.textContent.trim(), active: button.getAttribute("aria-pressed") === "true" })),
  }));
}
/** Presses a switch option by its value and waits for the experience to open again (the address changes, the shell comes back). */
export async function chooseSwitchOption(page, value) {
  const param = await experienceSwitch(page).getAttribute("data-switch-param");
  const button = (await reveal(page, experienceSwitch(page).locator(`[data-switch-value="${value}"]`))).first();
  await Promise.all([page.waitForURL((address) => new URL(address).searchParams.get(param) === value), button.click()]);
  await page.waitForSelector("canvas");
  await waitForShell(page);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Loading screen (T-094): app.html carries a loader (#boot) that shows from the first paint and is removed after the scene's first drawn frame.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Call before `goto`: records whether the loader was in the page, in its loading state, as soon as the document had it (before any script could end it). */
export const watchLoader = (page) => page.addInitScript((selector) => {
  window.__loaderSeen = false;
  const look = () => { if (document.querySelector(selector)?.getAttribute("data-state") === "loading") window.__loaderSeen = true; };
  new MutationObserver(look).observe(document, { childList: true, subtree: true });
  look();
}, HOOK.bootLoader);
/** Whether the loader was seen loading at the start (needs `watchLoader`). */
export const loaderWasSeen = (page) => page.evaluate(() => window.__loaderSeen === true);
/** The loader's state now: "loading", "failed", "done" (fading out) or "absent" (removed). */
export const loaderState = (page) => page.evaluate((selector) => document.querySelector(selector)?.getAttribute("data-state") ?? "absent", HOOK.bootLoader);
/** Waits until the loader has been removed from the page. */
export const waitForLoaderGone = (page, options) => page.waitForSelector(HOOK.bootLoader, { state: "detached", ...options });

/** Starts counting the page's requests whose address matches the pattern (call before the page loads); returns the live list of addresses. */
export function trackRequests(page, pattern) {
  const urls = [];
  page.on("request", (request) => { if (pattern.test(request.url())) urls.push(request.url()); });
  return urls;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The catalogue page's Jupiter moon families (O-025 T-097)
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The catalogue page's moon families: `[{family, count, moons: [id, ...]}]`, in page order (reads `data-` hooks only). */
export const catalogueMoonFamilies = (page) => page.locator("[data-moon-family]").evaluateAll((families) => families.map((family) => ({
  family: family.getAttribute("data-moon-family"),
  count: Number(family.getAttribute("data-count")),
  moons: [...family.querySelectorAll("[data-moon]")].map((moon) => moon.getAttribute("data-moon")),
})));

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Body sets (O-025 T-098): many small bodies as one batch of dots, balls close up, names on hover, tap or near zoom, orbit lines by family.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The scene's body-set readouts (`data-body-set-*` on the drawn canvas): members held and drawn, a sample of on-screen members, the widest ball, orbits, family colours. */
export const bodySetReadout = (page) => page.locator("canvas").first().evaluate((canvas) => {
  const data = canvas.dataset;
  const json = (text, fallback) => (text === undefined || text === "" ? fallback : JSON.parse(text));
  return {
    members: Number(data.bodySetMembers ?? 0),
    drawn: Number(data.bodySetDrawn ?? 0),
    sample: json(data.bodySetSample, []),
    widest: json(data.bodySetWidest, null),
    dotPx: Number(data.bodySetDotPx ?? 0),
    orbits: Number(data.bodySetOrbits ?? 0),
    familyColors: json(data.bodySetFamilyColors, {}),
    orbitGaps: json(data.bodySetOrbitGaps, []),
    hover: data.bodySetHover ?? "",
    named: Number(data.bodySetNamed ?? 0),
    highlight: data.bodySetHighlight ?? "",
    lit: Number(data.bodySetLit ?? 0),
    rings: Number(canvas.closest("[data-rings]")?.getAttribute("data-rings") ?? 0),
  };
});
/** The drawn rings (`data-ring-bands`): whether the disc is shown and each band's radii, colour and opacity in force; null when none. */
export const ringReadout = (page) => page.locator("canvas").first().evaluate((canvas) => (canvas.dataset.ringBands ? JSON.parse(canvas.dataset.ringBands) : null));
/** Moves the mouse over a point of the scene (CSS px from the canvas's top left), as a viewer pointing at a dot. */
export async function pointAtScene(page, x, y) {
  const box = await page.locator("canvas").first().boundingBox();
  await page.mouse.move(box.x + x, box.y + y);
}
/** Taps (clicks without dragging) a point of the scene. */
export async function tapScene(page, x, y) {
  const box = await page.locator("canvas").first().boundingBox();
  await page.mouse.click(box.x + x, box.y + y);
}
// ---------------------------------------------------------------------------------------------------------------------------------------------
// Tap or click an object in the scene to focus on it (O-022 T-109): the pointer actions and the scene's pick readouts.
// A touch page (a context made with `hasTouch`) sends real touch events through the DevTools protocol, so the app sees pointerType "touch";
// any other page sends the mouse. Positions given to these functions are CSS px from the canvas's top left unless the name says "page".
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** "touch" on a page made with touch support, otherwise "mouse". */
export const scenePointer = async (page) => ((await page.evaluate(() => navigator.maxTouchPoints > 0)) ? "touch" : "mouse");
const sceneBox = (page) => page.locator("canvas").first().boundingBox();

/** One or more fingers moving in a straight line each (`paths`: `{from, to}` in page px), with real touch events. A path with from equal to to is a tap. */
async function touchGesture(page, paths, steps = 8) {
  const client = await page.context().newCDPSession(page);
  const at = (i) => paths.map((p, n) => {
    const f = steps === 0 ? 0 : i / steps;
    return { x: p.from.x + (p.to.x - p.from.x) * f, y: p.from.y + (p.to.y - p.from.y) * f, id: n + 1 };
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) });
  for (let i = 1; i <= steps; i += 1) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i) });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
/** A tap (touch) or click (mouse) at a point of the page. */
async function tapPagePoint(page, x, y) {
  if ((await scenePointer(page)) === "touch") await touchGesture(page, [{ from: { x, y }, to: { x, y } }], 0);
  else { await page.mouse.move(x, y); await page.mouse.click(x, y); }
  await page.waitForTimeout(150);
}
/** A one-finger or mouse-button drag from a page point to a page point. */
async function dragPagePoints(page, from, to) {
  if ((await scenePointer(page)) === "touch") { await touchGesture(page, [{ from, to }]); return; }
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) await page.mouse.move(from.x + ((to.x - from.x) * i) / 8, from.y + ((to.y - from.y) * i) / 8);
  await page.mouse.up();
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
/** Whether the scene canvas itself is the topmost thing at a page point (no panel, marker or control over it): where a tap reaches the scene. */
const canvasTopAt = (page, x, y) => page.evaluate(({ px, py }) => document.elementFromPoint(px, py)?.tagName === "CANVAS", { px: x, py: y });
/** Like canvasTopAt, and (touch pages only) no button, link or control within a fingertip (22 px) of the point: a touch is adjusted to the nearest control there, so a story marker beside a body takes the tap. */
const sceneReachableAt = async (page, x, y) => page.evaluate(({ px, py, touch }) => {
  const control = (el) => el !== null && el.closest("button, a, select, input, textarea, [role='button']") !== null;
  if (document.elementFromPoint(px, py)?.tagName !== "CANVAS") return false;
  for (const r of touch ? [11, 22] : []) for (let a = 0; a < 8; a += 1) if (control(document.elementFromPoint(px + Math.cos((a * Math.PI) / 4) * r, py + Math.sin((a * Math.PI) / 4) * r))) return false;
  return true;
}, { px: x, py: y, touch: (await scenePointer(page)) === "touch" });

/** A body's centre in canvas px from the scene's own readout (`data-body-screen`), or null when it is not in view. */
export async function bodyScreenPoint(page, id) {
  const [body, box] = await Promise.all([sceneBody(page, id), sceneBox(page)]);
  return body === undefined || !body.inView || body.as === "none" ? null : { x: body.x * box.width, y: body.y * box.height };
}
/** The last object the scene reported a tap on (`data-pick-target`); empty before any tap landed on a target. */
export const pickTarget = (page) => page.locator("canvas").first().evaluate((canvas) => canvas.dataset.pickTarget ?? "");
/** The object the mouse is over (`data-pick-hover`); empty when none, and always empty for touch. */
export const pickHover = (page) => page.locator("canvas").first().evaluate((canvas) => canvas.dataset.pickHover ?? "");
/** The pointer shape over the scene (`pointer` over a target, empty otherwise). */
export const sceneCursor = (page) => page.locator("canvas").first().evaluate((canvas) => canvas.style.cursor);
/** Waits until the Object list holds this id (a tap flew to it and the picker shows it). */
export const waitForPicked = (page, id, timeout = 8000) => page.waitForFunction((wanted) => document.querySelector('select[aria-label="Select object"]')?.value === wanted, id, { timeout });
/** Waits until the scene reports a tap on this id (`data-pick-target`); meaningful even when the picker already showed it. */
export const waitForPickTarget = (page, id, timeout = 8000) => page.waitForFunction((wanted) => (document.querySelector("canvas")?.dataset.pickTarget ?? "") === wanted, id, { timeout });
/** Waits until the scene reports the mouse over this id (empty string: over nothing). */
export const waitForPickHover = (page, id, timeout = 5000) => page.waitForFunction((wanted) => (document.querySelector("canvas")?.dataset.pickHover ?? "") === wanted, id, { timeout });

/** A canvas point on a body's disc with the canvas on top (a story marker, panel or control can sit over the centre): the centre first, then points inside the disc. Null when the whole disc is covered. */
async function clearBodyPoint(page, point, radiusPx) {
  const box = await sceneBox(page);
  const reach = Math.max(0, Math.min(radiusPx ?? 0, 60) * 0.7);
  const offsets = [[0, 0]];
  if (reach >= 4) for (const f of [0.5, 1]) for (let a = 0; a < 8; a += 1) offsets.push([Math.cos((a * Math.PI) / 4) * reach * f, Math.sin((a * Math.PI) / 4) * reach * f]);
  for (const [dx, dy] of offsets) {
    const x = point.x + dx, y = point.y + dy;
    if (x < 0 || y < 0 || x > box.width || y > box.height) continue;
    if (await sceneReachableAt(page, box.x + x, box.y + y)) return { x, y };
  }
  return null;
}
/** Taps (touch) or clicks (mouse) a body once the camera has settled: at its centre, or at a point on its disc when something covers the centre. Throws when the whole disc is covered. Returns the point. */
export async function tapBody(page, id) {
  const settled = await settledPoint(() => bodyScreenPoint(page, id));
  if (settled === null) throw new Error(`driver: ${id} is not in view to tap`);
  const body = await sceneBody(page, id);
  const point = await clearBodyPoint(page, settled, body?.radiusPx);
  if (point === null) throw new Error(`driver: ${id} is covered by a panel, marker or control at (${Math.round(settled.x)}, ${Math.round(settled.y)}), so a tap would not reach the scene`);
  const box = await sceneBox(page);
  await tapPagePoint(page, box.x + point.x, box.y + point.y);
  return point;
}
/** Taps a shown name tag at its centre. Throws unless the tag is showing and the canvas is under that point. */
export async function tapLabel(page, id) {
  const read = () => page.locator(`[data-label-id="${id}"]`).evaluate((element) => {
    if (element.hidden) return null;
    const r = element.getBoundingClientRect();
    return r.width === 0 ? null : { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
  });
  const point = await settledPoint(read);
  if (point === null) throw new Error(`driver: ${id}'s name tag is not showing to tap`);
  await tapPagePoint(page, point.x, point.y);
  return point;
}
/** Taps a point of the scene in canvas px with the page's own pointer (touch or mouse). */
export async function tapScenePoint(page, x, y) {
  const box = await sceneBox(page);
  await tapPagePoint(page, box.x + x, box.y + y);
}
/** Drags across a body: presses on its centre and moves 110 px sideways (towards the middle of the view), then releases. */
export async function dragAcross(page, id) {
  const point = await settledPoint(() => bodyScreenPoint(page, id));
  if (point === null) throw new Error(`driver: ${id} is not in view to drag`);
  const box = await sceneBox(page);
  const dx = point.x > box.width / 2 ? -110 : 110;
  await dragPagePoints(page, { x: box.x + point.x, y: box.y + point.y }, { x: box.x + point.x + dx, y: box.y + point.y });
}
/** A two-finger pinch spreading apart around a canvas point (touch pages only). */
export async function pinchAt(page, x, y) {
  if ((await scenePointer(page)) !== "touch") throw new Error("driver: a pinch needs a touch page");
  const box = await sceneBox(page);
  const cx = box.x + x, cy = box.y + y;
  await touchGesture(page, [{ from: { x: cx - 20, y: cy }, to: { x: cx - 80, y: cy } }, { from: { x: cx + 20, y: cy }, to: { x: cx + 80, y: cy } }]);
  await page.waitForTimeout(150);
}
/** Moves the mouse onto a body's centre (hover). */
export async function hoverBody(page, id) {
  const settled = await settledPoint(() => bodyScreenPoint(page, id));
  if (settled === null) throw new Error(`driver: ${id} is not in view to hover`);
  const point = await clearBodyPoint(page, settled, (await sceneBody(page, id))?.radiusPx);
  if (point === null) throw new Error(`driver: ${id} is covered by a panel, marker or control, so the mouse cannot reach it`);
  // Come in from a pixel away so the scene always hears a move, even when the mouse already rests on the point.
  await pointAtScene(page, point.x + 1, point.y);
  await pointAtScene(page, point.x, point.y);
  return point;
}
/** Moves the mouse to a canvas point. */
export const hoverScenePoint = (page, x, y) => pointAtScene(page, x, y);

/** The bodies a tap can reach right now: in view, listed and available in the Object list, the canvas on top of the point, and no other body within 40 px. Largest first. `{id, x, y, radiusPx}` in canvas px. */
export async function tappableBodies(page, exclude = []) {
  const [bodies, box, options] = await Promise.all([sceneBodies(page), sceneBox(page), pickableBodies(page)]);
  const listed = new Set(options.map((option) => option.value));
  const inView = bodies.filter((body) => body.inView && body.as !== "none").map((body) => ({ id: body.id, x: body.x * box.width, y: body.y * box.height, radiusPx: body.radiusPx }));
  const out = [];
  for (const body of inView) {
    if (!listed.has(body.id) || exclude.includes(body.id)) continue;
    if (body.x < 30 || body.y < 30 || body.x > box.width - 30 || body.y > box.height - 30) continue;
    if (inView.some((other) => other.id !== body.id && Math.hypot(other.x - body.x, other.y - body.y) < 40)) continue;
    if ((await clearBodyPoint(page, body, body.radiusPx)) === null) continue;
    out.push(body);
  }
  return out.sort((a, b) => b.radiusPx - a.radiusPx);
}
/** Ids of the shown name tags of listed, available objects whose centre has the canvas under it and is not over another object's disc, so a tap there reaches the scene as this tag's object. */
export async function tappableLabelIds(page, exclude = []) {
  const [pickable, bodies, box] = await Promise.all([pickableBodies(page), sceneBodies(page), sceneBox(page)]);
  const options = new Set(pickable.map((option) => option.value));
  const discs = bodies.filter((body) => body.inView && body.as !== "none").map((body) => ({ id: body.id, x: box.x + body.x * box.width, y: box.y + body.y * box.height, r: body.radiusPx }));
  const centres = await page.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.labelId, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, width: r.width };
  }));
  const out = [];
  for (const c of centres) if (c.width > 0 && options.has(c.id) && !exclude.includes(c.id) && !discs.some((d) => d.id !== c.id && Math.hypot(d.x - c.x, d.y - c.y) < d.r + 10) && (await sceneReachableAt(page, c.x, c.y))) out.push(c.id);
  return out;
}
/** A canvas point at least `gap` px from every body in view, every sampled body-set dot and every shown name tag, with the canvas on top; null when the view has none. */
export async function emptySceneSpot(page, gap = 120) {
  const [bodies, box, set, tags] = await Promise.all([sceneBodies(page), sceneBox(page), bodySetReadout(page), page.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }))]);
  const marks = bodies.filter((body) => body.inView && body.as !== "none").map((body) => ({ x: body.x * box.width, y: body.y * box.height, r: body.radiusPx })).concat(set.sample.map((dot) => ({ x: dot.x, y: dot.y, r: 0 })));
  for (let fy = 0.2; fy <= 0.81; fy += 0.1) {
    for (let fx = 0.1; fx <= 0.91; fx += 0.1) {
      const x = box.width * fx, y = box.height * fy;
      if (marks.some((mark) => Math.hypot(mark.x - x, mark.y - y) < gap + mark.r)) continue;
      const px = box.x + x, py = box.y + y;
      if (tags.some((tag) => px > tag.left - gap / 2 && px < tag.right + gap / 2 && py > tag.top - gap / 2 && py < tag.bottom + gap / 2)) continue;
      if (await canvasTopAt(page, px, py)) return { x, y };
    }
  }
  return null;
}
/** A sampled body-set dot (small moon) a tap can reach: the canvas on top, no other dot or body within 30 px. `{id, x, y}` in canvas px, or null. */
export async function tappableSetMember(page) {
  const [set, bodies, box] = await Promise.all([bodySetReadout(page), sceneBodies(page), sceneBox(page)]);
  const others = bodies.filter((body) => body.inView && body.as !== "none").map((body) => ({ x: body.x * box.width, y: body.y * box.height }));
  for (const dot of set.sample) {
    if (dot.x < 30 || dot.y < 30 || dot.x > box.width - 30 || dot.y > box.height - 30) continue;
    if (others.some((o) => Math.hypot(o.x - dot.x, o.y - dot.y) < 30)) continue;
    if (set.sample.some((o) => o.id !== dot.id && Math.hypot(o.x - dot.x, o.y - dot.y) < 30)) continue;
    if (await canvasTopAt(page, box.x + dot.x, box.y + dot.y)) return { id: dot.id, x: dot.x, y: dot.y };
  }
  return null;
}

/** Whether a body-set member's name is showing. */
export const bodySetNameShown = (page, id) => page.locator(`[data-body-set-label="${id}"]`).evaluate((element) => !element.hidden);
/** The ids of every body-set member whose name is showing. */
export const bodySetNamesShown = (page) => page.locator("[data-body-set-label]").evaluateAll((elements) => elements.filter((element) => !element.hidden).map((element) => element.getAttribute("data-body-set-label")));

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The moon panel (O-025 T-099): a planet's moons by family, a sliding panel on a wide screen and a section of the top drawer on a phone.
// ---------------------------------------------------------------------------------------------------------------------------------------------

const MOON_SHEET = ".moons-sheet";
const moonFamily = (page, id) => page.locator(`[data-moon-family="${id}"]`);
/** The panel itself (a labelled region). */
export const moonPanel = (page) => page.getByRole("region", { name: /'s moons$/ });
/** Opens the moon panel: the toggle button on a wide screen, the top drawer on a phone. */
export async function openMoonPanel(page) {
  if (await isPhoneLayout(page)) { await openControlsDrawer(page); await drawersSettled(page); return; }
  const toggle = page.locator('button[aria-controls="moons-panel"]');
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await page.locator(`${MOON_SHEET}[data-open="true"]`).waitFor();
  await page.waitForFunction((hook) => document.querySelector(hook).getAnimations().every((animation) => animation.playState !== "running"), MOON_SHEET);
}
/** Closes the moon panel (its toggle on a wide screen; the drawer's handle on a phone). */
export async function closeMoonPanel(page) {
  if (await isPhoneLayout(page)) { await closeControlsDrawer(page); return; }
  const toggle = page.locator('button[aria-controls="moons-panel"]');
  if ((await toggle.getAttribute("aria-expanded")) === "true") await toggle.click();
  await page.locator(`${MOON_SHEET}[data-open="false"]`).waitFor({ state: "attached" });
}
/**
 * The shell panels on screen and their boxes, for the overlap check (O-025 T-099 collision repair): `[{name, left, top, right, bottom}]` for the moons
 * button and sheet, the information panel, story panel, timeline bar and drawer, top bar, controls drawer and its pill and handles; only those showing.
 */
export const shellPanelBoxes = (page) => page.evaluate(() => {
  const named = { "moons-toggle": ".moons-toggle", "moons-sheet": ".moons-sheet", "info-panel": ".info-panel", "story-panel": ".story-panel", "timeline-bar": ".timeline-bar", "timeline-drawer": ".timeline-drawer", "top-bar": ".shell-toolbar", "controls-drawer": ".controls-drawer", "controls-pill": ".controls-pill", "developer-mode-toggle": ".developer-mode-toggle" };
  return Object.entries(named).flatMap(([name, selector]) => [...document.querySelectorAll(selector)].flatMap((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || box.width === 0 || box.height === 0) return [];
    return [{ name, left: box.left, top: box.top, right: box.right, bottom: box.bottom }];
  }));
});
/** The viewport size in CSS px: `{width, height}`. */
export const viewportSize = (page) => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
export const moonPanelShown = (page) => moonPanel(page).isVisible();
/** The families the panel lists, in order: id, whether it is the lit one, and the heading text (label and count). */
export const moonFamilies = (page) => page.locator("[data-moon-family]").evaluateAll((elements) => elements.map((element) => ({
  id: element.getAttribute("data-moon-family"),
  lit: element.getAttribute("data-lit") === "true",
  heading: (element.querySelector("button")?.textContent ?? "").replace(/\s+/g, " ").trim(),
})));
/** The moon list's summary line ("115 moons in the JPL Horizons list of 18 October 2026"), empty when the panel has none. */
export const moonListSummaryText = async (page) => (await page.locator("[data-moon-summary]").first().getAttribute("data-moon-summary")) ?? "";
/** The family the panel says is lit now (empty when none). */
export const moonPanelHighlight = (page) => moonPanel(page).getAttribute("data-highlight");
/** Taps a family's heading: opens or closes its fold (the featured family's heading lights it up directly). */
export async function tapMoonFamily(page, id) {
  const fold = page.locator(`[data-fold-toggle="moons-${id}"]`);
  if ((await fold.count()) > 0) await fold.click();
  else await page.locator(`[data-moon-light="${id}"]`).click();
}
export const moonFamilyFoldOpen = async (page, id) => (await page.locator(`[data-fold-toggle="moons-${id}"]`).getAttribute("aria-expanded")) === "true";
/** Opens the "+N unnamed" fold of a family. */
export const openUnnamedMoons = (page, id) => page.locator(`[data-fold-toggle="moons-${id}-unnamed"]`).click();
export const unnamedMoonsHeading = (page, id) => page.locator(`[data-fold-toggle="moons-${id}-unnamed"]`).innerText();
/** The moons showing in a family's section, in order: id, label, and the height of the row in CSS px. */
export const moonRows = (page, id) => moonFamily(page, id).locator("[data-moon]").evaluateAll((elements) => elements.filter((element) => element.checkVisibility({ checkVisibilityCSS: true })).map((element) => ({
  id: element.getAttribute("data-moon"), label: element.textContent.replace(/\s+/g, " ").trim(), heightPx: element.getBoundingClientRect().height,
})));
/** Whether a family's section shows its one-line description. */
export const moonFamilyDescription = (page, id) => moonFamily(page, id).locator(".moon-note").first().innerText();
/** The big four's pictures showing in the featured family. */
export const featuredMoonPictures = (page, id) => moonFamily(page, id).locator(".moon-disc").count();
/** Taps a moon in the panel (the shell flies to it and opens its information). */
export const chooseMoon = (page, id) => moonPanel(page).locator(`[data-moon="${id}"]:visible`).first().click();
/** Types in the panel's search box, as a viewer does. */
export const searchMoons = (page, text) => page.getByRole("searchbox", { name: "Find a moon" }).fill(text);
/** The moons the search lists now: id and the family each is listed with. */
export const moonSearchResults = (page) => page.locator(".moon-results [data-moon]").evaluateAll((elements) => elements.map((element) => ({ id: element.getAttribute("data-moon"), text: element.textContent.replace(/\s+/g, " ").trim() })));
/** Whether the camera is on a body: its Focus button is the pressed camera choice. */
// Read in place, not revealed: on a phone revealing opens the controls drawer, which closes the information sheet the caller is about to read.
export const focusedOn = async (page, id) => (await page.locator(`[data-camera-preset="focus-${id}"]`).first().getAttribute("aria-pressed")) === "true";
/** The id the information panel is about (empty when it is closed). */
export const infoTargetId = async (page) => ((await infoOpen(page)) ? page.locator(HOOK.infoPanel).getAttribute("data-info-id") : "");

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Inside another page (T-082, O-020 Decision 5): the owner's portfolio shows the app in an iframe under its own story buttons.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The size of the portfolio's iframe (`components/astraeus/AstraeusBridge.tsx`, read-only reference): full width and 660 px (>= 1024 wide), 580 px (>= 768), 460 px on a phone. */
export const PORTFOLIO_FRAME_HEIGHT = (viewportWidth) => (viewportWidth >= 1024 ? 660 : viewportWidth >= 768 ? 580 : 460);

/** Browser flags that let a stand-in page frame the local app (a recent Chromium blocks a local address framed by another origin as a local-network request; the portfolio live is public to public, so no such block exists there). */
export const FRAMING_BROWSER_ARGS = ["--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessForNavigations,BlockInsecurePrivateNetworkRequests"];

/** The stand-in page's address: the app's own port under another host name (`127.0.0.1` for `localhost`), so it is another origin like the portfolio is, yet the browser allows the frame (it blocks a local app framed by a public-looking host). Answered by a route; the server never sees it. */
const standInAddress = (appUrl) => { const url = new URL(appUrl); url.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost"; url.pathname = "/portfolio-stand-in"; url.search = ""; return url.href; };

/**
 * Opens a stand-in for the portfolio page at a made-up address and puts the app in a full-width iframe of the portfolio's height; returns the
 * frame, which every driver function accepts in place of a page (a frame has the same locators), after the shell has appeared in it.
 * The caller makes the page (so it can attach its error listeners first) and passes the app's address.
 */
export async function openInPortfolioFrame(page, appUrl, options) {
  const height = PORTFOLIO_FRAME_HEIGHT(page.viewportSize().width);
  await page.route(standInAddress(appUrl), (route) => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Portfolio stand-in</title><body style="margin:0;background:#050507"><iframe id="astraeus" src="${appUrl}" title="Astraeus" allow="fullscreen; accelerometer; gyroscope" style="display:block;width:100%;height:${height}px;border:0"></iframe></body>`,
  }));
  await page.goto(standInAddress(appUrl), { waitUntil: "load" });
  const handle = await page.locator("iframe#astraeus").elementHandle();
  const frame = await handle.contentFrame();
  await waitForShell(frame, options);
  return frame;
}

/** What the page shows of the embedded look: the shell's flag, the control height, the bars' heights and their gaps to the frame's edges. */
export const embeddedLook = (page) => page.evaluate(() => {
  const shell = document.querySelector(".astraeus-shell");
  const box = (selector) => { const element = document.querySelector(selector); if (element === null) return null; const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; };
  const timeline = box(".timeline-bar");
  const bar = box(".controls-pill") ?? box(".top-bar");
  const button = document.querySelector(".timeline-play");
  return {
    embedded: shell?.getAttribute("data-embedded") ?? null,
    phone: shell?.getAttribute("data-phone") ?? null,
    controlHeight: button === null ? null : button.getBoundingClientRect().height,
    topBar: bar,
    timeline,
    timelineBottomGap: timeline === null ? null : window.innerHeight - timeline.bottom,
    topGap: bar === null ? null : bar.top,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    scrollsHorizontally: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Tagged places on a body (O-025 T-103): a ringed marker on each place of a mapped moon, named on hover, opened in the information panel on a press.
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** The scene's feature-marker readout (`data-feature-markers`): `total` markers held and `shown` ones on screen as `{key, x, y}` fractions of the canvas, key being `<body>:<place>`. */
export const sceneFeatures = (page) => page.locator("canvas").first().evaluate((canvas) => (canvas.dataset.featureMarkers ? JSON.parse(canvas.dataset.featureMarkers) : { total: 0, shown: [] }));
/** The keys of the markers on screen now. */
export const shownFeatureKeys = async (page) => (await sceneFeatures(page)).shown.map((marker) => marker.key);
/** A place's marker as the viewer sees it: its screen point in CSS px from the page's top left, its name, whether it reads as selected; null while it is not shown. */
export const featureMarker = (page, key) => page.locator(`[data-feature-key="${key}"]`).evaluate((element) => {
  if (element.hidden) return null;
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width, name: element.getAttribute("aria-label"), pressed: element.getAttribute("aria-pressed") === "true" };
});
/** Presses (taps) a place's marker, which opens its information. */
export const pressFeature = (page, key) => page.locator(`[data-feature-key="${key}"]`).click();
/** Points the mouse at a place's marker, as a viewer hovering it. */
export async function hoverFeature(page, key) {
  await page.locator(`[data-feature-key="${key}"]`).hover();
}
/** Whether a place's name is showing beside its marker (the hover or focus label). */
export const featureNameShown = (page, key) => page.locator(`[data-feature-key="${key}"]`).evaluate((element) => Number(getComputedStyle(element, "::after").opacity) > 0.5);
/** The text of the information panel when it shows this place, or null when another or none is open. */
export async function featureInfoText(page, key) {
  const panel = page.locator(`${HOOK.infoPanel}[data-info-kind="feature"][data-info-id="${key}"]`);
  if ((await panel.count()) === 0) return null;
  return squash(await panel.innerText());
}
/** Waits for a place's information to open. */
export const waitForFeatureInfo = (page, key, options) => page.locator(`${HOOK.infoPanel}[data-info-kind="feature"][data-info-id="${key}"]`).waitFor(options);

/** The markers on screen that overlap a shell panel (information panel, moons sheet or button, timeline, top bar, story panel, drawers): `[{key, over}]`; empty when every panel owns its own area. */
export async function featureCollisions(page) {
  // Markers re-test the panels a few times a second and a panel slides in, so a collision counts only when it persists for 2 s.
  let found = await featureCollisionsNow(page);
  for (let waited = 0; found.length > 0 && waited < 2000; waited += 200) { await page.waitForTimeout(200); found = await featureCollisionsNow(page); }
  return found;
}
const featureCollisionsNow = (page) => page.evaluate(() => {
  const panels = [...document.querySelectorAll(".info-panel, .moons-sheet, .moons-toggle, .timeline-bar, .shell-toolbar, .story-panel, .controls-drawer, .controls-pill, .timeline-drawer, .developer-mode-toggle")]
    .map((element) => ({ name: element.className.toString().split(" ")[0], box: element.getBoundingClientRect() })).filter(({ box }) => box.width > 0 && box.height > 0);
  return [...document.querySelectorAll("[data-feature-key]")].filter((marker) => !marker.hidden).flatMap((marker) => {
    const box = marker.getBoundingClientRect();
    const over = panels.find((panel) => box.left < panel.box.right && box.right > panel.box.left && box.top < panel.box.bottom && box.bottom > panel.box.top);
    return over === undefined ? [] : [{ key: marker.getAttribute("data-feature-key"), over: over.name }];
  });
});
/** Whether a place's marker is marked selected (read even while the marker is hidden under an open sheet, which is the collision rule). */
export const featureMarkerPressed = async (page, key) => (await page.locator(`[data-feature-key="${key}"]`).getAttribute("aria-pressed")) === "true";
/** A place's tap target in CSS px: the hit area drawn around the marker; `{width, height}`. */
export const featureTapTarget = (page, key) => page.locator(`[data-feature-key="${key}"]`).evaluate((element) => {
  const hit = getComputedStyle(element, "::before");
  return { width: parseFloat(hit.width), height: parseFloat(hit.height) };
});
/** The place's name label stays inside the viewport: its box from the marker and the label's CSS side, true when it fits. */
export const featureNameFits = (page, key) => page.locator(`[data-feature-key="${key}"]`).evaluate((element) => {
  const box = element.getBoundingClientRect();
  const label = getComputedStyle(element, "::after");
  const width = Math.min(parseFloat(label.width) || 0, window.innerWidth);
  const left = element.dataset.edgeX === "left" ? box.left : element.dataset.edgeX === "right" ? box.right - width : box.left + box.width / 2 - width / 2;
  return left >= 0 && left + width <= window.innerWidth;
});

// ---- The home page's curve-fit section (O-025 T-101): "Photos, or a recipe" with Io's orbit drawn as table dots and as fitted pieces, and a time slider.

const HOME_FIT = { section: "#curve-fits", slider: "[data-fit-slider]", row: ".fit-row", panels: ".fit-panel", readout: "[data-fit-readout]", stats: ".fit-stats li" };

/** Opens the home page (index.html) and brings the curve-fit section into view. */
export async function openHomeCurveFits(page, url) {
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.locator(HOME_FIT.section).scrollIntoViewIfNeeded();
  await page.locator(HOME_FIT.slider).waitFor({ timeout: 15000 });
}

/** Moves the section's time slider to `minutes` into the two-and-a-quarter-day window. */
export const curveFitSetMinutes = (page, minutes) => page.locator(HOME_FIT.slider).fill(String(minutes));

/** What the section reports: the slider's hours, Io's distance, the marker, the dots and pieces drawn, and the readout text. */
export const curveFitReadout = (page) => page.locator(HOME_FIT.row).evaluate((row) => ({
  hours: Number(row.dataset.fitHours), km: Number(row.dataset.fitKm), markX: Number(row.dataset.fitMarkX), markY: Number(row.dataset.fitMarkY),
  dots: Number(row.dataset.fitDots), pieces: Number(row.dataset.fitPieces), text: row.querySelector("[data-fit-readout]")?.textContent ?? "",
  sliderMax: Number(row.querySelector("[data-fit-slider]")?.max ?? 0),
}));

/** The section's layout: sideways scroll, the slider's target size, how far the panels and figures reach, the smallest text, and whether it overlaps the sections around it. */
export const curveFitLayout = (page) => page.evaluate(({ section, slider, panels, stats }) => {
  const root = document.querySelector(section);
  const rect = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY, width: r.width, height: r.height }; };
  const own = rect(root);
  const neighbours = [root.previousElementSibling, root.nextElementSibling].filter(Boolean).map(rect);
  const overlaps = neighbours.filter((n) => n.top < own.bottom - 0.5 && n.bottom > own.top + 0.5).length;
  let smallest = 99;
  for (const element of root.querySelectorAll("*")) {
    if ([...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim() !== "")) smallest = Math.min(smallest, parseFloat(getComputedStyle(element).fontSize));
  }
  const spill = (selector) => Math.max(0, ...[...root.querySelectorAll(selector)].map((e) => rect(e).right - innerWidth));
  const columns = new Set([...root.querySelectorAll(panels)].map((e) => Math.round(rect(e).left))).size;
  const intersecting = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  const pieces = [...root.querySelectorAll(`${panels}, .fit-row, ${stats}, .fit-note`)].map(rect);
  let collisions = 0;
  for (let i = 0; i < pieces.length; i += 1) for (let j = i + 1; j < pieces.length; j += 1) if (intersecting(pieces[i], pieces[j])) collisions += 1;
  return {
    pageScrollWidth: document.documentElement.scrollWidth, innerWidth, sliderHeight: rect(root.querySelector(slider)).height, sliderWidth: rect(root.querySelector(slider)).width,
    reach: spill("*"), panelSpill: spill(panels), smallestFontPx: smallest, overlapsNeighbours: overlaps, columns, collisions,
  };
}, HOME_FIT);
