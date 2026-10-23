---
id: O-041
title: Rebuild the Apollo 11 story on the public API
status: in_progress
depends_on: [O-040]
release: G-011
---

# O-041: Rebuild the Apollo 11 story on the public API

## Outcome

The Apollo 11 story on the site is rebuilt in place so its code uses only what `npm install astraeus` offers (the `astraeus` entry), and looks as it does today apart from the owner-approved changes below. What Apollo needs that the package cannot do yet becomes public API, thin over the existing engine: source-anchor dots on a path; a description and known limits on each object; live readouts (range from Earth, speed, distance to the Moon) shown as bars on the object's info card; timed events with their provenance; story panels; the timeline's span, speeds and starting rate, or no timeline at all; a true-scale-only setting; an opening camera view that does not follow; and the `Provenance` type. Each new call is documented on `/api`, tested on a made-up configuration, and used by a small made-up story in `examples/hello-scene` built from the packed tarball.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. A real consumer drives the API by need instead of guesswork (STYLE-05), and proves it on a story people can see.

## Success Conditions

- `packages/astraeus-demo-apollo11/src` imports only `astraeus` (the `.` entry); a boundary test enforces it and is proved on a made-up offence.
- A comparison test shows the rebuilt Apollo definition has the same objects (ids, labels, colours, provenance, known limits), events, panels (ids and times), window, rates, scale choices and opening view as before the rebuild, differing only where a decision below allows.
- The engine names no Apollo code: `packages/astraeus/src/experiences/apollo11/` no longer exists.
- Every new export has a doc comment and a place on `/api`; every new call and error code is tested on a made-up configuration (ARCH-03); a scene with no timeline (frozen, and running) is proved on the made-up configuration.
- `examples/hello-scene` uses the new calls from the packed tarball and passes its browser step.
- The owner has looked at the rebuilt Apollo on the preview before the Full Objective Check; the Full Objective Check gates pass with one `npm run check:browser`.

## Decisions

Owner, 2026-10-24, O-041 planning interview (proposal drafted overnight 2026-10-23):

1. **Only what Apollo needs** ("Only what Apollo needs (Recommended)"). Own pictures, orbit lines for any body, and listening for events or picks are not built here; they come with a story that needs them. G-011's Outcome wording on these is to be revisited if O-042 does not need them either.
2. **Developer-drawer extras.** First answer "Drop them, fold notes in"; then, after reviewing what the shell already gives, "move the bars into the info card". So: Apollo's "This demo" Developer section (telemetry cards, journey progress, typed-date seek, mission context) goes; the mission notes move into each spacecraft's description and provenance; the telemetry bars (range, speed, distance to the Moon, altitude above the Moon, and the other bars the telemetry cards show today where a public readout can carry them) move into each spacecraft's info card as public readouts. No public custom-panel hook. The side-by-side drawer view of both spacecraft is the accepted loss.
3. **Camera menu automatic** ("Automatic (Recommended)"): Overview plus Focus and Follow for every body and path the scene holds; "Earth–Moon overview" becomes "Overview"; hello-scene's menu gains items (recorded change from 0.1).
4. **Rebuild in place** ("Rebuild it in place (Recommended)", confirming the 2026-10-23 "Replace the site demo"): Apollo stays on the site; its insides are rebuilt. The owner's "Earth's Closest Calls" idea is the owner's own separate project ("Leave it, ill build it seperately"), not part of O-041.
5. **Packed proof in `examples/hello-scene`** ("Grow the small example (Recommended)"): it grows into a tiny made-up story; no new example.
6. **Optional timeline** ("Add it to the Apollo part (Recommended)"): the timeline-settings call can also say "no timeline", which hides the bar on desktop and phone, with the time either frozen at a chosen moment or running on its own. Apollo does not use it; it is proved on the made-up configuration.
7. **Engine leftovers** ("yes add them to the plans"): `spacecraftMetrics.ts` moves out of `src/experiences/apollo11/` to a generic name and place.
8. **Run** under the standing orchestration rules (owner, 2026-10-23/24): Task Checks waived, coordinator marks steps done once gates pass, one owner look at Apollo on the preview, one Full Objective Check with one browser run.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040. Story data (paths, events, panels, notes) stays in the Apollo demo package; the engine holds only the generic shape. The site keeps its own app and switcher and is given the rebuilt scene's `toDefinition()`.

## Boundaries

**In scope:**
- The public calls Apollo needs (Decisions 1, 2, 6), their tests on a made-up configuration, the rebuilt Apollo story and its reference entries
- Moving `packages/astraeus/src/experiences/apollo11/spacecraftMetrics.ts` out of its Apollo-named engine folder to a generic place (e.g. `src/app/`), so the engine names no Apollo code (owner, 2026-10-24: "yes add them to the plans")
- The made-up story in `examples/hello-scene`, its browser step through `driver.mjs`, and re-measuring the Apollo page set in `load-budget.mjs` (a raise needs the owner's OK)

**Out of scope:**
- Groups of many objects (O-042); chapters and narration; own pictures, orbit lines for any body, event or pick listeners (Decision 1); a public custom Developer-panel hook (Decision 2); changing what the main Apollo view shows beyond Decisions 2 and 3; new Apollo data or a re-run of the reconstruction; the Closest Calls example; moving the other demos to the public API; publishing a release
