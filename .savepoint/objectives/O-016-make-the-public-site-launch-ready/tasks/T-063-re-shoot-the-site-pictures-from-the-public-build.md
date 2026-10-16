---
id: T-063
title: Re-shoot the site pictures from the public build
objective: O-016
status: in_progress
stage: audit
depends_on: [{task: T-060, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o016-plan-20261016}
---

# Re-shoot the site pictures from the public build

## Outcome

Every picture on the front page, assets page and README is captured from the public build (HYG stars, ESO Milky Way, credited Moon and Earth, GMN Perseids), so it shows exactly what visitors will see.

## User Check

Open the front page, the assets page and the README on GitHub. Every picture matches the live public demo, and none shows Yale stars or CAMS data.

## Done When

1. A capture script builds with ASTRAEUS_PUBLIC_BUILD=1, serves it, and captures each site picture (including the Perseids year GIF) at the owner's preferred angles (oblique Perseids with planet and comet orbits; the Apollo figure of eight), using startView values where set.
2. The pictures are replaced in site/, site/readme/ and public/share/ at similar sizes. The old no-sky fallbacks are removed if unused.
3. A list of every picture with its capture command and time is recorded in the evidence.

## Context Files

`index.html`, `assets.html`, `README.md`, `vercel.json`, `vite.config.ts`.

## Design References

Public build.

## Guardrails

PROV-02, TEST-01.

## Implementation Plan

1. List every image the pages and README reference.
2. Write the capture script against the public build.
3. Capture, compare with the old images, and replace them.

## Boundaries

Pictures only: no page wording changes except alt text.

## Technical Verification

Build, and the capture script's own log. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in a worktree-free lane without router writes. Evidence dir: docs/evidence/o016-t063-20261016T120425Z (contact-sheet.png old vs new, capture-log.json, capture.log, gates.log, old/ and new/).
- Script: tools/validate/capture-site-pictures.mjs (command in its header). Converter: ffmpeg (JPEG and GIF); ImageMagick montage for the contact sheet.
- Captured from the public build served at :5406 (built from a HEAD snapshot plus my two startView edits, because other builders' in-flight main.tsx edits broke a live-tree build at the time).
- Views: Perseids sun,100,40,250000 (ecliptic up, scale true; revision 2 after the coordinator asked for a closer frame, replacing sun,160,40,1800000, kept in rev2/ as rejected); Apollo desktop earth,0,70,130; Apollo phone moon,270,50,214. Set as look.startView in data/showers/perseids.json (sun,100,40,250000) and startView in src/experiences/apollo11/apollo11Definition.tsx (earth,0,70,130). 
- Gates: typecheck pass, vitest 894 passed, public build pass, public-build-assets.mjs no matches.
- Extra read: src/app/viewLink.ts, src/app/experienceDefinition.ts, src/shell (selectors), apollo11Definition.tsx (startView lives there, not apollo11.ts).

## Drift Notes

None yet.
- Rev 2 (Perseids only): Jupiter's orbit ring fills about 70% of the width, inner rings, Earth's path, comet marker and orbit line visible. Rejected alternatives in rev2/: rejected-az100-130-160-190-d300000.png (az 100/130/160/190 at 300000), rejected-az220-and-d450000.png (az 220 at 300000; az 160/130/190 at 450000), and the far framing perseids-gmn-rejected-1800000.jpg / perseids-year-rejected-1800000.gif. GIF is now 40 frames, 16 colours, 960 wide, 1.91 MB (52 frames at 32 colours was 2.9-4.4 MB with the denser close view). perseids-gmn.jpg 86 KB.
- Browser regression (Perseids look.startView sun,100,40,250000 broke checkEclipticFlat, -10.4 deg desktop, -21.5 phone): tools/validate/browser-showers.mjs now puts `&view=sun,216,14.32,3007000` (ENGINE_DEFAULT_VIEW, the camera the assertion was written for) on the geometry scenarios' URLs, assertions unchanged, mapping in its header; new plain-load assertion that a shower declaring look.startView opens within 1.5 deg / 2% of it (read from the Developer view readout; passes desktop and phone, results.startView in the log).
- Ran against a private dev server (a HEAD snapshot plus my startView edits, port 5407; the production build only offers shipped sources so ?source=cams needs dev), 2026-10-16: browser-showers perseids exit 0 (desktop and phone), browser-showers geminids exit 0, browser-view-link exit 0, in docs/evidence/o016-t063-20261016T123619Z-showers/. docs/evidence/o016-t063-20261016T123522Z-showers/ is an interrupted earlier attempt (run against a production build that offered no CAMS source, failed at the member count; kept, not evidence of the final state). Servers stopped.

