// The Scale control as the top bar presents it (O-020 T-079): a toggle for two scales, a menu for three, one held button for one scale.
// Scripts choose a scale by its label, whichever form the control takes, and read its state from the control's data attributes.

/** The label a scale id carries in the top bar. */
const LABELS = { "true-scale": "True", "readable-scale": "Readable", "solar-system": "Solar system" };

/** The id of the scale in force (for example "true-scale"). */
export const currentScale = (page) => page.locator(".scale-control").getAttribute("data-scale-current");

/** The ids the control offers, in order. */
export const scaleOptions = async (page) => (await page.locator(".scale-control").getAttribute("data-scale-options")).split(",");

/** Chooses a scale by its label ("True", "Readable" or "Solar system"); a no-op when it is already in force. */
export async function chooseScale(page, label) {
  const control = page.locator(".scale-control");
  const trigger = control.locator("button.scale-toggle");
  if ((await trigger.getAttribute("data-scale-label")) === label) return;
  if ((await trigger.getAttribute("aria-haspopup")) === "menu") {
    await trigger.click();
    await control.getByRole("menuitemradio", { name: label, exact: true }).click();
  } else {
    await trigger.click();
  }
  const now = LABELS[await currentScale(page)];
  if (now !== label) throw new Error(`could not choose the ${label} scale (now ${now})`);
}

/** Whether the control offers the scale with this label. */
export const offersScale = async (page, label) => (await scaleOptions(page)).some((id) => LABELS[id] === label);

/** Selects an orbit line the Object list no longer holds: pick its body, then press the body's related button. */
export async function selectOrbit(page, bodyId, orbitId) {
  await page.getByLabel("Select object").selectOption(bodyId);
  await page.locator(`[data-related-object="${orbitId}"]`).click();
}
