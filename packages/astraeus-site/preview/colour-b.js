// Option B, Atlas: each globe's moon count and glow in the body's own colour. Hue and chroma from the area-weighted mean of the texture the row draws
// (site/t-*.jpg; for Earth and Venus, whose maps show ocean and radar surface, the engine's own atmosphere and cloud-top colours in assets/bodies), with OKLCH
// lightness raised to 0.80 so the colour reads as text on the dark ground. Mercury and the Moon are grey and stay grey.
const BODY = {
  Sun: "#ffa667",
  Mercury: "#bebebe",
  Venus: "#dab978",
  Earth: "#95c0fe",
  Mars: "#fea387",
  Jupiter: "#cabbab",
  Saturn: "#d9b980",
  Uranus: "#7bcdd9",
  Neptune: "#9ebdff",
  Pluto: "#d6b6ab",
};
for (const globe of document.querySelectorAll(".globe")) {
  const colour = BODY[globe.querySelector("b")?.textContent?.trim() ?? ""];
  if (colour) globe.style.setProperty("--pv-body", colour);
}
