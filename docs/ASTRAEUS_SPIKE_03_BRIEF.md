# Astraeus Spike 03 — Reusable UI Shell

> Owner brief, supplied 2026-10-06. Canonical scope for G-003 / O-005. Planning decisions confirmed by the owner are recorded in `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`; where they narrow this brief, the Objective governs.

This is a **UI extraction + completion spike**, using Planetary Explorer as the donor and Apollo as the stress test.

We are continuing development of **Astraeus**, a lightweight TypeScript/Three.js engine for interactive astronomy storytelling.

Spike 01 proved the scientific state/rendering foundation.

Spike 02 proved that a fundamentally different sampled trajectory can use the same engine without Apollo-specific core logic.

The next weakness is the **interaction/UI layer**.

The current Apollo demo UI is functional but feels like debug tooling rather than a reusable astronomy experience. It also consumes too much canvas space at smaller viewports.

We already have useful interaction and presentation work in the existing **Planetary Explorer** project.

This spike should:

> **Extract the strongest reusable UI/interaction patterns from Planetary Explorer, adapt them to Astraeus, and fill the gaps exposed by Apollo.**

Do not redesign Astraeus core.

Do not polish Apollo into a bespoke Apollo website.

The output should be a reusable UI shell that can later be dropped onto a completely different experience such as Perseids.

---

# Objective

Prove that Astraeus can provide a **small, coherent set of reusable astronomy UI primitives** covering:

- time
- events
- object selection
- camera focus/follow
- scale
- contextual information
- provenance/uncertainty

without requiring each experience to invent its own interface.

The success test is:

> Could the same UI shell be reused for Perseids primarily through configuration rather than redesign?

---

# 1. Audit Planetary Explorer first

Before changing UI, inspect the existing Planetary Explorer implementation.

Identify reusable elements in:

- navigation / object selection
- body focus transitions
- camera interaction
- labels
- information panels
- responsive layout
- mobile behaviour
- typography
- visual hierarchy
- hover / selection behaviour
- gestures
- transitions / easing
- body metadata presentation

Classify each candidate:

```text
KEEP
ADAPT
APP-SPECIFIC
REJECT
```

Do not mechanically copy components.

Extract the underlying interaction pattern.

Previous donor work suggests some useful foundations already exist around:

- tweened focus
- camera gestures
- labels
- body selection
- compact information presentation
- responsive interactions

But verify against the current donor code.

---

# 2. Preserve the engine boundary

Astraeus UI must consume generic engine/application state.

It must not know about Apollo.

Prefer data such as:

```ts
scene.objects
timeline.events
clock
camera
scalePolicy
selectedObject
provenance
```

rather than:

```ts
apolloEvents
columbia
eagle
lunarLanding
```

Mission-specific labels/content belong in configuration.

---

# 3. Define the minimum Astraeus UI shell

Build a coherent shell around the canvas.

At minimum it should provide:

## Timeline bar

Primary persistent control.

Support:

- play / pause
- current date/time
- playback speed
- scrub/seek
- previous/next event
- visible event markers where practical

Avoid a giant developer-style debug panel.

## Object selector

Allow the experience to expose available objects such as:

```text
Earth
Moon
Columbia
Eagle
```

For Perseids this might later become:

```text
Earth
109P/Swift-Tuttle
Perseid stream
```

Selection should drive generic camera/UI state.

## Camera controls

Expose clear modes:

```text
Overview
Focus
Follow
```

Where relevant.

Do not expose implementation terminology.

Examples:

```text
Focus Earth
Follow Columbia
Earth–Moon overview
```

Camera transitions should reuse/refine the existing Astraeus camera behaviour and good interaction patterns from Planetary Explorer.

## Scale control

Expose:

```text
True
Readable
```

Make the distinction understandable to a non-technical viewer.

Readable scale must not imply scientific state changed.

A small explanatory tooltip/info affordance is enough.

## Context/info panel

When an object/event is selected, show useful information without covering large areas of the canvas.

Potential content:

- name
- short description
- relevant distance/speed
- event information
- current state
- data/provenance status

This should be configuration-driven.

Do not build an encyclopaedia framework.

## Provenance / uncertainty indicator

Spike 02 proved this is necessary.

A trajectory/object/event should be able to communicate statuses such as:

```text
ephemeris
observed
reconstructed
illustrative
```

The UI does not need to show a warning banner constantly.

Instead design a compact reusable affordance such as:

```text
Reconstructed ⓘ
```

which can reveal:

- source
- accuracy statement
- notes
- known limitations

The app must not silently present reconstructed data as measured truth.

---

# 4. Progressive disclosure

The canvas should dominate.

Target interaction hierarchy:

```text
Always visible
──────────────
timeline
play/pause
current time
primary camera/object control

One interaction away
────────────────────
events
scale mode
object list
info

Only when requested
───────────────────
provenance
technical detail
debug information
```

Move developer diagnostics out of the primary experience.

The existing debug overlay may remain available behind a debug/dev toggle.

---

# 5. Responsive behaviour

Explicitly test:

```text
desktop ~1440+
laptop ~1280×800
tablet
mobile portrait
```

The primary requirement:

> UI must not consume the astronomy experience.

At 1280×800 the canvas should still feel like the main product.

For smaller screens prefer:

- bottom sheets
- drawers
- compact menus
- collapsible panels

rather than permanent sidebars.

---

# 6. Reuse Planetary Explorer visual language where it works

Do not invent a new design system simply because this is a new project.

Reuse/adapt successful Planetary Explorer choices where appropriate:

- typography
- spacing
- transitions
- focus animations
- button treatment
- labels
- overlays
- dark astronomy-first aesthetic

But avoid carrying across app-specific navigation or content structures.

Astraeus should feel related to Planetary Explorer, not cloned from it.

---

# 7. Camera interaction

Planetary Explorer already contains useful camera/focus behaviour.

Extract/refine where appropriate:

- smooth target transitions
- sensible framing distances
- drag/orbit interaction
- zoom
- restoring manual control after scripted movement

Ensure UI-driven camera changes remain presentation-only.

Camera actions must never affect scientific State.

---

# 8. Labels

Evaluate Planetary Explorer's label implementation.

Create a generic label primitive suitable for:

- bodies
- spacecraft
- trajectory/event markers

Requirements:

- avoid obvious overlap where practical
- remain readable against space backgrounds
- optionally hide at unsuitable zoom levels
- not require mission-specific logic

Do not build a full cartographic label engine.

---

# 9. Event interaction

Apollo currently has 30 timeline events.

Use them as the stress test.

The interface should let a viewer understand:

```text
where am I in the story?
what just happened?
what happens next?
```

without opening a giant event table.

Explore:

- timeline markers
- previous/next event
- compact event title
- expandable event list

Keep the underlying event model unchanged unless a generic need is discovered.

---

# 10. Storytelling preparation — but no Story DSL yet

This spike should reveal what a future Astraeus story layer needs.

Capture requirements that emerge, such as:

- event selection
- automatic focus
- camera transitions
- captions
- temporary annotations
- scale changes
- object visibility

But **do not build the storytelling DSL yet**.

Document the emerging needs for a future spike.

---

# 11. Debug UI separation

Keep scientific/debug information available for development.

But separate:

```text
Viewer UI
```

from:

```text
Developer diagnostics
```

Developer mode may expose:

- raw state vectors
- physical/render distance
- frame
- centre
- floating origin
- interpolation
- reconstruction residuals
- FPS

None of this should dominate normal viewer mode.

---

# 12. Accessibility/basic usability

Keep this lightweight but deliberate.

At minimum:

- keyboard-accessible primary controls
- readable contrast
- sufficiently large click/tap targets
- visible focus state
- useful button labels/tooltips
- no critical interaction dependent solely on hover

Do not turn this spike into a full accessibility certification exercise.

---

# 13. Architecture

Prefer UI primitives/components such as:

```text
AstraeusShell
Timeline
PlaybackControls
ObjectPicker
CameraControls
ScaleControl
InfoPanel
ProvenanceBadge
EventNavigator
Label
DebugPanel
```

These names are illustrative.

Do not create components simply to satisfy this list.

Only extract primitives that survive actual use.

---

# 14. Configuration-driven experience

The Apollo experience should mostly supply configuration:

```ts
const experience = {
  objects,
  events,
  timeline,
  cameraPresets,
  info,
  provenance
}
```

The generic UI should render the experience from that information.

Avoid:

```tsx
if (mission === "apollo11")
```

inside reusable UI.

---

# 15. Preserve Spike 01/02 behaviour

Do not change scientific behaviour unless required by a reproduced defect.

Specifically preserve:

- Earth/Moon/Sun state
- body orientation
- illumination
- `Trajectory`
- `SampledTrajectory`
- `ScalePolicy`
- floating origin
- provenance data
- event physics separation

UI is a consumer of this state.

It must not become part of the scientific pipeline.

---

# 16. Visual review

This spike requires human visual inspection.

Automated/browser checks are useful but cannot determine whether the interface is actually pleasant.

Provide screenshots for at least:

```text
Earth–Moon overview
Apollo translunar coast
close Earth
close Moon
spacecraft follow
event/provenance open
mobile layout
1280×800 layout
```

The owner should be able to assess the design without running developer tooling.

---

# 17. Do not build

Exclude:

- Perseid implementation
- new astronomy models
- Apollo reconstruction improvements unrelated to UI
- full Story DSL
- narration engine
- CMS/content system
- generic design-system package
- npm publishing
- authentication
- preferences/accounts
- huge settings menus
- advanced accessibility framework
- VR
- terrain

This is a reusable astronomy interaction shell.

---

# Deliverables

## A. Planetary Explorer UI extraction audit

Create `docs/PLANETARY_EXPLORER_UI_AUDIT.md`. For each useful donor element record:

```text
source
KEEP / ADAPT / APP-SPECIFIC / REJECT
reason
Astraeus destination
```

## B. Reusable Astraeus UI shell

Implement the smallest coherent reusable shell.

## C. Apollo configured through the shell

Apollo should exercise timeline, events, object selection, scale, focus/follow/overview, info and provenance without Apollo-specific UI internals.

## D. Debug mode

Preserve existing technical diagnostics, but move them out of the default viewer experience.

## E. Responsive evidence

Capture representative screenshots and browser checks.

## F. Design note

Create `docs/ASTRAEUS_SPIKE_03.md`. Document:

1. donor components reviewed
2. donor elements reused
3. donor elements rejected
4. new UI gaps filled
5. reusable component/API model
6. Apollo-specific configuration
7. responsive behaviour
8. accessibility decisions
9. camera/interaction lessons
10. provenance UX
11. storytelling requirements discovered
12. remaining UI weaknesses
13. recommendation for the Perseids spike

---

# Success criteria

Spike 03 succeeds if:

1. The canvas is visually dominant on desktop, laptop and mobile.
2. A viewer can understand how to play, seek, change speed and move between important events without reading instructions.
3. A viewer can select/follow/focus objects through generic controls.
4. True vs Readable scale is understandable.
5. Provenance/uncertainty is discoverable without overwhelming the experience.
6. Developer diagnostics no longer dominate normal UI.
7. Strong Planetary Explorer interaction patterns are reused rather than unnecessarily rewritten.
8. Apollo-specific UI code is largely configuration/content.
9. The shell could plausibly be reused for Perseids without redesigning its fundamental interaction model.
10. Scientific State remains completely independent of UI behaviour.

The strongest success signal is:

> **If we remove Apollo data and plug in another astronomy experience, most of the UI still makes sense.**

Do not make Apollo prettier for its own sake. Use Apollo to prove that Astraeus now has a reusable interaction layer. Perseids is the intended next spike, to test whether the UI is genuinely reusable or an Apollo control panel.
