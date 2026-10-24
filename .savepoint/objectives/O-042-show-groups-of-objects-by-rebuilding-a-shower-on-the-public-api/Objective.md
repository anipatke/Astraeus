---
id: O-042
title: Show groups of objects by rebuilding a shower on the public API
status: done
depends_on: [O-041]
release: G-011
---

# O-042: Show groups of objects by rebuilding a shower on the public API

## Outcome

The meteor showers demo (Perseids, with the Geminids one switch away) is rebuilt in place so its code uses only what `npm install astraeus` offers. The public API learns to draw a group of many objects as one thing (each dot on its own listed orbit, one colour, dot size, menu item and info card), and the other things the shower is the first story to need: a Sun-centred scene, an orbit line for any body that circles the Sun (planets, Earth's year, a comet's whole orbit), your own body from published orbit elements (Phaethon), enlarged planets in the readable scale, a body label that starts off, an activity curve (timeline glow and a live rate bar), a looping year, an ecliptic "up" and the camera's zoom-out reach. Each new call is documented on `/api`, tested on a made-up configuration and used by `examples/hello-scene`. The shipped meteor orbit files get smaller with no visible change.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Same approach as O-041: a real consumer decides what the group API needs.

## Success Conditions

- `packages/astraeus-demo-showers/src` imports only `astraeus`; the boundary test enforces it.
- A comparison test shows the rebuilt Perseids and Geminids match their pre-rebuild definitions (objects, group count/colour/dot size/sampled member positions, events, panels, window, rates, scales, opening view, loop, view-up, reach, enlargement), differing only where a decision below allows or as flagged to the owner.
- The engine names no shower code: `packages/astraeus/src/experiences/showers/` no longer exists; the list switch the planets demo also uses has a generic name and home.
- The orbit files are trimmed (Decision 5), both page sets re-measured, and their limits lowered to the new size plus 5%, rounded up to the next 10,000 bytes; no limit raised without the owner's OK.
- Every new export has a doc comment and a place on `/api`, is tested on a made-up configuration (ARCH-03), and `examples/hello-scene` uses the group call from the packed tarball.
- The owner has looked at both showers on the preview (desktop and phone); the Full Objective Check passes with one `npm run check:browser`.

## Decisions

Owner, 2026-10-24, O-042 planning interview (proposal drafted the same day):

1. **Developer extras dropped** ("Drop them (Recommended)"): the "All orbits / Reliable only" buttons and the `?span=` and `?orbits=` address options go; the stream always shows all orbits (today's default); the published quality rule and counts stay in the stream's known limits.
2. **Your own body from published elements** ("Add 'your own body' command (Recommended)"): a public call adds a body from orbit elements with provenance (Phaethon for the Geminids), thin over the existing elements-body support.
3. **Groups are lists of orbits only** ("Lists of orbits only (Recommended)"): `addGroup` takes listed orbits (measured or made-up), with seeded placement along each orbit and an optional clump near a body; made-up spreads and moon sets stay internal.
4. **Stream card** ("Rate stays a bar, radiant becomes text (Recommended)"): a `rate` readout kind fed by the activity curve; the radiant's RA/Dec becomes a line in the stream's description.
5. **Trims and limits** ("Both trims, then tighten limits (Recommended)", after asking "Whats the visual impact of this change" — none): the lossless record-id trim and dropping the three quality columns (only the dropped switch read them); this is the owner's DATA-01 OK to rewrite the two shipped orbit files; limits then lowered to the new measurement plus 5%, rounded up to the next 10,000 bytes.
6. **As O-041** ("Yes, same as Apollo (Recommended)"): rebuilt in place; camera menu automatic (about 17 items; "Focus parent" becomes "Focus Swift-Tuttle"/"Focus Phaethon"; "Whole orbit" leaves the menu, the comet's orbit stays reachable from its top bar); no display switches placed; standing run rules (step Checks waived, coordinator marks done, one owner look at both showers, one Full Objective Check with one browser run). Owner standing instruction: "merge and push when its clear".
7. **Gaps found by the rebuild** (owner, 2026-10-24, "Add a small fix step first (Recommended)"): T-176 returned REPLAN REQUIRED; a new step T-177 adds the Solar system scale for enlarged Sun-centred scenes, safe planet-series loading through `mount`, `clump.near` on own bodies and `refillSliceMs` to the public API before T-176 resumes.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040. Shower data and its settings readers stay in the showers demo; the site keeps its own shower switch and page label and is given the rebuilt scene's `toDefinition()`. A tracked path in a Sun-centred scene is refused with a named error rather than half-supported.

## Boundaries

**In scope:**
- Public groups on the existing points layer, their tests, the rebuilt shower and its reference entries
- Renaming `packages/astraeus/src/experiences/showers/showerChoice.ts` (a generic list switch the planets demo also uses) to a generic name and place, with any shower-only part moving to the showers demo, so the engine names no shower code (owner, 2026-10-24: "yes add them to the plans")
- Measuring the Perseids and Geminids page sets and trimming (Decision 5); any limit raise needs the owner's OK (owner, 2026-10-24: "Look for trims in the shower part (Recommended)")
- The non-group calls the shower needs (Outcome), proven on a made-up configuration

**Out of scope:**
- New group kinds the engine does not already draw; public made-up spreads and moon groups (Decision 3); shower data in the engine (it stays with its demo); the shower stutter (owner, 2026-10-23: dropped)
- Own pictures, event or pick listeners, a public custom Developer panel, public alternates or switcher; moving the planets demo to the public API; lossy data trims or picture downsizing; O-041's engine leftovers; publishing a release
