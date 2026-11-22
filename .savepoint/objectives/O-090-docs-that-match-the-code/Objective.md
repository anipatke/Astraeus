---
id: O-090
title: Docs that match the code
status: planned
depends_on: [O-086, O-087, O-088, O-089, O-091, O-092]
release: G-024
priority: medium
rank: 13
lanes: [{key: docs, title: Documentation, one Task at a time}]
---

# O-090: Docs that match the code

## Outcome

The root README, the API reference intro, the engine README and the guides state current facts, and counts that drift (workspaces, browser steps, timings, sizes) come from source-owned definitions or tests rather than prose.

## Why

AH-38 (all three): the README says five workspaces (13), VSOP87A planets (DE441 fits), a browser check "under a minute" with two journeys and "Later: package the engine"; the API reference opens "0.2 preview" on 0.9.5; several docs repeat 230 s. Design.md mixes history with current state.

## Success Conditions

- Every contradiction listed in the review fixed; history moved under clearly marked history headings or linked notes.
- Counts and scenario lists linked to source definitions, or checked by a test.
- A read-through against the code by a fresh session finds no false statement in the top-level docs.
- The owner's documentation-trim plan (Decisions below) is carried out in its order: browser and verification guidance first, public entry points second, architecture trimming third; every known contradiction has a named authoritative source; a future change to a browser tier, package version or public API has one obvious place to update; an independent read-through answers "How do I run the right checks?", "How do I build and extend my first scene?" and "Where is the current contract for this subsystem?"; before/after word counts of the edited current guides, the duplicated claims retired and any deliberate duplication kept (with its reader) are reported, with no percentage target.

## Architectural Considerations

Read-by-section rule for Design.md and the engine README.

## Boundaries

**In scope:**
- README, API reference generator intro, engine README, guides under docs/, Design.md current-state sections.

**Out of scope:**
- Rewriting archived history or Savepoint records; historical audit reports, scientific provenance, licence notices and raw evidence stay at their existing paths.

## Decisions

- Owner 2026-11-22 (G-024 decision 8): "consider this a final objective" — the documentation-trim plan below is O-090's scope; O-090 runs last in G-024 (depends on every other G-024 Objective; rank 13). Plan as given by the owner:

  Owner, 2026-11-22: "consider this a final objective" — proposed plan for trimming Astraeus documentation (to be folded into O-090, run last).
  1. Establish which document owns each fact (contradictions list in Task evidence; sources: manifests/release config for packages+versions; O-086 gate guidance + browser policy for commands; runner/gate-limits/dated run summary for browser scenarios, limits, timings; exported types+doc comments via generated API reference for the consumer surface; Design for boundaries, subsystem guides for detail). Check inbound links, generated sections, package requirements and tests that consume material before removing it (e.g. README generated error table, tests parsing browser-limit tables).
  2. Consolidate browser and verification guidance first: root README gets the shortest local invocation; browser policy keeps tier selection; trim docs/BROWSER_CHECKS.md to what each class protects, how to diagnose, where runner/limits/results live; keep retired-scenario→replacement mapping where it explains coverage; remove copied elapsed-time claims (cite dated runs, label measurements, keep thresholds distinct from observations); add a short evidence-lookup instruction; reconcile table-reading tests with O-088. Check: from the root README a maintainer finds the command, what it covers, and a measured result; a timing threshold has one maintained source.
  3. Shorten public entry points: root README (keep product, demos, provenance principle, setup, links; drop obsolete roadmap incl. "package the engine"; replace asset inventory with links; verify workspace/provider descriptions); engine README (keep install, first scene, React/headless, lifecycle/errors, optional data, links; review "Bodies and paths" and "Looks, controls and views" first; move unique guidance before cutting; replace module tour with a contributor link that works from npm); generated API reference (drop hard-coded "0.2 preview" intro; version from manifest at generation; keep symbol/error coverage; check links from repo and npm). Check: a newcomer runs it from the root README; a package user builds a first scene and finds an advanced option; packed README, examples and API page agree.
  4. Trim architecture and specialist guides by section: Design/component map (keep purpose, boundaries, lifecycle ownership, decision rationale; replace inventories, sequences, dated gate results with links); packaging/release guides (current procedure easy to find; mark one-time experiments and dated sizes; resolve package counts against release config); scientific docs (correct provider descriptions; preserve provenance, frames, time scales, uncertainty, limitations, reproducibility; date historical experiments); references (check inbound and section-qualified Task references; leave a pointer at an old heading where least disruptive). Check: overview → detailed contract in one link; historical claims identifiable; every removed passage has a home or a recorded reason.
  5. Verify: recheck the original contradictions (workspace count, planetary provider, browser workflow and timing, release status, API intro, package guidance) against code/config/generated output/dated evidence; build the API reference, inspect the packed README, check touched examples and links with the gates in force after O-086/O-088 and the browser policy; an independent fresh read-through with three questions ("How do I run the right checks?", "How do I build and extend my first scene?", "Where is the current contract for this subsystem?") recording the path and any ambiguity; report before/after word counts for edited guides, duplicated claims retired, deliberate duplication kept and its reader; no percentage target; mandatory Full Objective Check.
  Out of scope (kept at their paths): historical audit reports, Savepoint records, scientific provenance, licence notices, raw evidence.
  Order: browser guidance first, public entry points second, architecture trimming third. Strongest acceptance criterion: a future change to a browser tier, package version or public API has an obvious place to update, and readers reach the right answer from where they start.

- Planning 2026-11-22 (orchestrate-g024): seven Tasks T-434..T-440 follow the owner's five steps in order, one at a time on branch `o090-docs-that-match-the-code` (they share files, so no parallel lanes): T-434 fact-owner map (`docs/README.md`) and contradictions list; T-435 check guidance; T-436 root README; T-437 engine README and API page lead; T-438 Design trim; T-439 packaging, release and science guides; T-440 recheck, fresh read-through, word-count report. Step checks waived under the standing rules; one mandatory Full Objective Check. Builders on the larger model (owner prefers Fable/Opus for cleanup work).
- Coordinator 2026-11-22: T-434's out-of-scope findings widen T-435 (runner comment), T-436 (site-copy provider claims, a false public claim fixed under "Strategic fix first") and T-439 (check-packs comment); `NOTICE` (C6b) is a licence notice and stays for the owner.
- Owner 2026-11-22: "Fix the NOTICE too, drop VSOP87" — `packages/astraeus/NOTICE` line 14 now credits the JPL Horizons curve fits only (commit 64eb7f9e); orb.js keeps its credit in `licenses/orbjs-MIT.txt`. Resolves T-434 C6b.
