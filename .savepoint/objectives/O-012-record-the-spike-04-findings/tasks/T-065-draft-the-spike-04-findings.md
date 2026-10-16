---
id: T-065
title: Draft the Spike 04 findings
objective: O-012
status: done
depends_on: []
owner_validation: {required: true, accepted_check: C-044, accepted_by: {role: owner, session: owner-chat-20261017}}
planned_by: {role: planner, session: o012-plan-20261016}
---

# Draft the Spike 04 findings

## Outcome

`docs/ASTRAEUS_SPIKE_04.md` answers each of the six Definition of Done questions in `docs/ASTRAEUS_SPIKE_04_BRIEF.md`, each answer backed by named tests, browser evidence, Check records or audit rows.

## User Check

Read the findings note. For each question you can see a plain answer and click through to its evidence. The note doesn't claim more than the evidence shows, and the open items (the ground view, owner looks still pending) are stated.

## Done When

1. Owner direction 2026-10-16: "Draft the Spike 04 findings", queued overnight while O-011 awaits owner looks; it may need a touch-up after O-011 closes, which the note says at the top.
2. Six sections, one per brief question:
   - capabilities reused;
   - abstractions that failed or proved insufficient;
   - capabilities added or changed, and why;
   - evidence they are reusable (synthetic or alternative configurations, contract tests);
   - remaining limitations;
   - whether a second shower works mostly through configuration (the Geminids, T-039 and C-033).
3. Every claim links to a commit, a test file and case name, a Check record (C-###), an evidence directory, or an audit row in `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`. A claim with no evidence is written as an open question, not as a fact.
4. Data provenance is stated plainly: GMN is public; CAMS and Yale are local only; dot places are illustrative. The ground-observer gap is recorded.
5. Same style as `docs/ASTRAEUS_SPIKE_03.md`.

## Context Files

`docs/ASTRAEUS_SPIKE_04_BRIEF.md`, `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`, `docs/ASTRAEUS_SPIKE_03.md`, `docs/ASTRONOMY_VALIDATION.md`, `.savepoint/Design.md`, `.savepoint/checks/` (C-022 onward).

## Design References

All of Design.md (reading for reconciliation, not editing).

## Guardrails

PROV-01, TEST-03.

## Implementation Plan

1. Read the brief, the gap audit and the Checks.
2. Map each Definition of Done question to its evidence.
3. Write the note, then list in Drift Notes any Design.md gap found (no Design edits here).

## Boundaries

Documentation only: no code, no Design.md edits, no new Checks.

## Technical Verification

Link check (every referenced path exists). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-16 by a builder session (no Check written, Task not set to done, nothing committed or staged, router untouched). Output: `docs/ASTRAEUS_SPIKE_04.md`, draft banner at the top, six sections plus data provenance, open questions, recommendations (labelled) and an evidence index.

Per criterion: (1) draft banner states O-011 owner looks are pending and a touch-up may follow. (2) Six sections in the brief's order. (3) Every claim cites a commit, test file and case name, Check, evidence directory or audit row; gaps are listed as eight Open questions (T-056 has no Check; I-024/I-026/I-029 and T-036/T-037 read only through builder evidence or the T-040 drift table; C-013 rests on an owner exception; CAMS permission unanswered). (4) Provenance stated: GMN public CC BY 4.0, CAMS and Yale local only, dot places illustrative; ground-observer gap recorded. (5) Structure follows `docs/ASTRAEUS_SPIKE_03.md` (short intro, numbered sections, evidence).

Link check (node, 2026-10-16): every backticked repo path under docs, src, tests, tools, data, .savepoint and every cited commit hash was tested for existence.
Output: `paths checked 78 commits 20 missing []`

Read: brief, gap audit, stream and sky data note, asset architecture (first 60 lines), Spike 03 note, Checks C-014, C-026 to C-033 (coverage sections), T-040 and T-056 evidence, O-011 Objective, Design.md (grep). Test case names taken from `grep` of the test files named in the note.

Limitations: documentation only, no gates run. Claims were taken from Check records, not re-verified.

### Refresh 2026-10-17

Refreshed `docs/ASTRAEUS_SPIKE_04.md` against HEAD `cd40140` (`git log 1022055..HEAD`, `.savepoint/checks/` to C-041, `.savepoint/issues/`). Documentation only; nothing committed, staged or router-edited. Changes:

1. Banner: now says the note was refreshed against `cd40140` and that I-019, I-022, I-030 are repaired but open, I-031 open.
2. Short answers 3 and 5: added the post-C-026 additions; added stacked markers (I-031) and CAMS and Yale local-only wording; noted the contract list was not re-audited after C-026.
3. Section 3 table: T-056 row now cites C-035 CLEAR, the owner's ship-and-default decision, and `3e1d130` (Geminid GMN, I-030). New rows: story panels (T-059 C-038, T-061 C-040, T-062 C-041; I-031), lazy planet loading (`1eb8b05`, I-022; 3,041.8 to 1,185.1 kB main chunk, `docs/evidence/i022-20261016T115528Z/`), timeline window shape (`c19aacf`, I-019), view links and Developer panel (`721d95a`, T-058, C-037), HYG stars (`cbc920d`, T-060, C-039), NASA Earth and Moon maps (`a2f82e0`, I-029).
4. Limitations: Data terms rewritten (GMN 25,588 Perseids and 51,115 Geminids, HYG v4.2 CC BY-SA 4.0 star file only, ESO, NASA maps; CAMS and Yale local); test gap updated (`tests/showersMeasuredGeminids.test.ts` exists, but as a second file, not discovery); added stacked markers (I-031) and the load-sensitive 30,000-member fill test (I-030 history).
5. Data provenance: GMN default and shipped; CAMS switch hidden in public builds; Yale replaced by HYG in public builds.
6. Open questions: 2 rewritten (T-056 has C-035; I-030, I-019, I-022 still no Check); 3 notes the Issues are still open; 8 closed (owner decision in T-056); added 9 (owner reading of panels and HYG sky) and 10 (I-031).
7. Recommendations and evidence index: Geminids test file noted; C-034, C-035, C-037 to C-041 added; open Issues listed.
8. Link check (node, 2026-10-17): 67 backticked repo paths and 30 commit hashes tested; missing []. No gates run.

Not changed: "T-056 has no Check" appears nowhere now; the T-036/T-037 gap (open question 4) is unchanged because C-034 to C-041 do not cover them. Not verified by me: that panels (T-059) left `TimelineEvent` unchanged.

Design.md gaps noticed (for the owner; not edited):
- "Known open items" (about line 175) still describes the Spike 03 position (carried over from the first draft).
- `published` provenance type candidate is not in Design.md.
- Not checked whether Design.md describes story panels, the lazy planet loader (`src/core/planetSeries.ts`, `planetModels.ts`), the shipped data folder `data/stories/` with its licence allow-list, HYG stars, view links, or the one-shape timeline window; the first draft did not cover these and I did not grep Design.md for them.

### Design reconciliation 2026-10-17

Executor edit of `.savepoint/Design.md` only (no code, tests, data, router, Check or Task status touched; nothing committed). Changes:

1. Known open items rewritten: the stale Earth/Moon texture provenance line is gone; states I-019, I-022, I-024, I-029, I-030 resolved (owner accepted 2026-10-17), I-026, I-031, I-032 open, GAP-5 and the Earth-based view deferred, CAMS/Yale local-only, Full Objective Checks pending. A new Current Technical State paragraph records O-015/O-016 without restating gate counts.
2. Jupiter paragraph: now the Solar System Scope CC BY 4.0 map (I-024, `src/assets/bodies/jupiter.ts`).
3. `published` provenance type: does not exist. `ProvenanceSourceType` in `src/core/provenance.ts` has four members (ephemeris, observed, reconstructed, illustrative); "Open after O-011" now says so and leaves the fifth member to the owner.
4. New or updated Design text: lazy planet series (Planets paragraph, `src/core` row; `planetSeries.ts`, `planetModels.ts`, `planetNeeds.ts`, `main.tsx`); Texture rights rewritten (no local-only texture since I-029; empty `LOCAL_ONLY_TEXTURES`); sky paragraph (HYG default, `?stars=yale`, `checkStarAsset`, ESO/NASA picture source); window strip one-hump caption (I-019); new paragraphs Measured orbits from a second source (T-056, I-030), Story panels (T-059, T-061, T-062), Public site and launch (T-057, T-058, T-060, T-063, T-064); map rows for story panels, the public site files, `src/assets/stars/`, `data/local/` vs `data/stories/`, tools/validate additions, `docs/ASTRAEUS_SPIKE_04.md`.
5. Deferred notes accounted for: T-056 (GMN source, settings, switch, panel sentence, reliable rule): reflected, new GMN paragraph. T-057 (site/app page split): reflected, Public site paragraph and map row. T-058 (Developer panel tidy, none expected): non-architectural layout; its view links are reflected under Public site. T-059 (`storyPanels`, `parseStoryPanels`, `CrossingTracker`, `StoryPanelView`, `useStoryPanels`, `StoryMarkerLayer`, `SceneControls.storyMarkers`): reflected, Story panels paragraph; the integration Task that accounts for it is this reconciliation (T-065 / O-012), not T-063 as T-059 guessed (T-063 is a re-shoot). T-060 (HYG default, `?stars=`, `checkStarAsset`): reflected, sky paragraph. T-060 `.story-panel-close` selector note: non-architectural, a browser-script selector (`browser-sky.mjs`). T-061 and T-063/T-064 (none): nothing to account for; T-063's `look.startView` regression-script edit is a test change, and the `startView` setting is reflected. T-062 (`story.panels` in shower settings): reflected. T-062 stacked markers: reflected as open I-031. Checks C-038 to C-043 raise no Design drift (grep for design, drift, deferred, reconcil found nothing).
6. Not confirmed: that the owner's looks at panels/HYG sky are pending is taken from the Objective and Check text; the Milky Way picture is still off by default (`resolveSkySettings`), read in code. No gates run; counts not restated.

Extra reads beyond the listed files (targeted, to confirm facts): `src/core/provenance.ts` (source type union); `src/shell/storyPanels.ts`, `useStoryPanels.ts`, `src/app/StoryMarkers.ts`, `showerDefinition.ts`/`showerSettings.ts` story parts (panel contract, filtering, `PANELS_PATH`); `src/core/planetSeries.ts`, `planetModels.ts`, `src/app/planetNeeds.ts`, `src/main.tsx` (lazy load); `src/assets/sky.ts`, `skyModel.ts`, `tools/validate/public-build-assets.mjs` (HYG, star check); `src/assets/bodies/{jupiter,earth,moon}.ts`, `vite.config.ts`, `vercel.json` (textures, public build); `src/app/viewLink.ts`, `App.tsx` (view links); `src/shell/TimelineBar.tsx`, `timelineModel.ts` (hump and caption); `src/experiences/showers/measuredOrbits.ts`, `data/showers/*.json` (GMN source); `tools/validate/capture-site-pictures.mjs` header; issue front matter I-019..I-032.

### Touch-up 2026-10-17

Executor edit of `docs/ASTRAEUS_SPIKE_04.md` only, on the owner's instruction ("do the findings touch-up"), from C-044's two observations. Documentation only; no Design.md, code, test, data, router, Check, Issue or Task status touched; nothing committed or staged. Refreshed against HEAD `94ee998` (`git log cd40140..HEAD`). Changes:

1. Banner, short answers, section 3 rows, open questions 2 and 3, evidence index: I-019, I-022, I-024, I-029, I-030 now read "accepted by the owner 2026-10-17" (resolution `accepted`, an owner decision; stated as not a Check and not verified). I-026 stays open by owner decision (needs a better photo); a Milky Way limitation line added (off unless a sky setting turns it on: `milkyWay` defaults to false in `src/app/skyModel.ts`).
2. Swift-Tuttle panel badge `modelled` (owner, `94ee998`) and the kept IAU MDC plus AMS mix on the "Earth crosses the stream" panel are stated in the story panels row. The note stated no badge counts, so none changed.
3. I-032 (donor pictures traced, none shipped; `docs/DONOR_TEXTURE_INVENTORY.md`, `e5b7f08`, `8b3ad85`) added as a limitation; I-033 (lite and full browser tiers in AGENTS.md; `tools/validate/browser-lite.mjs`) added as a recommendation, marked process not engine.
4. `published` wording now matches Design: no such type, four members in `src/core/provenance.ts`; the decision is the owner's. Recommendation line says the same.
5. Section 6 and short answer 6: the zero-`src/` claim is stated as C-033's review of the T-039 working tree, and `1734bd8` also carries T-055's generic body code (C-044 observation 2).
6. C-044 added to the evidence index (CLEAR, owner reading pending). Full Objective Checks for O-011 and O-012 stated as running and pending; no result claimed.
7. Banner states HEAD `94ee998`, 2026-10-17, and that the note is a draft until the owner reads it.

Link check (python and shell, 2026-10-17): 100 backticked path tokens, 0 missing once four script names and two evidence directory names written relative to `tools/validate/` and `docs/evidence/` were resolved there; 32 commit hashes, 0 unresolved (`git cat-file -e`); 26 Check ids, 0 missing from `.savepoint/checks/`; every I-### cited exists in `.savepoint/issues/`. No gates run, no browsers or servers started.

Not verified: the owner's acceptance of the five Issues is read from the Issue files (status resolved) and commit `94ee998`'s message; the contents of the Full Objective Check runs are not read.

## Drift Notes

- Design.md "Known open items" paragraph (around line 175) still describes the Spike 03 position; it does not list the Spike 04 limitations (no ground view, local-only CAMS/Yale data, group-fill 10^4 miss from O-009). T-040 added a separate "Open after O-011" paragraph; the older paragraph is stale.
- Design.md does not say a `published` provenance type is an open candidate (it appears only in the T-040 drift table).
- Not an architecture gap but unchecked: T-056 (GMN source) has no Check, and T-036/T-037 were read only via the T-040 drift table. O-012's second Task (Design reconciliation) should decide.
