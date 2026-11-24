// Shared by the colour previews: a small switcher between the current page and options A to C. Preview-only chrome, not part of any option.
const here = document.body.dataset.preview;
const nav = document.createElement("nav");
nav.className = "pv-switch";
nav.setAttribute("aria-label", "Colour previews");
const links = [
  ["../", "Current"],
  ["colour-a.html", "A · Readout"],
  ["colour-b.html", "B · Atlas"],
  ["colour-c.html", "C · Sunlit"],
];
for (const [href, label] of links) {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  if (href === `colour-${here}.html`) a.setAttribute("aria-current", "page");
  nav.append(a);
}
document.body.append(nav);
