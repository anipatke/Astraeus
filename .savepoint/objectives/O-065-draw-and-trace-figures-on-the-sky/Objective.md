---
id: O-065
title: Draw and trace figures on the sky
status: planned
depends_on: [O-064]
release: G-018
priority: high
---

# O-065: Draw and trace figures on the sky

## Outcome

The engine's star list carries catalogue ids (HIP), and a scene can add named figures drawn at infinity like the stars (segments between sky directions or star ids, a label point), trace any figure line by line on command or at a time (stay, fade or clear afterwards; reduced motion draws at once), and show ready-made ecliptic and celestial-equator lines and boundary outlines; the Sun and Moon seen from a look-out view keep a glow (a look setting) that never hides a figure.

## Why

G-018: tracing any constellation is the core capability; zodiac is one user.

## Success Conditions

Made-up figures only in engine code and tests (ARCH-01, ARCH-03); no real constellation name in `src/`.

- **Star ids.** The engine's star list carries each star's Hipparcos number (HIP) where HYG gives one; the committed star file is re-fetched by the existing tool with the id column, provenance updated (PROV-01), engine size inside its pack limit.
- **Sky figures.** A scene adds named figures drawn at infinity like the stars (EQJ directions, never in State, ARCH-02): line segments whose ends are a star id or a star-map position (`raDeg`, `decDeg`), a label and an optional label point (default: the centre of the figure's ends). A figure is either a figure or a boundary outline (a closed loop of positions). Bad shapes throw at the call (`bad-sky-figure`), a star id not in the list throws `unknown-star` (API-04, API-05). Both embedding paths read the figures (API-02).
- **Reference lines and switches.** The ecliptic (J2000 obliquity) and the celestial equator are built in; figures, boundaries, the ecliptic and the equator each have a display switch (`setSwitches`, visitor control as for orbit lines), defaults off for the reference lines and boundaries, on for figures.
- **Tracing on command** (owner decision 1). The host, on both embedding paths, asks for a figure to be traced line by line over a given time, then to stay, fade or clear; a new trace of the same figure restarts it; reduced motion (`prefers-reduced-motion`) draws it at once. Host calls land in order (O-061 rule). No timed traces on the scene clock.
- **Colours are configurable** (owner, 2026-11-10): each figure's line colour and label colour can be set per figure when it is added, with scene-wide defaults as public looks (API-06) that a figure's own colour overrides; the same for the ecliptic, equator and boundary lines, and for a traced line versus a faded one. Changeable live (`setLook`) and from the Developer drawer.
- **Label size and font are configurable** (owner, 2026-11-10; decision 2): one label look (font family the host page has loaded, size in pixels) applies to every label in the viewer (bodies, paths, sky figures); a sky figure may override both. Defaults keep today's label look byte-for-byte. Phone first: labels readable and never colliding at 375x667 and 1280x720 (sky labels join the existing label layout and its collision rule, STYLE-07).
- **Star brightness only** (owner, 2026-11-10): `starBrightness` stays the one star setting; no star size look (STYLE-05). Planner decision: figure stars are not emphasised in O-065; O-066 may revisit with selection.
- **Sun glow never hides a figure** (owner decision 3: Sun only). Seen from a look-out view, figure, boundary and reference lines and their labels draw above the Sun's glow; no Moon or other body glow is added.
- API lock, README and CHANGELOG updated (API-01, API-07); Design reconciled before the Full Objective Check; `npm run check:browser` once at the Full Check on a made-up sky scene; the owner looks on `localhost:5490`.

## Decisions (owner, 2026-11-10, session o065-planning-20261110)

- **When a trace runs:** "When the app asks" — one host call; O-066 stories reuse it; no clock-timed traces.
- **Label font and size:** "Every label" — one viewer-wide label look; a sky figure may override.
- **Glow:** "Sun only" — lines and labels draw above the Sun's glow; no Moon glow.
- Planner defaults stated in the confirmed design: colours and fonts are `setLook` and Developer-drawer settings with no page-address parameter (API-06 allows a look without one); figure stars are not emphasised; five steps in sequence.

## Architectural Considerations

Sky drawing is presentation only (ARCH-02), beside `app/SkyView.ts` (stars at infinity, depth off) with its per-frame work as named stages in `app/sceneFrame.ts` (CODE-02). Star ids live in the committed HYG file (`assets/stars/`, fetched by `tools/data/fetch-hyg-stars.mjs`) read through `assets/sky.ts`. Public input shapes and checks live in `src/api/` (a new planner beside the others, joined by `assembleScene`); the look table `app/look.ts` gains colour and font looks (it holds numbers and switches today), read by `Scene.setLook` and `handle.setLook`. Sky labels reuse `SceneLabelLayer`'s layout and collision rule rather than a second layer. No body or constellation name in `src/api/` (ARCH-06).

## Boundaries

**In scope:** star ids, sky figures and outlines, the ecliptic and equator, switches, tracing on command, colour and label looks, draw order over the Sun's glow, a made-up site scene for the owner's look, README, lock, CHANGELOG.
**Out of scope:** constellation data (O-067); clicking figures and stories (O-066); clock-timed traces; a Moon or other body glow; star emphasis; a horizon or ground view; precession.
