// Option A, Readout: colour encodes one measured quantity, the largest difference from JPL Horizons, on a log scale with its legend.
// The map is a cividis-style sequential ramp (Nuñez et al. 2018) lifted for a dark ground: lightness falls steadily as the difference grows, hue runs from the
// viewer's cool glow (--astraeus-glow, hue 250) through near-grey to its amber accent (--astraeus-accent, hue 75), so it reads in colour-blind vision and in greyscale.
// Every colour is computed from the figure the page already prints; nothing is coloured for decoration.
const LOG_MIN = -2; // 1 cm
const LOG_MAX = 4; // 10 km

/** OKLCH colour for a difference in metres. Brighter is closer to Horizons. */
export function colourFor(metres) {
  const t = Math.min(1, Math.max(0, (Math.log10(metres) - LOG_MIN) / (LOG_MAX - LOG_MIN)));
  const lightness = 0.9 - 0.15 * t;
  const chroma = 0.095 - 0.27 * t + 0.31 * t * t; // 0.095 at the cool end, about 0.03 near the middle, 0.135 at the warm end
  const hue = 250 - 175 * t;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

/** Metres from text such as "within 6.4 km", "4 cm" or "1km". */
function metresIn(text) {
  const match = /([\d.,]+)\s*(cm|km|m)\b/.exec(text.replace(/\s+/g, " "));
  if (!match) return undefined;
  const value = Number(match[1].replace(/,/g, ""));
  return value * { cm: 0.01, m: 1, km: 1000 }[match[2]];
}

const root = document.documentElement;
root.style.setProperty(
  "--pv-ramp",
  `linear-gradient(90deg, ${Array.from({ length: 13 }, (_, i) => `${colourFor(10 ** (LOG_MIN + (i / 12) * (LOG_MAX - LOG_MIN)))} ${((i / 12) * 100).toFixed(1)}%`).join(", ")})`,
);

// The four big figures and the hero's checked note.
for (const figure of document.querySelectorAll(".figures b")) {
  const metres = metresIn(figure.textContent ?? "");
  if (metres !== undefined) figure.style.setProperty("--pv-c", colourFor(metres));
  else figure.classList.add("pv-count");
}
const check = document.querySelector("[data-home-moon-check]");
if (check) {
  const metres = metresIn(check.textContent ?? "");
  if (metres !== undefined) check.style.setProperty("--pv-c", colourFor(metres));
}
for (const strong of document.querySelectorAll("#curve-fits strong[data-fit='accuracy']")) {
  const metres = metresIn(strong.textContent ?? "");
  if (metres !== undefined) strong.style.setProperty("--pv-c", colourFor(metres));
}

// The table: each figure in its colour, and the legend's marks read from the same cells.
const SHORT = {
  planetsRow: "Planets",
  moonRow: "Moon",
  ioRow: "Io",
  jupiterRow: "Jupiter's moons",
  saturnRow: "Saturn's moons",
  otherRow: "other moons",
};
const marks = new Map();
for (const cell of document.querySelectorAll(".facts td.fig")) {
  const metres = metresIn(cell.textContent ?? "");
  if (metres === undefined) continue;
  cell.style.setProperty("--pv-c", colourFor(metres));
  const names = marks.get(metres) ?? [];
  names.push(SHORT[cell.dataset.home] ?? "");
  marks.set(metres, names);
}

const figures = document.querySelector(".figures");
if (figures) {
  const scale = document.createElement("figure");
  scale.className = "pv-scale";
  scale.setAttribute("aria-label", "Colour scale: largest difference from JPL Horizons, log scale");
  const bar = document.createElement("div");
  bar.className = "pv-bar";
  const at = (metres) => `${(((Math.log10(metres) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100).toFixed(2)}%`;
  for (const [metres, names] of [...marks].sort((x, y) => x[0] - y[0])) {
    const mark = document.createElement("span");
    mark.className = "pv-mark";
    mark.style.left = at(metres);
    mark.style.setProperty("--pv-c", colourFor(metres));
    const label = names.join(", ");
    mark.innerHTML = `<i></i><b>${label.charAt(0).toUpperCase()}${label.slice(1)}</b>`;
    bar.append(mark);
  }
  const ticks = document.createElement("div");
  ticks.className = "pv-ticks";
  for (const [metres, text] of [
    [0.01, "1 cm"],
    [0.1, "10 cm"],
    [1, "1 m"],
    [10, "10 m"],
    [100, "100 m"],
    [1000, "1 km"],
    [10000, "10 km"],
  ]) {
    const tick = document.createElement("span");
    tick.style.left = at(metres);
    tick.textContent = text;
    ticks.append(tick);
  }
  const caption = document.createElement("figcaption");
  caption.textContent = "Colour = largest difference from JPL Horizons, on a log scale. Brighter and cooler is closer.";
  scale.append(bar, ticks, caption);
  figures.after(scale);
}
