# Planetary Explorer UI extraction audit — Spike 03

Audited 2026-10-07 for T-016 / O-005. Donor: `/home/user/code/planetary-explorer`, read only. This is a source audit, not browser or visual validation. The canonical scope is `docs/ASTRAEUS_SPIKE_03_BRIEF.md`, narrowed by O-005. Historical donor `docs/astraeus-extraction-audit.md` supplies context; current implementation governs decisions. `docs/design.md` redirects to `.savepoint/visual-identity.md`, which was also read.

KEEP means preserve a pattern; ADAPT means change its interface or behaviour; APP-SPECIFIC means leave the donor product feature there; REJECT means intentionally exclude the approach. None implies verbatim copying or cleared redistribution rights. Paths in the classification table are donor-relative; destinations are Astraeus-relative. A destination of “none” explicitly excludes extraction.

## Classified patterns

| Area / candidate | Donor source | Decision | Reason and adaptation | Astraeus destination |
|---|---|---|---|---|
| Navigation / object selection | `src/features/moon/ControlBar.tsx`, `src/app/store.ts` | ADAPT | Data-derived names and explicit selected state are useful. Replace planet navigation/reset with an object picker and overview/focus/follow requests. Selecting information must not silently seek time. | `src/shell/ObjectControls.tsx`; wiring in `src/app/App.tsx` |
| Parent/Main navigation and category strip | `src/features/moon/ControlBar.tsx`, `src/app/store.ts` | APP-SPECIFIC | Parent planet traversal and hotspot category filtering serve the donor catalogue, not the Apollo stress test. | none |
| Mobile semantic selection | `src/features/intro/MobileGlobeMenu.tsx` | ADAPT | Named native buttons and 44px-wide targets work without hover. Use a compact object list, not a fullscreen gallery. | `src/shell/ObjectControls.tsx` |
| Intro globes, planet groups and splash transition | `src/features/intro/MobileGlobeMenu.tsx`, `src/app/App.tsx` | APP-SPECIFIC | Hardcoded planet groups, textures and entry/return flow consume space and do not help a running timeline. | none |
| Body focus transitions | `src/features/hotspots/useHotspotSelection.ts`, `src/features/hotspots/HotspotAutoRotate.tsx` | ADAPT | Selecting a target starts a shortest-angle tween; drag cancels it. Preserve the smooth, interruptible intent, using camera target translation rather than changing body orientation. | existing `src/app/CameraController.tsx`; requests from `src/shell/ObjectControls.tsx` |
| Camera zoom tween / system framing | `src/features/moon/CameraController.tsx`, `src/features/moon/ControlBar.tsx` | ADAPT | A labelled wide view and gradual reframing are useful. Keep Astraeus overview/focus/follow and its floating-origin pipeline; derive sensible framing from scene targets, not donor per-planet zoom values. | `src/app/CameraController.tsx`, configured controls in `src/shell/ObjectControls.tsx` |
| Outer-zoom acceleration and Z-only camera | `src/features/moon/CameraController.tsx` | REJECT | Piecewise camera distance mapping and a fixed camera axis address the donor's compressed globe systems. They do not replace Astraeus scale policy or orbit camera. | none |
| Camera interaction / gestures | `src/features/moon/useGestures.ts`, `src/features/moon/GestureLayer.tsx` | ADAPT | Pointer capture, lower touch sensitivity, wheel/pinch zoom, cancellation and listener cleanup are useful. Astraeus already has these foundations. Bind gestures to the canvas host below the shell; UI taps must not start camera drag. Manual input should cancel scripted framing while follow can retain a moving target. | `src/app/CameraController.tsx`, canvas host in `src/app/App.tsx` |
| Drag rotates globe mesh | `src/features/moon/useGestures.ts`, `src/app/store.ts` | REJECT | Viewing rotation must not alter physical body orientation or orbit geometry. Retain camera orbit. | none |
| Labels / marker placement | `src/features/hotspots/HotspotMarker.tsx`, `src/features/hotspots/HotspotLayer.tsx` | ADAPT | HTML overlays stay readable; surface visibility hides far-side hotspots. Current marker source has dots, not a generic text-label engine. Use projected DOM labels for supplied render positions, with offscreen/behind-camera hiding and simple priority-based overlap suppression. Surface occlusion only applies when a surface normal is actually available. | `src/shell/Label.tsx` or label presentation helper, projection in `src/app/AnchorLabels.ts` |
| Hotspot category and ring dispatch | `src/features/hotspots/HotspotLayer.tsx` | APP-SPECIFIC | Category filtering, mesh parenting and ring-feature exclusions are coupled to donor content. Apollo needs bodies/craft and optional diagnostic anchors. | none |
| Hover / selection / keyboard focus | `src/features/hotspots/HotspotMarker.tsx`, `src/features/moon/ControlBar.tsx`, `src/app/globals.css` | ADAPT | Filled selected dots, warm accent hover and explicit focus rings communicate state. Preserve named buttons and reinforce colour with labels/pressed state. Donor 10–14px marker hit boxes and 32px controls need larger interaction targets, about 44px for primary touch actions. | `src/shell/style.css`, `src/shell/ObjectControls.tsx`, label/marker interaction where needed |
| Information panels | `src/features/hotspots/SidePanel.tsx`, `src/features/hotspots/BottomSheet.tsx` | ADAPT | On-demand title/content/Close with Escape preserves canvas space. One shared content renderer should serve object, event and provenance detail. Donor transformed hidden dialogs are not a complete focus-management solution: closed content must be unmounted or inert, Escape has one owner, focus returns to opener. Claim modality only when focus/background behaviour implements it. | `src/shell/InfoPanel.tsx` |
| Responsive layout | `src/features/hotspots/InfoPanelRouter.tsx`, `src/features/hotspots/SidePanel.tsx`, `src/features/hotspots/BottomSheet.tsx`, `src/features/moon/ControlBar.tsx` | ADAPT | Donor switches at `md`, with 360px desktop panel and mobile max-height 50vh. Retain drawer/sheet idea, but bound panels around a persistent bottom timeline and avoid duplicate mounted dialog content. Judge tablet/1280×800 as well as 1440+ and mobile; width alone is not evidence of canvas dominance. | `src/shell/AstraeusShell.tsx`, `src/shell/InfoPanel.tsx`, `src/shell/style.css` |
| Mobile dismissal | `src/features/hotspots/useSwipeToDismiss.ts`, `src/features/hotspots/BottomSheet.tsx` | ADAPT | Downward feedback and dismissal are useful, but whole-sheet touch handling competes with scrolling and interactive fields. Scope optional swipe to the handle; preserve Close and Escape and handle cancellation. Do not require swipe to access or dismiss information. | local behaviour in `src/shell/InfoPanel.tsx`, only if used |
| Typography | `src/app/globals.css`, `src/features/hotspots/BodyOverviewDetails.tsx`, `.savepoint/visual-identity.md` | ADAPT | Preserve heading/data contrast and restrained tracked headings; increase tiny donor labels and use readable prose. Font-family declarations do not prove font assets are bundled. | `src/shell/style.css` |
| Visual hierarchy | `src/features/moon/ControlBar.tsx`, `src/features/hotspots/BodyOverviewDetails.tsx`, `src/shared/components/Badge.tsx` | KEEP | Compact controls, clear title, short supporting text and quiet separators give progressive disclosure. Timeline/object-camera actions remain primary; events/scale/info one interaction away; provenance/debug on request. | `src/shell/AstraeusShell.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/InfoPanel.tsx` |
| Transitions / easing | `src/features/hotspots/BottomSheet.tsx`, `src/features/hotspots/SidePanel.tsx`, `src/features/moon/ControlBar.tsx`, `src/features/hotspots/HotspotAutoRotate.tsx` | ADAPT | Keep restrained 100–150ms control colour changes, 300ms panel transitions (sheet cubic-bezier below), and smooth camera settling. Reduce motion without disabling functionality; remove scene fade on selection so clock and geometry remain visible. | `src/shell/style.css`, existing `src/app/CameraController.tsx` |
| Metadata presentation | `src/features/hotspots/BodyOverviewDetails.tsx` | ADAPT | A name, short description and labelled fact rows are reusable. Supply units and scientific readouts from app adapters; replace hardcoded Earth comparisons/discovery text with experience content. Never compute physical facts from render positions. | `src/shell/InfoPanel.tsx`, `src/app/mission.ts`, `src/mission/apollo11.ts` |
| Earth width/volume comparison cards | `src/features/hotspots/BodyOverviewDetails.tsx` | APP-SPECIFIC | Educational globe comparison UI is not needed for timeline/craft provenance. No encyclopaedia or comparison-card framework. | none |
| Provenance status treatment | `src/shared/components/Badge.tsx` | ADAPT | Small bordered status text is useful, but the donor span has no disclosure behaviour. Use a labelled button such as “Reconstructed ⓘ” opening source, accuracy, notes and known limitations. Status must be textual, not inferred from colour. | `src/shell/ProvenanceBadge.tsx`, `src/shell/InfoPanel.tsx` |
| CRT overlay and decorative glow | `src/app/globals.css`, `src/features/moon/ExplorerView.tsx` | REJECT | Scanlines across the canvas and strong glow reduce legibility and astronomy contrast. Keep only a restrained optional control accent, not a full-scene effect. | none for CRT; restrained accent in `src/shell/style.css` |
| Shared state pattern | `src/app/store.ts` | ADAPT | Explicit selection and exclusive panel state are useful; per-frame zoom and donor registry/category/navigation state are not the shell contract. Keep a single selected object, panel choice and pending camera request, with scene state owned by the app. | `src/app/App.tsx`; shell props/actions |

No reusable timeline, simulation clock, previous/next event navigator or time-ranged provenance implementation was found in the reviewed donor UI. These are Astraeus gaps to fill using the existing clock/events/provenance, not donor capabilities. Sources beyond this scope are not claimed audited.

## Dependency decisions

These are decisions for this spike, based on the two local `package.json` files and reviewed source, not recommendations about the latest library releases.

| Dependency | Decision | Reason |
|---|---|---|
| Tailwind | Do not adopt | Donor utility classes implement a small set of layouts/tokens that plain scoped CSS can express. Astraeus has CSS already; adding Tailwind and its Vite plugin would expand setup without a needed capability. Translate patterns to `src/shell/style.css`; do not paste utilities that lack a compiler. |
| zustand | Do not adopt | One app owns clock, selection, scale and camera requests. React props/state plus existing refs are sufficient. Do not replicate donor global store or send per-frame camera updates through React. Reconsider only after a demonstrated separate consumer needs shared subscription. |
| drei | Do not adopt | The audited reuse is chiefly HTML panels and projected labels; `Html` alone does not justify another scene dependency. Existing Three.js projection and DOM layer are sufficient. R3F already exists and remains available; this audit does not require changing the scene renderer. |

No packages or font assets are installed by T-016.

## Visual token transfer

Put shell tokens in one scoped CSS source, not duplicated inline constants (STYLE-07). Preserve black canvas; use donor charcoal around controls. Token choices below are proposed implementation values, not a claim of measured visual success.

| Token | Donor evidence | Astraeus transfer |
|---|---|---|
| Colour | `globals.css`: bg `#121212`, surfaces `#0d0d0d` / `#0f0f0f`, borders `#1a1a1a` / `#222222`, text `#f0e6da`, accent `#fc6323` | KEEP palette for chrome, warm text and orange active/focus accents. Raise border/text contrast where necessary. Object colours come from configuration, not shell literals. Purple/green from visual identity are optional, not mandatory new statuses. |
| Type | Chakra Petch headings, Space Mono UI/data; headings tracked ~0.12em; source frequently uses 7–10px labels | ADAPT family stacks with system sans/monospace fallbacks. Use 12–14px controls/data, 14px+ prose, restrained 16–18px headings; tabular time values. Do not copy tiny uppercase body text. Exact font delivery/licensing must be resolved before adding assets; initial implementation can use fallbacks. |
| Spacing | Controls use 6–12px padding/gaps; detail panels ~20–24px padding; 360px side panel | ADAPT a 4px spacing rhythm: 4/8/12/16/24px, 12px viewport inset, ~44px primary tap target. Bound open side panel to min(360px, viewport allowance); mobile sheet at most ~50% usable height, accounting for timeline and safe area. Confirm with final screenshots. |
| Shape | Rounded full control group, rounded-xl sheet/cards, quiet borders | ADAPT pill control groups and ~12px panels; avoid ornamental card proliferation. |
| Motion | Side panel 300ms ease-out; sheet 300ms `cubic-bezier(0.32, 0.72, 0, 1)`; buttons 100–150ms; tween coefficient 4/s | ADAPT panel/control timings as CSS tokens. Keep Astraeus camera exponential target decay 5/s rather than importing donor mesh lerp. With reduced motion, remove panel travel and scripted tween where feasible. Camera rate is camera policy, not a CSS token. |

## Minimum shell and configuration boundary

Propose only components exercised by Apollo (STYLE-05); names are provisional, not a demand for separate files for every button:

- `AstraeusShell`: canvas-adjacent layout, primary controls and panel host.
- `TimelineBar`: play/pause, UTC time, rate, scrub, markers, current/previous/next event and expandable list. Event navigation can stay inside it; no separate playback/event framework.
- `ObjectControls`: picker plus overview/focus/follow; enabled actions depend on configuration.
- `ScaleControl`: True/Readable with an explanation that Readable pulls bodies closer at true size, so nearby craft can be drawn on top. Does not change `ScalePolicy`.
- `InfoPanel`: shared responsive object/event/provenance detail and accessible dismissal.
- `ProvenanceBadge`: compact disclosure into that panel.
- `Label`: generic supplied-label presentation using scene-projected positions and basic suppression, without a cartographic engine.

Keep developer diagnostics in `src/app/`, not a generic shell `DebugPanel` unless actual reuse later warrants it. Do not add generic tooltip/modal/card packages or a Story DSL.

Grow `MissionConfig` through a shell-facing `ExperienceConfig` projection. Preserve `bodies` as the app scene's trajectory descriptors, existing `events`, `window`, `rates`, `title` and `notes`; do not create a second event or provenance model. The following is a shape sketch, not compile-ready replacement types:

```ts
interface ExperienceConfig {
  title: string;
  notes: readonly string[];
  objects: readonly {
    id: string;
    label: string;
    color?: string;
    actions: readonly ("focus" | "follow")[];
    info?: { description?: string; facts?: readonly { label: string; value: string }[] };
    provenance?: Provenance; // existing core object, supplied from trajectory
    knownLimitations?: readonly string[]; // experience wording, no new accuracy model
  }[];
  events: readonly TimelineEvent[]; // existing core events
  window: TimeBounds;
  rates: readonly number[];
  cameraPresets: readonly {
    id: string;
    label: string;
    request: { kind: "overview" } | { kind: "focus" | "follow"; target: string };
  }[];
  eventInfo?: Readonly<Record<string, { description?: string; notes?: readonly string[] }>>;
}
```

The request sketch mirrors the current app `CameraRequest`; implementation should share a generic contract rather than make shell import a scene controller. `src/mission/apollo11.ts` supplies names/content and extra limitations; `src/app/` projects scene objects (including Earth/Moon) and per-trajectory provenance into config and passes live labelled readouts separately. The shell needs a clock snapshot and actions (play/pause/rate/seek), selected ID, camera action, scale ID/action, and panel state. It does not evaluate trajectories, rebase origins or derive physical distance from scaled geometry. Config does not contain camera/store instances or arbitrary mission dispatch functions.

Apollo's 30 existing events exercise density, current/previous/next context and overflow; retain event timestamps/IDs and build marker selection around them. Known limitations must come from current reconstruction records, including smoothed joins, published cutoff residuals and Eagle landing-site offset; this audit does not invent figures. Time-ranged provenance, automatic event camera cues and captions remain future story-layer needs.

## Current Astraeus UI disposition

| Current source | Disposition | Result |
|---|---|---|
| `src/app/App.tsx` | ADAPT composition | Keep runtime/scene wiring; replace stacked `.hud` with shell. Supply labels from config; keep scientific state outside shell. |
| `src/app/DebugControls.tsx` | REPLACE viewer UI; KEEP developer functions | Timeline adopts clock actions and current seek/play behaviour. Typed UTC entry, broad ephemeris window and extra diagnostic controls remain available behind developer toggle as needed. Preserve existing parser/seek utilities and their contracts rather than deleting tested helpers incidentally. |
| `src/app/DebugOverlay.tsx` | KEEP behind developer toggle | Preserve physical/render distance, vectors, frame/centre, orientation and floating-origin readouts. Default viewer does not show them. Keep timestamp formatting reusable. |
| `src/app/MissionPanel.tsx` | REPLACE default panel | Config title/notes go to context; useful distance/speed become selected-object readouts. Earth-centred range calculation remains app-side and must retain its unit/centre label. |
| `src/app/AnchorLabels.ts` | KEEP diagnostic anchors; ADAPT projection for generic labels | Raw NASA anchor IDs remain developer-only. Reuse projection/offscreen checks for object labels with basic overlap handling and config text. Do not reinterpret anchor IDs as timeline events. |
| `src/app/CameraController.tsx` | KEEP and refine | Preserve orbit/focus/follow, exponential target transition, distance limits and floating-origin coordination. Refine manual interruption/framing only as later tasks require; reject mesh rotation. |
| `src/app/style.css` | ADAPT / replace HUD styles | Retain canvas host and usable diagnostic styling; move viewer layout/tokens to scoped shell CSS. |
| `src/app/mission.ts`, `src/mission/apollo11.ts` | ADAPT config boundary | Preserve trajectories/readout helpers/events/window/rates, add shell-facing object/content/camera/provenance data through generic config. No core or generated-data changes. |

## Provenance and handoff

Donor code licence remains **unresolved; adapted code is local-use only**. Existing provenance records found no root licence or package licence declaration; the inspected donor package still has no licence field. No new licence search or legal clearance is claimed. KEEP/ADAPT decisions do not authorise publication or redistribution. `docs/DONOR_PROVENANCE.md` records the Spike 03 candidate source list; later implementers must record actual adaptations there.

This audit changes documentation only. Responsive proportions, contrast, gesture ergonomics, keyboard/focus behaviour, camera interruption and label suppression are design proposals that later implementation must test. Final owner visual validation and scene browser gates belong to those implementation tasks. No production behaviour, dependencies, donor files or scientific data changed here.
