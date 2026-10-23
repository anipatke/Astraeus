---
id: O-030
title: Switch showers in place without a page reload
status: in_progress
depends_on: []
release: G-007
---

# O-030: Switch showers in place without a page reload

## Outcome

Pressing Perseids or Geminids (and a planet in the local nine-planet demo) changes over inside the running page: the loading animation covers the moment, then the new one appears, with no reload and no blank flash. The Showers page downloads only the chosen shower's story text (this Objective absorbs O-029).

## Why

Owner, 2026-10-18 ("Yes add the rest"). T-091 switches by reloading the page (its allowed fallback); the owner noticed "a slight pause and screen goes blank between". O-029 (owner, 2026-10-18): `showerDefinition.ts` loads every `data/stories/*/panels.json` up front through an eager glob, while the planets already load only their own story through `STORY_PANELS` in `src/main.tsx`.

Planning, 2026-10-23: the one generic `SwitchControl` (`src/shell/SwitchControl.tsx`) serves both demos and reloads with `window.location.assign(switchAddress(...))`; `src/main.tsx` builds the definition once (`chooseDefinition`) and renders `<App>` once. The public site's planets page offers Jupiter alone (no switch); its Showers page has the Perseids and Geminids switch.

## Success Conditions

1. **In place.** Choosing another option keeps the page: the new definition is built and mounted, the old scene and its data are released; it opens at its own start view and time, except that a switch with `keep: ["t"]` (the planets) keeps the clock time, as today.
2. **Address.** The address and view link update as today (`switchAddress`); back and forward move between choices in place, without a reload.
3. **Generic.** The switch stays one shell part with no shower or planet names (ARCH-01), proven with a made-up experience (ARCH-03); the loading animation (O-024 T-094) covers the change.
4. **One story.** The Showers page fetches only the chosen shower's panels file; the load budget lists and limits it.
5. **Proof.** Fast tests for the address, back/forward and one-story rules; the meteor journey switches to the Geminids and proves the page did not reload and the new stream is drawn; memory measured once over about 20 switches and recorded in evidence (not a standing check); the owner's look on the preview; configured gates; the Full Objective Check runs `npm run check:browser` once.

## Confirmed Decisions (owner, 2026-10-23)

1. **Next Objective**: "Shower switch + one story", folding O-029 into this one; O-029 is retired (deleted; git history keeps it).
2. **Scope**: "Both demos": the one shared switch changes for showers and planets alike.
3. **During the switch**: "Loading animation covers it": the same loading cover as first open, no old-scene hold.
4. **Proof**: "Tests, journey step, one memory reading, your look".
5. **Plan** (owner, "Yes, write these steps"): three steps in sequence (both code steps edit `src/main.tsx`): one story first, the in-place switch next, the owner look and Design last.
6. **Dependency** (owner, 2026-10-23, "Drop it"): O-024 is dropped from `depends_on`; it closed by owner exception, its loading animation is built and in use, and this Objective's own Full Check covers it during a switch.

## Architectural Considerations

The entry owns choosing and building a definition (`src/main.tsx`); the switch asks it to rebuild for a new address instead of reloading, through a generic callback (no experience names in the shell). React remounts the app for a new definition (a key), so the canvas and its GPU resources are disposed by unmount; anything module-level that a definition caches (planet series, curve-fit chunks, measured orbits) is either kept deliberately (shared, recorded) or released. Scientific State stays per definition (ARCH-02). Story panels for showers come through the same lazy glob the planets use.

## Boundaries

**In scope:**
- The switch's behaviour, back/forward, the loading cover during a switch
- Lazy loading of a shower's story panels
- The load budget, one journey step, Design notes

**Out of scope:**
- The meteor orbit file format (O-026)
- Which showers or planets are offered (the public site keeps Jupiter alone)
- Anything visitors see changing other than the flash going away
