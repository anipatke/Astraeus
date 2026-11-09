---
id: I-159
title: Design.md not reconciled for the O-061 host-call drift notes
type: drift
status: resolved
source:
  kind: check
  check: C-157
  actor: {role: checker, session: o061-check-20261110}
  at: '2026-11-09T22:39:31Z'
tasks: [T-285, T-287, T-288]
checks: [C-157, C-158]
guardrail_ids: []
severity: low
resolution:
  disposition: verified
  check: C-158
  actor: {role: checker, session: o061-recheck-20261110}
  at: '2026-11-09T22:42:48Z'
  reason: Repair proven by C-158 (CLEAR).
history:
  - at: '2026-11-09T22:39:31Z'
    actor: {role: checker, session: o061-check-20261110}
    kind: observed
    note: 'Found by the O-061 Full Objective Check against the AGENTS.md project rule "Deferred Design reconciliation". T-285 and T-287 deferred Design notes "before the Full Objective Check"; `git diff bb7a9c8c..HEAD -- .savepoint/Design.md` is empty and Design.md still describes the pre-O-061 behaviour.'
    check: C-157
  - at: '2026-11-09T22:40:51Z'
    actor: {role: planner, session: o061-run-20261110}
    kind: repair_attempted
    note: 'Design.md: new "Host calls land in order (O-061...)" paragraph after "One handle, one lifecycle" (order rule, hostCameraRequest slot, always opt-in, shared seek re-base, setSelected/bad-selection, nested-publish re-read; T-288 cover moot, T-286 test note non-architectural per I-160); "Views of one scene" rule sentence now names always: true. Also O-061 Outcome no longer names the cover; CHANGELOG heading reworded. No code change, so C-157 gate and browser runs stay reusable. Left open for the recheck.'
  - at: '2026-11-09T22:42:48Z'
    actor: {role: checker, session: o061-recheck-20261110}
    kind: rechecked
    note: 'Proof Needed met, by C-158 (CLEAR): Design.md "Host calls land in order (O-061 ...)" covers the order rule and the hostCameraRequest slot, the always opt-in, the shared seek re-base, setSelected/bad-selection and the nested-publish re-read, each matching App.tsx, sceneCamera.ts openFirstFrame, AstraeusShell.tsx applyViewRule and select effect, views.ts, viewerSelection.ts and viewerLink.ts publish at c5028ab1; "Views of one scene" names always: true; "One handle, one lifecycle" no longer contradicts the code; every T-284..T-288 drift note is reflected, non-architectural (T-286, I-160) or moot (T-288 cover). No code changed since C-157, so its gate, browser and health evidence were reused.'
    check: C-158
---

# I-159: Design.md not reconciled for the O-061 host-call drift notes

## Summary

O-061 changed the host-control seam and the view camera rule, and two Task drift notes asked for Design.md to be updated before the Full Objective Check. Nothing in Design.md changed on the branch, and two of its paragraphs now say the opposite of the code.

## Evidence

- Violated rule: AGENTS.md, Astraeus Project Rules, "Deferred Design reconciliation" (each deferred note reflected in Design.md or marked non-architectural with a reason, before the Full Objective Check).
- `git diff bb7a9c8c..HEAD -- .savepoint/Design.md`: empty. `grep -n "hostCameraRequest\|setSelected\|bad-selection\|always\|noteSeek" .savepoint/Design.md`: no hits.
- T-285 Drift Notes: reconcile the order rule (one extra slot `controls.hostCameraRequest`, read by the opening view in `app/sceneCamera.ts` `openFirstFrame` and by the view rule in `shell/AstraeusShell.tsx` `applyViewRule`; reset by `App.tsx` `chooseView` at each switch) into "Interfaces and Data Flow". Not done.
- T-287 Drift Notes: reconcile `ViewerHandle.setSelected(id | undefined)`, the `bad-selection` code, `selected` no longer read-only, and `ViewerLink.publish` re-reading state after a nested host publish (`api/viewerLink.ts` lines with `#publishes`). Not done.
- Stale Design text: line 56, "Views of one scene" says the per-view camera rule "runs once per switch ... only when the camera's followed or focused object is not in it"; the `always: true` opt-in (`api/views.ts` `cameraOf`, `AstraeusShell.tsx` view-switch effect) now applies it on every switch to such a view. Line 37, "One handle, one lifecycle", lists the selection part as `selected`, `onSelect` only, with no host selection path.
- Not reflected either: T-286's one re-base path (`App.tsx` `hostSeekTo` calling the shell's `story.noteSeek` through the `storySeekNote` ref), and T-288's cover drift notes, which should be marked moot (cover removed by the owner) rather than left unaccounted.

Expected: an O-061 accounting in Design.md (as O-059 and O-024 have) with one line per drift note, reflected or non-architectural with a reason, and the two stale sentences corrected. Actual: none.

Missing test evidence: not applicable (documentation reconciliation); a re-check reads Design.md against the drift notes.

## Proof Needed

Design.md "Interfaces and Data Flow" carries an O-061 paragraph covering the host-call order rule and its `hostCameraRequest` slot, the `always` view opt-in, the shared seek re-base, `setSelected`/`bad-selection` and the nested-publish re-read; the "Views of one scene" and "One handle, one lifecycle" sentences no longer contradict the code; each T-285..T-288 drift note is accounted for (T-286's test note and T-288's cover notes may be marked non-architectural or moot, with the reason). No code change is needed, so the C-157 gate and browser runs stay reusable.
