# Astraeus Spike 03 — Reusable UI Shell

This note records the shell implemented around the Astraeus scene and what the Spike 03 browser evidence covers. The implementation uses Apollo as a configuration stress test. The final visual judgement of the responsive screenshots remains with the owner.

## 1. Donor components reviewed

`docs/PLANETARY_EXPLORER_UI_AUDIT.md` records the source-by-source review of Planetary Explorer navigation, object selection, focus transitions, camera framing and gestures, projected labels, information panels, mobile controls, responsive layouts, metadata, provenance badges, visual tokens and state ownership. It classifies each KEEP, ADAPT, APP-SPECIFIC or REJECT and gives the Astraeus destination. The donor checkout stayed read-only.

## 2. Donor elements adapted

The shell adapts compact labelled controls and visible selection state; semantic native controls on mobile; smooth, interruptible focus/follow requests; projected labels; one shared on-demand detail panel; concise object facts; a textual provenance badge; and the donor's restrained dark palette. `docs/DONOR_PROVENANCE.md` records the adapted patterns and Astraeus files. No donor component or asset was copied. Donor code licensing remains unresolved, and no redistribution permission is claimed.

## 3. Donor elements rejected

Planet navigation, catalogue categories, intro globes, hard-coded Earth comparisons, hotspot rings, mesh rotation, fixed-axis camera mapping, CRT scanlines and the donor's tiny hit targets do not fit a time-driven astronomy scene. Tailwind, zustand, drei and donor font assets were not added. The UI uses Astraeus's existing camera/scene code, React state and scoped CSS. Sheet swipe gestures are not required; Close and Escape remain available.

## 4. New UI gaps filled

The shell adds a persistent timeline with play/pause, UTC time, rate, seek, event markers and previous/current/next context; configured object selection and overview/focus/follow controls; True/Readable selection and explanation; shared object/event details; and per-object provenance disclosure. Event times and selection drive existing app/engine operations. Responsive compact controls and a bounded mobile information sheet fit around the canvas and timeline. Metric Visuals provide optional numbers-first measurements with numeric-only fallback, documented in `docs/ASTRAEUS_METRIC_VISUALS.md`.

Time-ranged provenance is still missing: current provenance describes an object or event as a whole. Readable scale changes positions, not body radii. Both are recorded as future needs, not silently represented as implemented.

## 5. Reusable component and API model

`src/shell/experience.ts` defines `ExperienceConfig`: generic objects and availability, labels and descriptions, optional provenance/known limitations, camera presets, timeline events, time window, playback rates and event provenance. `AstraeusShell` receives that configuration, a `ClockSnapshot`, selected scale, app callbacks for play/rate/seek/camera/selection, optional live `metricsFor(objectId, timeUtcMs)`, developer controls and the scene as children.

The shell is split into `TimelineBar`, `ObjectControls`, `ScaleControl`, `InfoPanel`, `ProvenanceBadge` and `MetricVisual`. It owns presentation state such as current selection, camera preset and which information panel is open. The app remains responsible for trajectories, camera execution, scientific readouts and the physical/rendered scene. The shell contains no Apollo identifiers and does not change scientific State in response to presentation changes.

## 6. Apollo-specific configuration

`src/mission/apollo11.ts` supplies Earth, Moon, Columbia and Eagle labels; availability; camera presets; event list and mission window; playback rates; object descriptions; and provenance/limitation wording. `src/app/` supplies scene states and live measurements. Apollo-specific trajectories and text remain outside `src/shell/`. The existing 30 events exercise a denser timeline without a separate Apollo timeline implementation.

## 7. Responsive behaviour

At desktop widths, object/camera and scale controls share the top edge while the timeline stays at the bottom. At tablet widths (701–900 px), the toolbar and timeline wrap instead of adding a sidebar. At mobile widths (≤700 px), object and camera controls use a compact row, scale remains available, the info panel becomes a bounded bottom sheet above the timeline, and the timeline becomes a compact two-row control strip. At short mobile heights the toolbar yields space while an information sheet is open. The canvas remains viewport-sized beneath the overlays.

The screenshot set covers 1440×900, 1280×800, 768×1024 and 390×844, including the open mobile sheet. The automated checks confirm control bounds and tap-target sizes; whether the remaining visible canvas feels dominant is an owner judgement.

## 8. Accessibility decisions

Primary actions are native buttons/selects with labels; camera buttons expose pressed state; the timeline is a named region; the information panel has an explicit close action and Escape dismissal; and keyboard focus uses a visible outline. The responsive browser check measures primary touch controls at approximately 44 px or larger. Important controls do not require hover. These are basic implementation checks, not an accessibility certification or a contrast audit.

## 9. Camera and interaction lessons

Camera presets are generic requests configured by the experience. Selecting a camera changes framing only: browser evidence compares the UTC readout and physical mission readouts across overview, focus and follow. Selecting an object is allowed to open its information panel, but does not seek time. When a followed object leaves its configured availability interval, the app returns to an available overview. Pointer camera gestures remain on the canvas so shell controls can be used without starting a drag. Presentation and scientific state remain separate.

## 10. Provenance UX

A short textual status such as “Reconstructed” opens sources, accuracy, notes and known limitations on request. Object and event provenance use existing provenance data plus experience-provided context; status is not encoded by colour alone. Apollo wording preserves the distinction between published anchors and reconstructed intervals, names smoothed joins and cutoff residuals, and states Eagle's landing-site offset as a liberty. The panel is optional so it does not occupy the default canvas. Provenance is not yet time-ranged.

## 11. Storytelling requirements discovered

The event strip already answers “what just happened?” and “what is next?”; a future story layer should coordinate event/time selection with optional camera transitions, captions, temporary annotations, object visibility and scale presentation. It needs a clear policy for interruption by manual seek or camera input, and it must never imply that a camera or scale change altered the physical trajectory. Story steps should reference generic event/object IDs and existing provenance rather than duplicate their data. This spike adds no Story DSL, narration or automatic story cues.

Future Astraeus work should also consider time-ranged provenance for transitions between source regimes, an explicit Readable-scale radius treatment if comprehension requires one, and the imperative `Astraeus.Scene` developer API identified in the project intent. These remain separate from this shell.

## 12. Remaining UI weaknesses

The owner has not yet judged the screenshots. On mobile, the sheet and persistent timeline reduce the visible scene area while the sheet is open; the visual balance needs that review. Timeline context is intentionally ellipsized when space is tight, so the event list remains the route to full labels. Focus restoration and modal semantics have not been claimed; the information panel is non-modal. The browser run is headless and does not establish physical-device touch feel, accessibility certification, or contrast conformance. A non-Apollo Metric Visuals fixture proves those components can accept another experience's measurements, but the full responsive shell still needs a non-Apollo experience check.

## 13. Recommendation for the Perseids spike

Configure a small Perseids experience through `ExperienceConfig` and keep the same timeline, object/camera controls, scale, info and provenance surfaces. Use it to check whether meteor showers need a different event density, radiant selection, time-window presentation or temporary story annotations. Add only configuration or a narrowly generic primitive when the shower demonstrates that need. Keep scientific shower data and uncertainty in the experience adapter, retain numeric-only metrics when no honest visual reference exists, and verify the shell again at mobile and desktop sizes before claiming cross-experience reuse.

## Evidence

The headless browser outputs are in `docs/evidence/spike03/`, with machine-readable results in `docs/evidence/spike03/browser-results.json`. The named responsive browser script is `tools/validate/browser-spike03.mjs`; the current shell feature smoke is `tools/validate/browser-shell.mjs`.

On 2026-10-10 (Australia/Sydney), the responsive script passed at 1440×900, 1280×800, 768×1024 and 390×844, produced the eleven requested scene/layout screenshots at the default True scale, found no console or page errors, confirmed identical Metric Visual readouts under both scales and unchanged UTC/mission readouts under camera changes, and checked mobile/tablet target bounds plus keyboard focus. `npm run typecheck`, `npm run build` and `npm test` passed; Vitest reported 10 files and 170 tests. Build retains Vite's advisory for a minified chunk over 500 kB. Lint is not configured. The shell feature smoke passed after the responsive changes.

After the C-007 finding, I-011 restored `browser-spike02.mjs` and `browser-anchor-labels.mjs` against the current app. On 2026-10-10 (Australia/Sydney), the Spike 02 regression script passed at 1280×800: 6/6 True/Readable pairs, 6/6 camera-invariance cases, 30/30 event jumps, all four playback rates, a 30-sample 100× follow track, four USNO phase values (50.1%, 0.2%, 50.1%, 99.8%) and zero browser errors. The anchor-label script confirmed 0 labels when off, 40 when on and 0 after toggling off, also with zero browser errors. Evidence is isolated at `docs/evidence/regression-spike01-02/`; historical Spike 02 files were not overwritten. The independent Full Objective Check must verify these repairs. Visual review of the refreshed True-scale screenshot set remains pending.
