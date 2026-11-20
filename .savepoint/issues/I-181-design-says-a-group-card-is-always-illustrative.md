---
id: I-181
title: Design says a group's card source type is always illustrative, but measured-phase groups keep the caller's
type: drift
status: open
source:
  kind: check
  check: C-188
  actor: {role: checker, session: check-o077-20261120}
  at: '2026-11-20T08:32:30Z'
tasks: [T-323]
checks: [C-188]
severity: low
history:
  - at: '2026-11-20T08:32:30Z'
    actor: {role: checker, session: check-o077-20261120}
    kind: observed
    note: Found by the O-077 Full Objective Check during Design reconciliation; the executor's drift note judged Design.md to need no change.
    check: C-188
  - at: '2026-11-20T08:36:00Z'
    actor: {role: executor, session: exec-t323-20261120}
    kind: repair_attempted
    note: '.savepoint/Design.md "Answers for sites" now says the card is illustrative unless every orbit gives meanAnomalyDeg, then keeps the caller''s source type, sources and accuracy with the measured note and the two-body drift limit (matches listedGroupProvenance and groupLimitations). The diff touching this Issue is Design.md only; the same repair commit also carries the I-182 README/CHANGELOG/test change. Gates 08:34:09Z-08:35:50Z: lint, typecheck, build, npm test (4060 passed), check:engine-alone, check:pack all exit 0. Not verified by a checker.'
---

# I-181: Design says a group's card source type is always illustrative, but measured-phase groups keep the caller's

## Summary

O-077 made group placement two-mode: when every orbit gives `meanAnomalyDeg`, the group's card and `scene.groups[].provenance` keep the caller's `sourceType`. The live Design overview still states the old contract as current. The T-323 drift note says "Design.md 'Public API shape' needs no change", which is true of that heading, but the Full Objective Check's Design reconciliation (`docs/agents/verification.md`; Astraeus Project Rules, Deferred Design reconciliation) covers every Design statement the Objective's change contradicts.

## Evidence

- `.savepoint/Design.md:91` (`### Answers for sites`), last sentence: "A group's card source type is always \"illustrative\", with the elements' type in the accuracy line."
- Code now: `packages/astraeus/src/core/listedOrbitGroup.ts` `listedGroupProvenance(source, concentrated, measured)` returns `sourceType: source.sourceType` when `measured`; `packages/astraeus/src/api/group.ts` `groupCardProvenance` passes `isMeasured(input)`.
- Test proving the new behaviour: `packages/astraeus/tests/publicApiGroup.test.ts` "keeps the caller's sourceType on the card and in scene.groups, with the measured note and limit and the motion limit" (card `sourceType` "observed").
- The README was updated to match (`packages/astraeus/README.md:158`, "the caller's source type for measured positions, else illustrative"); Design was not.

Expected: Design.md states the two cases (measured-phase keeps the caller's source type with the measured note and limit; otherwise illustrative with the elements' type in the accuracy line), or points to where the current contract lives. Actual: Design states the old single case as current.

Missing evidence: none in tests (behaviour is proven); the gap is the Design record only.

## Proof Needed

1. `.savepoint/Design.md` no longer says a group's card source type is always illustrative, and its wording matches `listedGroupProvenance` and `groupLimitations` for both modes.
2. No code, test or fixture change in the repair (`git diff --stat` limited to `.savepoint/Design.md` and Savepoint records).
