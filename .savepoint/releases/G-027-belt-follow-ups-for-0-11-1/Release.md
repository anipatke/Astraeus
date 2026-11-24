---
id: G-027
title: Belt follow-ups, for 0.12.0 (planned as 0.11.1)
status: planned
---

## Outcome

Three follow-ups the belt app (`/home/user/code/belt`) found on astraeus 0.11.0 are done in the engine: a chart can no longer take the whole viewer down, and a failing shelf part shows a short message in its own place instead (belt #34); a chart's long axis label wraps inside its panel (belt #35); and a host decides which point groups carry a name label and can place its own labels, on a fixed point or on the dots of one or more groups, that take part in the label overlap rules and select what the host names when tapped (belt #36).

## Why

Owner, 2026-11-24: "some quick feedback to add ... as 0.11.1"; asked where to track it: "New goal for 0.11.1". The belt's brief (pasted that day, saved in planning session plan-g027-20261124) orders #36 first (owner-prioritised; it blocks belt Objective O-007), then #34 and #35 (found in the belt's O-006 browser check, evidence `/home/user/code/belt/docs/measurements/astraeus-0.11/T-018-chart-fault*`). G-025 (0.11.0) stays closed.

Planner findings, 2026-11-24 (session plan-g027-20261124):

1. **#34 reproduced as a loop in a unit test.** `shelf/chart/View.tsx` measures its mark labels in a layout effect after every draw and stores them in state; the rows (`markRows.ts`) follow the widths, the chart's height follows the rows. With the belt's input (marks 3:1, 8:3, 11:4 at 2.50, 2.52, 2.54 and a 44-character label at 2.82 on 2.00 to 4.00 au) the long label sits right at the width where it moves from row 0 to row 3 (about 216 chart units). In a browser the chart growing a row changes the panel's layout (a scrollbar, a new scale), the measured width moves by a few units, the row flips back, and so on. A happy-dom render whose label width depends on the chart's height (205 units when taller, 225 when shorter) throws React's "Maximum update depth exceeded" from `View.tsx:80` after 212 measures; with fixed widths the same chart settles (`viewBox 0 0 320 198`). Nothing catches a part's error, so the viewer's whole React tree unmounts. Test kept at `/tmp/claude-1000/-home-user-code-Astraeus/f266d901-c073-4eb8-baf9-350fdac2266d/scratchpad/g027/repro-34.test.ts.txt` (scratch; O-100's first Task writes the real one).
2. **#36: what the public API already allows.**
   - Bodies have `showLabel` (`AddBodyOptions`): it sets only where the label starts. The Labels display switch shows every object's label again (`app/displaySwitches.ts` `setLabels` clears the hidden set), and `?labels=<id>:on` does too.
   - Groups have no `showLabel` in `GroupInput`; the internal object a group makes (`api/group.ts`) could carry one in a line, as `ExperienceObject.showLabel` exists.
   - A group's label sits at its centroid at the last refill (`app/PointsView.ts`, `experienceDefinition.ts` "the centroid of its members"), so a ring or a swarm round the Sun is labelled near the Sun. Confirmed.
   - A group's shown name is already a tap target that selects the group (O-095, `app/scenePicking.ts` `pickCandidatesOf`, label only).
   - No public call places a label of the host's own: the placed labels that exist are sky-figure names (directions at infinity), places on a body's surface (`addPlaces`) and path anchors. A host cannot label a point in space or a set of groups today.
   - Selection is one id (`handle.setSelected`, `setCamera` toward one object). Nothing selects or frames several groups together.
   - Opening a panel exists (`handle.setPanel` for story panels, `part(panel).setOpen` for shelf panels), so a label's tap can reuse those paths; what is missing is a tap target to hang them on.
   - Labels already share one overlap and priority layout (`app/SceneLabels.ts`), which sky labels join as extra entries; a host label can join it the same way, with its own `labelPriority`.
   So the ask needs: `showLabel` on `addGroup` (tiny); one new kind of scene label (a fixed point, or a place on its groups' dots kept up at the refill cadence) in the existing label layer; and one genuinely new engine idea, a selection that stands for several groups (their combined dots framed by the camera, one card). Single-group and panel taps reuse existing paths.
3. **A new error code is a breaking change by this repo's practice**: 0.11.0 listed the new `no-webgl` code under its breaking changes ("A `switch` over `SceneErrorCode` needs the case"). See Decision 3.

## Decisions

Owner answers, 2026-11-24 (each asked separately; planner's options kept below for the record):

0. Order: "Chart first": O-100 before O-101, both in the same release.
1. "Same as bodies": a group's `showLabel: false` starts hidden and the Labels switch can show it; plus the rule that a group a host label is anchored on draws no label of its own while that label exists.
2. "Host's own card": a label on several groups opens a card the host gives, with the camera framing their combined dots.
3. "New code, release 0.12.0": new code `bad-label`; the Goal releases once as 0.12.0 (all nine packages, data peers `>=0.12.0 <0.13.0`).
4. "Yes, all groups": every group's own label is placed on its dots by the host-label rule (owner look on localhost:5490).
5. "Raise by 2,000 B": the engine's first-download gzip cap rises by 2,000 B, with the measured figure recorded as the reason, when O-101 needs it.
6. "Caption under the chart": option (a); T-457 may change exactly the three constants in `packages/astraeus/tests/chartMarkRows.test.ts` lines 79, 125, 131.
6b. "Allow the two" (2026-11-24, T-457): also `packages/astraeus/tests/chartMarkRows.test.ts` line 75 (`toBeGreaterThan(156)`) and `packages/astraeus/tests/chartSettles.test.ts` line 75 (`156 + extra`) change 156 to 136; nothing else.
7. "orchestrate": owner chose "Chart first ... it can be built while you answer" — O-100 runs under the standing orchestration rules (step checks waived, coordinator marks done when gates pass, one Full Objective Check).

Planner's options as presented:


1. **What a group's `showLabel: false` means.** (a) The same as a body's: the label starts hidden, and the Labels switch, the Developer toggles and `?labels=` can show it again (one word, one meaning, API-04). (b) What the belt asked: never drawn, the switch does not bring it back. *Recommend (a), plus one rule that gives the belt "never" without a second meaning: a group that a host label is anchored on draws no label of its own while that label exists (the host label stands for it, and the Labels switch turns the host label on and off instead).* The belt's groups are all covered by its host labels, so it gets exactly what it asked for.
2. **What a tap on a label anchored on several groups opens.** (a) A card the host gives on the label (title from the label, `description`, `provenance`), with the camera framing the groups' combined dots. (b) The first group's card. *Recommend (a)*: the first group's card would describe "Leading, largest" when the visitor tapped "Trojans ahead of Jupiter", and the card's provenance has to be about what was tapped (PROV rules).
3. **The error code for bad label input, and the version.** (a) A new code `bad-label`: one code, one cause (API-05), but by 0.11.0's own rule a new code is a breaking change, so the release becomes 0.12.0 (all nine packages, data peers `>=0.12.0 <0.13.0`). (b) Stay 0.11.1 by widening an existing code (the nearest, `bad-anchor`, is documented as a path anchor), which mixes causes. *Recommend (a) with the whole Goal released once as 0.12.0*, so the belt upgrades once. If the owner keeps 0.11.1, the planner will reuse codes per field (`bad-group` for a group's `showLabel`, `bad-anchor` widened to "a path or label anchor") and say so in the CHANGELOG.
4. **A group's own label on its dots.** The strategic fix for "a ring's label lands at the Sun" is to place every group's own label by the same rule as a host label anchored on that group, not only host labels. It moves existing group labels (the hello-scene ring, the made-up belt) onto their dots: a `Fixed` line, no API change, an owner look on `localhost:5490`. *Recommend yes.*
5. **The engine's first-download cap.** It is 525,880 of 527,000 B gzip (about 1.1 KB left). O-100 costs about +150 to +300 B (the part boundary is shell code; the chart's own code is in its own chunk). O-101 is estimated at +1.3 to +2.2 KB (input checks, the on-dots anchor, the label entries, the several-group selection), so it will very likely pass the cap. *Recommend raising the gzip cap by 2,000 B with the measured figure as the reason* (as the owner did for raw bytes on 2026-11-22), rather than moving label code into a lazy chunk that every scene with labels loads anyway.
6. **#35, how the axis label wraps.** (a) An HTML caption under the chart's SVG, wrapped by the shared panel CSS, with the SVG's bottom strip (where the one-line label sat) removed so no gap is left. Three existing assertions pin the old height and change only their constant: `packages/astraeus/tests/chartMarkRows.test.ts` lines 79 (`"0 0 320 156"`), 125 (`` `0 0 320 ${156 + height}` ``) and 131 (`"0 0 320 168"`). (b) The same caption, but the SVG keeps its height, so no test changes and an empty strip stays between the end ticks and the caption. (c) Several SVG lines, split by a measured or estimated width (measuring is how #34 happened; estimating misses the host's text size). *Recommend (a)*: no measuring, wraps like every other shelf text, and the existing `catalogue` browser check already puts a long word into every HTML text of the chart's panel, so it covers the caption with no change to the check.

Planner, 2026-11-24:

- **Order: O-100 (charts) before O-101 (labels)**, against the brief's order. O-100 fixes a fault that takes the whole viewer down on 0.11.0 for any host whose chart has close marks and a long label; it is small, needs no owner choice except Decision 6 for its last step, and can be built while the owner answers Decisions 1 to 5, which O-101 needs before its Tasks can be detailed. Both ship in the same release, so the belt's O-007 waits no longer either way.
- `selects` with one group id selects it exactly as the object list does; with a panel id it opens that story or shelf panel through the existing panel rule. Taps and drags on a host label follow the #33 rules (O-095).
- Browser proof of #34 at the belt's exact sizes is the belt's own check after release (as G-026 did): the loop depends on the browser's layout and font hinting, which a headless run may not hit. The engine proves the settling with a unit test that fails on 0.11.0.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package (chart view, shelf part mounting, group input, the scene label layer, picking and selection for host labels), its README, CHANGELOG, API lock and tests; the shelf catalogue page only if a part's documented input changes; a one-line note for the belt app naming the release.

**Out of scope:** hit-testing single dots inside a group; any change to how bodies' labels look or behave; the belt's "Tweaks and customisation" list; the belt app's own code; the version bump and publishing (the owner's release steps).

## Belt verification after release

The belt app upgrades, opens its #34 chart at 1440x900 and 390x844 (it draws, the viewer stays up), checks a long axis label wraps in a 360 px panel, and does O-007 from a separate brief written after the release.
