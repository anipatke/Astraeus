---
id: I-201
title: Owner preview serves stale or mixed code
type: guardrail
status: resolved
source:
  kind: report
  actor: {role: owner, session: orchestrate-g024-20261122}
  at: '2026-11-22T03:42:37Z'
tasks: []
checks: [C-210]
guardrail_ids: []
severity: medium
resolution:
  disposition: verified
  check: C-210
  actor: {role: checker, session: check-o089-20261122}
  at: '2026-11-22T03:49:38Z'
  reason: 'Proof Needed met: tool copy (port/pid-file only changed) in a scratch repo with a stand-in vite: second start stopped the first and left one server; a new commit and a branch switch each restarted it with --force; SIGTERM cleaned up; browser-policy rule present; owner preview on 5490 untouched and serving 200.'
history:
  - at: '2026-11-22T03:42:37Z'
    actor: {role: owner, session: orchestrate-g024-20261122}
    kind: observed
    note: 'During the O-089 T-422 look the planets page on localhost:5490 hung on loading twice ("stuck on loading", "is still spinning"). Cause 1: the dev server had run 19 h across many branch changes. Cause 2: the coordinator detached the main checkout to fcde39b5 and back to compare behaviour while the server ran; Vite kept a timestamped old developerPanels.tsx and the page failed with "does not provide an export named DeveloperDrawer". Owner: "can we clean this up so it never happens again".'
  - at: '2026-11-22T03:42:37Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: repair_attempted
    note: 'Direct repair on branch o089-slim-viewer-coordinator: tools/owner-preview.mjs + npm script preview:owner (stops an earlier preview via a pid file, starts vite on 5490 with --force, polls git branch+commit every 2 s and restarts with a fresh cache on change); docs/agents/browser-policy.md rule (start it fresh before every owner look; never switch/detach/stash the main checkout to compare while the owner may look; use a worktree on another port). Ran: start -> 200; git checkout --detach HEAD -> "the checkout changed ... restarting", then back to the branch -> restarted again, app.html 200 after; a second npm run preview:owner -> "stopped the earlier preview", new server 200. ESLint + Prettier clean on the tool. Unverified: Windows/macOS (pid-file kill and the .bin/vite path are POSIX-tested only); a server not started by this command still blocks the port (the tool says so and exits).'
  - at: '2026-11-22T03:49:38Z'
    actor: {role: checker, session: check-o089-20261122}
    kind: rechecked
    note: 'C-210 CLEAR (O-089 Full Objective Check). Code read against Proof Needed; independent scratch run of tools/owner-preview.mjs (port 5591, own pid file, stand-in vite): start served; second start "stopped the earlier preview" and one server remained; empty commit and branch switch each restarted with force=true; SIGTERM removed the pid file and stopped the child. Non-blocking: a double restart within one vite exit window could orphan a server; SIGKILL of the supervisor orphans vite; POSIX only.'
    check: C-210
---

# Owner preview serves stale or mixed code

## Problem

The owner's preview on localhost:5490 was a plain `vite` dev server left running for days. It served stale modules after many branch changes, and a checkout switch under it produced a mixed module graph that hung the page on loading.

## Proof Needed

Starting the owner preview is one command that always serves the current checkout: running it twice leaves one server; switching the checkout's branch or commit while it runs restarts it with a fresh cache and the app page loads afterwards; the browser policy tells agents to start it before each owner look and not to switch the main checkout while the owner may look.

## Repair Routing

Direct repair (Out-Of-Scope Repair) on the O-089 branch; the O-089 Full Objective Check verifies it.
