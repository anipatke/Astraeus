// Dev-only colour and type previews of the homepage (owner, 2026-11-24: "give me three more options"). Not a build input: vite.config.ts lists only
// index.html, assets.html, components.html and app.html. Each preview is the production index.html, unchanged in layout and copy, with paths pointed one
// folder up, its own font link, the shared switcher and one option's stylesheet and script. Rerun after index.html changes:
//   node packages/astraeus-site/preview/make-previews.mjs
import { readFileSync, writeFileSync } from "node:fs";

const here = new URL("./", import.meta.url);
const index = readFileSync(new URL("../index.html", here), "utf8");
const CURRENT_FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300;1,6..72,300&display=swap";

const options = [
  {
    id: "a",
    name: "Readout",
    // IBM Plex Sans and Mono (OFL 1.1): 44 KB + 14 KB of latin woff2, against 133 KB for the current three faces.
    fonts:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@300;400;500&display=swap",
  },
  {
    id: "b",
    name: "Atlas",
    // The current three faces, used differently: no new download (Newsreader's upright file is already fetched for the figures; the unused italic is dropped).
    fonts:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,300;6..72,400&display=swap",
  },
  {
    id: "c",
    name: "Sunlit",
    // Source Serif 4 (no optical-size axis), Source Sans 3 and Source Code Pro (OFL 1.1): 49 KB + 28 KB + 21 KB of latin woff2.
    fonts:
      "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;600&family=Source+Sans+3:wght@400;500;600&family=Source+Code+Pro:wght@400;500&display=swap",
  },
];

/** Replaces `from` once, and fails loudly when index.html no longer has it, so a stale preview is never written silently. */
function swap(html, from, to, all = false) {
  if (!html.includes(from)) throw new Error(`make-previews: index.html no longer contains ${JSON.stringify(from)}`);
  return all ? html.split(from).join(to) : html.replace(from, to);
}

for (const option of options) {
  let html = index;
  html = swap(html, CURRENT_FONTS, option.fonts);
  html = swap(
    html,
    "<title>Astraeus</title>",
    `<title>Astraeus (colour preview ${option.id.toUpperCase()}: ${option.name})</title>\n<meta name="robots" content="noindex">`,
  );
  html = swap(html, 'src="site/', 'src="../site/', true);
  html = swap(html, "url(site/", "url(../site/", true);
  for (const page of ["app.html", "assets.html", "components.html", "api/"])
    html = swap(html, `href="${page}`, `href="../${page}`, true);
  // Lets an option recolour the hero's star field (option C draws it in the engine's blackbody colours).
  html = swap(html, "const tints = [", "const tints = window.previewStarTints = [");
  html = swap(
    html,
    "</head>",
    `<link rel="stylesheet" href="./colour.css">\n<link rel="stylesheet" href="./colour-${option.id}.css">\n</head>`,
  );
  html = swap(html, "<body>", `<body data-preview="${option.id}">`);
  html = swap(
    html,
    "</body>",
    `<script type="module" src="./colour-${option.id}.js"></script>\n<script type="module" src="./colour.js"></script>\n</body>`,
  );
  writeFileSync(new URL(`./colour-${option.id}.html`, here), html);
}
console.log(`make-previews: wrote ${options.map((o) => `colour-${o.id}.html`).join(", ")}`);
