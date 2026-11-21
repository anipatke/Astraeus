---
id: I-186
title: The timeline's played glow keeps the old orange and ignores the interface accent
type: defect
status: open
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-330, T-331]
checks: [C-191]
guardrail_ids: [API-06, STYLE-07]
severity: medium
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: DEFAULT_TIMELINE_GLOW.playedColor is "#fc6323" (shell/timelineGlow.ts:30), drawn as the inline --glow-played gradient; the accent is now #e8b06a and LookInput.interface.accent is documented to colour the played timeline. The drift check does not see colours computed in TypeScript.'
    check: C-191
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
