---
id: O-095
title: Group labels tap, and the phone sheet gets out of the way
status: done
depends_on: []
release: G-025
last_check: C-217
priority: high
rank: 1
---

# O-095: Group labels tap, and the phone sheet gets out of the way

## Outcome

A tap or click on a point group's shown label selects that group with exactly the result of choosing it from the object list on that screen size (belt #33). On a phone, pressing a panel button that turns the camera closes the open sheet so the visitor sees the move (belt #27), and a host can switch a single panel button off and on again with `ActionsControl.setEnabled(actionId, enabled)`.

## Why

Most visible breaks first (G-025 order). The belt app has up to 25 groups whose labels do nothing, and today copies the engine's internal phone rule with a 350 ms timer to close the sheet itself. Owner decisions 2 and 3 in G-025.

## Success Conditions

- A tap on a group label selects the group through the existing selection path: on a wide screen the card opens as from the object list; on a phone it selects as a phone list choice does.
- Body label taps behave exactly as before (existing picking tests still pass unchanged).
- A drag that starts on any label orbits or pans; only a press within the existing tap slop (`MOUSE_TAP_SLOP_PX`, `TOUCH_TAP_SLOP_PX`) selects.
- Labels stay out of the tab order; the object list is the keyboard path, stated in the README.
- On a phone, an actions button whose input turns the camera closes the open panel or sheet before the camera moves; a button without a camera leaves the sheet open; wide screens are unchanged.
- `setEnabled(actionId, false)` disables the button (not focusable as a press, `disabled`), `true` restores it; an unknown id throws `bad-part` naming the id. README, API lock and CHANGELOG updated.
- A failing-before test per behaviour, and browser checks at 1440x900 and 390x844 for the group-label tap, a drag over a label, and the phone sheet closing.

## Design Confirmation

Owner confirmed this design on 2026-11-22 (planning session plan-g025-20261122), with G-025 decisions 1 to 6.

## Architectural Considerations

- Picking stays in `app/scenePicking.ts`: the general rule is "any listed object with a shown label is a tap target"; a non-body object becomes a label-only candidate. No group-dot hit-testing.
- Selection goes through the viewer's one selection module; the picker does not open cards itself (ARCH-02: the interface reads State, never changes it).
- The sheet rule belongs to the panel rule (`shell/panels/`), not to the actions part: the actions part reports that its press turned the camera, the panel rule decides on a phone to close. The shelf part never imports the shell's internals beyond the shelf contract (viewer-interface note, section 11).
- `setEnabled` follows the existing `ActionsControl` shape and API-04/API-05 (typed, `SceneError` codes).

## Boundaries

**In scope:** group-label picking, the phone sheet closing on a camera-turning action, `ActionsControl.setEnabled`, their tests, README, CHANGELOG and API lock.

**Out of scope:** a note under a button; an opt-out for the sheet closing; label keyboard focus; individual dots inside a group; any restyling.

## Decisions

- 2026-11-24, owner: "Orchestrate O-95". Standing orchestration rules: own branch, Sonnet builders run in parallel (the three steps share only CHANGELOG/README lines), optional step checks waived, the coordinator marks steps done when gates pass, owner look on localhost:5490 for T-441 and T-442 before one Full Objective Check.

## Closure

Full Objective Check C-217 CLEAR on 2026-11-24 (no Issues). Owner looked on localhost:5490 and said "Both work, carry on" (T-441, T-442; acceptance recorded against C-217). Marked done and merged by the coordinator under the owner's "Orchestrate O-95" (standing rule: CLEAR → merge and push).
