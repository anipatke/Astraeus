---
id: O-017
title: Simplify and slim Astraeus before its first public release
status: planned
depends_on: [O-011, O-012]
release: G-005
---

# O-017: Simplify and slim Astraeus before its first public release

## Outcome

The same site and the same experiences, with less code, fewer switches, a load-size limit that stops the site growing heavier, and lighter browser checks. The deploy to astraeus.curiouscode.ai waits for this Objective.

## Why

The code grew over four spikes and kept experiments that are now settled: local-only data paths that can never ship (CAMS, Yale), comparison switches, one-off tools and a 36-minute full browser run. The owner wants the first public version lean (owner, 2026-10-17: "I just want to optimise and simplify the code base before first release"; "i dont want to wait an hour for tests for every small change").

## Success Conditions

1. **CAMS and Yale are gone.** Their loaders, fetch tools, source switches (`?source=cams`, `?stars=yale`), local-only tests and the "local only" notes on the site and in the docs are removed. GMN is the only measured-orbit source and HYG the only star catalogue. `docs/ASTRAEUS_SPIKE_04.md` keeps the history of why CAMS was tried and dropped.
2. **Two experiment switches are gone:** the lighting comparison (`?lighting=single-sun`) and the Milky Way picture choice (`?skymap=`), with their comparison scripts (`browser-lighting.mjs`, `browser-sky-map.mjs`). The sky "up" direction, orbit quality and timeline span switches stay.
3. **Made-up test experiences are left out of the public build** and stay available in the dev server. Every real experience (Apollo 11, Earth–Moon, Jupiter–Io, Perseids, Geminids) stays.
4. **The most complex and duplicated code is simplified,** from a ranked list the owner approves (built from the code-health snapshot; likely first candidates `src/experiences/showers/showerDefinition.ts` and `src/app/AstraeusScene.tsx`).
5. **A load-size budget is enforced:** the public build fails if any page's first load exceeds its stated limit, and obvious weight (pictures, stream data files) is trimmed. The limits are set from one measurement pass.
6. **Browser checks are cut down:** the lite check (`tools/validate/browser-lite.mjs`, I-033) is proven on the tree, and the full run is trimmed toward about 20 minutes without losing a pass/fail scenario (phone layout checked once; the sky check samples experiences; measurement-only scripts on request; quick scripts two at a time). One-off tools and superseded briefs are archived.
7. **Nothing visible changed:** every real experience is photographed before and after at desktop and phone sizes and compared automatically; any difference is explained or fixed; then one short owner look.
8. **Before-and-after numbers are reported:** lines of code, number of address switches, first-load sizes per page, test and full browser run times.

## Architectural Considerations

- Removal, not redesign: no engine contract (`State`, `Trajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy`) changes, and no new feature arrives. A simplification that needs a contract change returns to the owner.
- Story data stays outside the engine; the name check stays green.
- The public-build validator keeps proving nothing local-only ships; with `data/local/` gone its local-data checks are rewritten, not dropped.
- Look-and-feel numbers stay settings with live controls (the marker threshold stays).

## Owner Decisions — 2026-10-17

Recorded from the planning interview (structured questions):
1. **Order:** merge spike-04 first, then this Objective, then deploy.
2. **Strip out CAMS and Yale entirely.** The CAMS permission email becomes optional.
3. **Switches removed:** the lighting comparison and the Milky Way picture choice. Kept: sky "up" direction, orbit quality, timeline span.
4. **Experiences:** keep all; leave the made-up test experiences out of the public build.
5. **Optimise means:** a load-size budget enforced by a test, plus easy weight wins. Not phone frame rate or start-up time.
6. **Proof of no visible change:** automatic before/after pictures of every experience at both sizes, plus one short owner look at the end.

## Planned Tasks (drafts; created after the merge)

1. Find what to simplify: code-health snapshot, the experiment code, and the "before" pictures; delivers the ranked list for the owner's pick.
2. Remove CAMS and Yale.
3. Remove the two experiment switches and leave the made-up experiences out of the public build.
4. Simplify the code the owner picked.
5. Set the load-size budget and trim the weight.
6. Trim the full browser run, prove the lite check, archive one-off tools and old briefs.
7. Before/after comparison, Design reconciliation and the owner's look.

Tasks 2, 3 and 5 can run side by side; task 4 waits for the owner's pick from task 1; task 7 is last.

## Boundaries

**In scope:**
- Everything in the Success Conditions.

**Out of scope:**
- New features; phone frame-rate or start-up work; a better Milky Way photo (I-026); stacked story markers (I-031); adding donor planets or moons (I-032); the deploy itself.
