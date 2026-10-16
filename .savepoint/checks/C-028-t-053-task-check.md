---
id: C-028
scope: {kind: task, id: T-053}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t053-builder-2026-10-13-to-15
checked_at: '2026-10-15T08:02:00Z'
reviewed:
  base_commit: 3bbe640
  head_commit: 3bbe640 (working tree, uncommitted)
  files:
    - src/assets/sky.ts
    - src/app/skyModel.ts
    - src/app/SkyView.ts
    - src/app/AstraeusScene.tsx
    - src/app/App.tsx
    - src/app/experienceDefinition.ts
    - src/assets/textures/milky-way-left.jpg
    - src/assets/textures/milky-way-right.jpg
    - tests/sky.test.ts
    - tests/publicBuild.test.ts
    - tools/data/fetch-stars.mjs
    - tools/validate/browser-sky.mjs
    - tools/validate/public-build-assets.mjs
    - tools/validate/browser-earth-moon.mjs
    - tools/validate/browser-jupiter-io.mjs
    - tools/validate/browser-showers.mjs
    - docs/DONOR_PROVENANCE.md
    - .gitignore
  dependencies: [T-051]
issues: [I-026]
supersedes: null
---

# C-028: T-053 Task Check (Quick)

Checker: the O-011 orchestrator session. The Sonnet builder sub-sessions that built and reworked the sky are separate sessions.

## Scope Lock

1. Done When 1–6 of T-053, plus the owner's look (owner_validation required).
2. Changed files: the sky code, the tests and the validators listed above. Objective.md, T-038 and T-052 are planner edits from the 2026-10-13 replan, outside this Task's diff. I-026 is new.
3. Out of scope: replacing the Milky Way picture (I-026).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Star directions | Proven | `tests/sky.test.ts` covers the five named stars against catalogue RA/Dec to 1e-9 rad. The checker's own probe (`chk53/probe.test.ts`, 2026-10-13) puts Vega, Deneb and Sgr A* in the render frame within 0.0001°. |
| 2 Milky Way alignment | Proven (the transform); the picture is owner-accepted | Galactic→J2000 uses Astropy constants. The pole and the centre land within 0.5° in the test. The photo's own registration is only a few degrees: the owner accepted that and the softness for now, and filed I-026 (see Owner Acceptance). |
| 3 Invariance | Proven | The sky group follows the camera position, with depthTest off and renderOrder −1000. The tests cover a centre change, scale policy, rebase and follow target. Sky state lives only in presentation (ARCH-02). |
| 4 Made-up catalogue, licences, public build | Proven | A three-star catalogue test mounts. ESO eso0932a is CC BY 4.0, credited "ESO/S. Brunier" in the Sky item and in DONOR_PROVENANCE. Yale BSC is local only. The checker confirmed `data/local/` is git-ignored, `git ls-files data/local` = 0, the build exits 0, and `dist` has no catalogue content. The public-build validator asserts the same. |
| 5 Performance | Proven (owner-measured) | Software GL in the headless runs showed a 14–19% drop, which is not representative. The owner measured on their own GPU, 2026-10-15: "both over 90 on this machine which is ok for now". |
| 6 Browser validation | Proven | browser-sky, earth-moon, jupiter-io and showers exit 0 with zero console or page errors at desktop and phone. Fresh run directories: `docs/evidence/o011-t053-rework-20261014T093012Z/` and `docs/evidence/o011-t053-pop-20261015T073424Z/` (with the `sky-wording/` and `brightness/` subfolders). The historical `regression-spike01-02` evidence is unchanged (checker `git status`). |

Gates (checker, 2026-10-15T07:55–08:01Z): `npm run typecheck` exit 0; `npx vitest run` 593 passed; `npm run build` exit 0.

## Owner Acceptance (recorded with the owner's words, 2026-10-14/15)

- Stars: "stars are crisp...but could use a bit more pop?" This led to a brighter star curve. The owner then directed "should just be a brightness variable, remember our vission", which led to the `starBrightness` and `milkyWayBrightness` settings (0–2), URL parameters and live sliders. The owner's final word: "fine at one by default".
- Milky Way: "I like the idea of the milky way, we do need to find a better texture … have it in our assets with the ability to have milky way on or off … we could find better textures later". Owner decision (AskUserQuestion): "Off by default (Recommended)". This amends the Outcome's "default is on" for the picture only; stars stay on. The softness and the few-degree registration are accepted for now, and the follow-up is I-026.
- Frame rate: "both over 90 on this machine which is ok for now".
- Star positions: the owner asked whether the stars are accurate; the answer above was given with the Stellarium comparison route.

## Issues

- I-026 (new, builder-captured): the Milky Way picture is too soft beside the catalogue stars. Follow-up only, outside O-011's bar.

## Observations (non-blocking)

1. The picture's seam at galactic l=0 was not inspected at pixel level. It is off by default and is covered under I-026.
2. The owner has not separately confirmed the constellation shapes against a planetarium. Positions are proven to 0.0001° by an independent probe.
