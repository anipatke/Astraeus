---
id: C-081
scope: {kind: objective, id: O-024}
result: NEEDS WORK
checked_by: {role: checker, session: o024-full-check-20261019}
executed_session: o020-orchestrator-20261018
checked_at: '2026-10-19T10:40:00Z'
health_snapshot: sha256:20dc7b4b7420ecf6f242971cb98320de2a0cb5a5e772e63cd6045385dcfc44ce
reviewed:
  base_commit: 1707f21
  head_commit: 1707f21
  files:
    - src/main.tsx
    - src/shell/SwitchControl.tsx
    - src/shell/bootLoader.ts
    - src/experiences/showers/showerChoice.ts
    - tools/validate/public-addresses.mjs
    - tools/validate/run-full.sh
    - vercel.json
    - .savepoint/Design.md
  dependencies: []
issues: [I-041, I-042]
supersedes: null
unmet: [gate-typecheck, design-reconciliation]
---

# C-081: O-024 Full Objective Check

Owned Tasks: T-091, T-092, T-093, T-094, T-095, T-102, all `done` (T-091/T-094/T-095 Quick Checks C-073/C-074/C-075 CLEAR; T-092, T-093, T-102 Task Checks waived by the owner).

**Result: NEEDS WORK.** Two small, in-scope gaps: the type-check gate fails, and Design.md was never reconciled. Everything behavioural passed.

## Scope lock
1. Objective Success Conditions 1-4 and the Task Done When items. 2. Gates in `quality_gates`, the full browser run, `git diff --check`. 3. Cross-Task integration (Showers switch + year + loader + addresses + removal of Earth–Moon). 4. Design reconciliation. 5. Material means a failing configured gate or a Success Condition unmet.

## Evidence (run fresh in this session, HEAD 1707f21 + uncommitted O-024 tree)
- `npm run typecheck`: **FAIL**, `tests/homePage.test.ts(3,66) TS7016` (I-041). T-093 recorded typecheck ok before adding `public-addresses.mjs`.
- `npm run build`: ok. `npm test`: 74 files, 1098 passed, 1 skipped. `git diff --check`: clean.
- Full browser run `docs/evidence/o024-check-full-20261019T101826Z` (`tools/validate/run-full.sh`, 796 s): all 22 steps exit 0, error-lines 0, including lite, showers-perseids, showers-geminids (both through the switch), public-showers, public-addresses, story-panels, phone, view-link, sky. No screenshots written.
- Health: `savepoint health check O-024` → snapshot above; does not block clearance; coverage and tests evidence reported stale (optional, observation only).

## Success conditions
1. One Showers address, switch in top bar, shower in view link, only chosen shower's data: met (showers scripts, view-link, T-091 evidence; reload used, recorded as drift).
2. Earth–Moon experience, story file, checks removed, nothing else broken: met (files gone; remaining `earth-moon-canvas` test id is a legacy element id, engine parts kept as intended; grep finds no live retired addresses outside the retired-address list).
3. Shelf, links, titles show three demos; picture baseline withdrawn by owner decision (T-102): met by `public-addresses` dangling-link scan and `homePage` tests.
4. Browser checks via the driver for the switch both ways, desktop and phone; full run passes: met. Owner look: pending on the preview.

## Cross-Task / probes
- Old addresses `shower-perseids`, `shower-geminids`, `earth-moon` appear only in `RETIRED_ADDRESSES` and a harmless query label in `browser-controls.mjs`. No redirects, per Decision 4.
- `vercel.json` has the immutable `/assets/` rule and none for HTML; covered by `publicBuild` test.
- No `.screenshot(` call remains under `tools/validate`.

## Findings
- **I-041 (blocking):** configured typecheck gate fails (missing typing for `public-addresses.mjs`).
- **I-042 (blocking):** Design.md reconciliation missing. It still lists `earth-moon/`, `?experience=shower-<name>`, the picture/contact-sheet steps; the T-091 and T-094 drift notes had no integration Task.

## Owner validation still needed
T-092 (`owner_validation.required`, no acceptance recorded), T-093 (accepted_check empty): the owner opens the home page, each demo and plays the Showers year. Carried-forward owner decisions: C-073 and C-074 acceptances (T-091, T-094) are unchanged in scope; they still apply.

## Observations (non-blocking)
- The whole O-024 tree is uncommitted, so `git diff` evidence is weak (project rule: commit at Objective close; commit before the recheck).
- Jupiter card picture is a placeholder until O-025.
- Scale-toggle scenarios run only on the dev-only `synthetic` experience (T-093 limitation).
- No Code Style findings recorded (no STYLE rule violations noticed in the files read).

## Full Check Progress Checklist
- [x] Establish Scope · [x] Freeze The Check Scope · [x] Turn Acceptance Into Invariants · [x] Coverage matrix (Tasks × gates × demos, via the full run) · [x] External boundary (preview and dev servers started and stopped by run-full) · [x] Workflow lock (build, test, browser run) · [x] Adversarial pass (old addresses, caching, screenshots) · [x] Verify File Reality (named files exist) · [x] Verify Evidence And Gates · [x] Code Health · [x] Issues Pass · [x] Materiality · [x] Code Style
