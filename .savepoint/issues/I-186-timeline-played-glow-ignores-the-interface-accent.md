---
id: I-186
title: The timeline's played glow keeps the old orange and ignores the interface accent
type: defect
status: resolved
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-330, T-331]
checks: [C-191, C-192]
guardrail_ids: [API-06, STYLE-07]
severity: medium
resolution:
  disposition: verified
  check: C-192
  actor: {role: checker, session: recheck-o079-20261121}
  at: '2026-11-21T05:06:30Z'
  reason: 'C-192 CLEAR: the default played glow is built from var(--astraeus-accent) (color-mix at the old opacities), a host interface.accent reaches the token, a Developer-set played colour still overrides (timelineGlowAccent.test.ts); the lookDrift TypeScript scan fails against the HEAD~1 timelineGlow.ts.'
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: DEFAULT_TIMELINE_GLOW.playedColor is "#fc6323" (shell/timelineGlow.ts:30), drawn as the inline --glow-played gradient; the accent is now #e8b06a and LookInput.interface.accent is documented to colour the played timeline. The drift check does not see colours computed in TypeScript.'
    check: C-191
  - at: '2026-11-21T04:42:13Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Repair: DEFAULT_TIMELINE_GLOW names no colour (color and playedColor optional, unset by default); glowGradient builds an unset part from its look token, color-mix(in srgb, var(--astraeus-accent) N%, transparent) for the played part and var(--astraeus-glow) ahead, at the same opacities as before, so the browser resolves them at the viewer root and a host interface.accent (set there as --astraeus-accent by interfaceLookVars) recolours the played glow. A colour set in the Developer drawer still draws rgba() of that colour. look.css gains the internal token --astraeus-glow: #cfe0ff (the ahead colour, unchanged); interfaceLook.ts INTERNAL_LOOK_COLOURS.glow lets the drawer''s picker show it; App.tsx glowColoursShown shows the set colour or the token in force (accent for played). Strategic check: lookDrift.test.ts gains ''look drift in TypeScript'': every non-test .ts/.tsx under src/shell is scanned for typed colours in strings; outside shell/look/ none may stand, inside it each must equal a look.css token value; named trip samples include the old playedColor: ''#fc6323''. One KNOWN entry left for an owner decision: shell/bodyFeatures.ts featureColor fallback ''#ffffff'' (place markers; the stylesheet already falls back to --astraeus-text); removing it means changing the existing assertion in sceneMoonPanelPlaces.test.ts:147, which I did not do. New tests/timelineGlowAccent.test.ts (default gradients read the tokens and type no colour, with and without a rate; host accent reaches the token; a set played colour overrides at equal opacities). Existing apollo11 tests/timeline.test.ts ''glows evenly at the steady brightness'' kept its input and now expects the token form at the same opacities (0.37 and 0.622): its old expected strings pinned the orange. Computed-look baseline regenerated (look:lock). CHANGELOG 0.9.5 (proposed) line added. Gates green.'
    check: C-191
  - at: '2026-11-21T04:51:54Z'
    actor: {role: executor, session: repair-o079-c191-20261121}
    kind: repair_attempted
    note: 'Coordinator decisions (orchestrate-o079-20261121, recorded as instructed): (1) accepted that shell/bodyFeatures.ts featureColor fallback ''#ffffff'' stays as the one named KNOWN exception, with its reason, in the TypeScript colour scan; (2) accepted the changed expected strings in packages/astraeus-demo-apollo11/tests/timeline.test.ts ''glows evenly at the steady brightness'' (input unchanged; the old strings pinned the replaced orange); (3) accepted the computed-look baseline regenerated with npm run look:lock (only phone-place justify-content and the glow gradients changed).'
    check: C-191
  - at: '2026-11-21T05:06:30Z'
    actor: {role: checker, session: recheck-o079-20261121}
    kind: rechecked
    note: 'C-192: Proof Needed met; closed as verified.'
    check: C-192
---

# I-186: The timeline's played glow keeps the old orange and ignores the interface accent

## Summary

O-079's "one look" says every part is styled only from the look settings, and the note maps `#fc6323` to the accent. The timeline's played part is still drawn from a hand-typed `#fc6323` in TypeScript, so every demo with a timeline shows the old orange beside the new amber, and a host that sets `interface.accent` does not recolour it, although `InterfaceLook.accent` says it covers "the played timeline".

## Evidence

- `packages/astraeus/src/shell/timelineGlow.ts:28-31`: `DEFAULT_TIMELINE_GLOW = { color: "#cfe0ff", playedColor: "#fc6323", ... }`, comment "keeps the accent".
- `src/shell/TimelineBar.tsx:158-163` sets `--glow-played` inline from `glowGradient(..., "played")`; `src/shell/parts/timeline/timeline.css:77-79` draws `.timeline-glow-line { background: var(--glow-played) }` under a comment saying "in the accent colour".
- `src/api/look.ts` `InterfaceLook.accent`: "Highlights: a pressed control, focus, the played timeline. Default `#e8b06a`."
- Check probe (temporary file, removed): `expect(DEFAULT_TIMELINE_GLOW.playedColor.toLowerCase()).toBe(DEFAULT_INTERFACE_LOOK.accent)` fails (`#fc6323` vs `#e8b06a`).
- `tests/lookDrift.test.ts` scans CSS and `style={}` objects only, so a colour literal in a `.ts` that feeds an inline style passes.
- Out of this Issue: `app/bodySet.ts` `highlightColor: "#fc6323"` is 3D drawing, outside the reset.

## Proof Needed

- The played glow follows `--astraeus-accent` by default (for example a played colour unset by default and the gradient built in CSS from the token, or the token read for the default), and a host's `interface.accent` changes it; the Developer drawer's played-colour setting still overrides it when set.
- A test fails when an interface colour default in `src/shell` TypeScript differs from, or bypasses, the look tokens (extend the drift check or add a named case), per the project's strategic-fix rule.
