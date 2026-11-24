// Option C, Sunlit: the hero's star field in the colours the engine gives real stars. Each tint is a naked-eye HYG star's B-V turned into a temperature
// and a colour by the engine's own functions (packages/astraeus/src/assets/sky.ts), the ones the viewer's sky uses, so the blues and oranges are the sky's.
import { colourFromTemperature, temperatureFromBV } from "../../astraeus/src/assets/sky.ts";
import starsUrl from "../../astraeus/src/assets/stars/hyg-v42-naked-eye.json?url";

const tints = window.previewStarTints;
if (Array.isArray(tints)) {
  const file = await (await fetch(starsUrl)).json();
  const hex = (rgb) =>
    `#${rgb
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  const colours = file.stars
    .filter((row) => typeof row[3] === "number")
    .map((row) => hex(colourFromTemperature(temperatureFromBV(row[3]))));
  tints.splice(0, tints.length, ...colours);
  window.dispatchEvent(new Event("resize"));
}
