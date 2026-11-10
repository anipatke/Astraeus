# hello-sky

Looks out from Earth and tells the story of Orion in three steps (turn, select, trace). The fourth example app: the `astraeus` package and the optional `astraeus-data-constellations` package on the plain `mount` path, installed from the packed tarballs by `npm run build:example` in the repository root (`node tools/build-example.mjs hello-sky` builds only this one).

Try it: `npx vite preview examples/hello-sky --port 5490` from the repository root, then open `http://localhost:5490/`. Press Next and Back; tap Orion's name for its card; open the switch panel and turn on the ecliptic (the Sun's path). `window.viewer` is the viewer handle in the browser console (`viewer.camera`, `viewer.setPanel("belt-and-sword")`).

What it shows:
- `constellations(["Ori"], { shown: "whenTraced" })` gives Orion, drawn only when a step traces it; `constellations(["Tau", "Gem", "CMa", "Lep", "Mon"])` gives five neighbours drawn faintly.
- Three story steps (a panel with no `at`) turn the view (`camera`), select Orion and trace it. The words are the example's own, short and plain, with illustrative provenance.

First download (measured 2026-11-10 in a headless browser at 1280x720, the page's own requests; the Sun and Earth pictures are the engine's built-in ones): about 4.8 MB raw, about 3.3 MB transferred if the server compresses text (the two pictures are already compressed JPEGs, 2.4 MB of it). The constellations package adds the figure and name files (about 20 kB raw); the outline file (149 kB raw) is not downloaded because no outlines are asked for.
