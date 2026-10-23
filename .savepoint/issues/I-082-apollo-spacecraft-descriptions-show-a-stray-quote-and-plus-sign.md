---
id: I-082
title: Apollo spacecraft descriptions show a stray quote and plus sign
type: defect
status: open
source:
  kind: check
  check: C-112
  actor: {role: checker, session: o041-full-check-20261024}
  at: '2026-10-23T22:20:00Z'
tasks: [T-169]
checks: [C-112]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-10-23T22:20:00Z'
    actor: {role: checker, session: o041-full-check-20261024}
    kind: observed
    note: 'Found by the O-041 Full Objective Check (C-112) on 6ae9fc58: the Columbia and Eagle descriptions built by buildApollo11Scene() contain the literal text `. "` + newline + `  + "The marker ...`, shown on both info cards of the default site demo.'
    check: C-112
---

# I-082: Apollo spacecraft descriptions show a stray quote and plus sign

## Summary

In the rebuilt Apollo 11 story (O-041 T-169), the mission note that moved into each spacecraft's description (Decision 2) is written as one template literal that was meant to be two joined strings. The joining code ended up inside the text, so the Columbia and Eagle info cards show `... round dots are NASA source anchors. " + "The marker is drawn larger ...`. Apollo is the site's default demo, so every visitor who opens a spacecraft card sees it.

Violated: T-169 Done When 3 ("mission notes live in the spacecraft descriptions") and the O-041 Outcome ("looks as it does today apart from the owner-approved changes"). A garbled note is not an approved change. TEST-01: the comparison test checks only that the description contains certain phrases, so the stray text passes.

## Evidence

- `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts:150-151`:
  ```ts
  const ABOUT_THE_DRAWING = `${APOLLO11_STATEMENT}. Lines are reconstructed samples and round dots are NASA source anchors. "
    + "The marker is drawn larger than the vehicle so you can see it, and is not to scale.`;
  ```
  The backtick string runs across both lines, so `"`, a newline, spaces, `+` and `"` are part of the value. It goes into `DESCRIPTIONS.columbia` and `DESCRIPTIONS.eagle` (lines 153-158).
- Shown through `packages/astraeus/src/shell/InfoPanel.tsx:44` (`<p className="info-panel-description">{view.description}</p>`). HTML folds the newline into a space, so the card reads `anchors. " + "The marker`.
- Reproduced by an independent probe that calls `buildApollo11Scene().toDefinition()`. The Columbia description is `"... round dots are NASA source anchors. \"\n  + \"The marker is drawn larger than the vehicle so you can see it, and is not to scale. Launch and splashdown ..."`, and `/"\s*\+\s*"/` matches it. Eagle's description uses the same constant.
- Expected: one clean sentence pair, e.g. `"... round dots are NASA source anchors. The marker is drawn larger than the vehicle so you can see it, and is not to scale."`
- Missing test: `packages/astraeus-demo-apollo11/tests/rebuildComparison.test.ts` "starts each spacecraft description with the old sentences and carries the mission notes after them" only uses `toContain("round dots are NASA source anchors")` and `toContain("not to scale")`.

## Proof Needed

- The two descriptions contain no `"`, `+` or newline left over from code, and read as plain sentences.
- A regression assertion in the Apollo tests, such as an exact expected note or a check that no description in the definition matches `/"\s*\+\s*"|\n/`, which fails on 6ae9fc58 and passes after the fix (TEST-02).
- Hand-off gates green. No browser run is needed for this text-only fix: the info-card text is read in the fast suite.
