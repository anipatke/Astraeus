# Astraeus reuse projects — proposed PRDs

Status: Draft for owner review. These documents propose product requirements; they do not approve implementation, create Savepoint Goals, or change the router.

## Documents

1. [Meteor Showers](meteor-showers.md)
2. [Zodiac Explorer](zodiac-explorer.md)
3. [Solar System Explorer](solar-system-explorer.md)
4. [Earth’s Closest Calls](earths-closest-calls.md)
5. [Eclipses & Transits Explorer](eclipses-and-transits.md)
6. [Observer Views & Orbit Controls](observer-views.md)

## Shared product and API requirements

All five experience apps consume Astraeus through documented public exports. Observer Views & Orbit Controls is the shared capability project, demonstrated in a separate consumer example. Existing public APIs should be reused where suitable; the capability descriptions in these PRDs are requirements, not claims that particular calls already exist.

- Validate each app against built or packed Astraeus packages in a consumer environment. A workspace source alias alone does not prove reuse.
- App code owns catalogue choices, editorial content, branding and product-specific controls. Reusable scene geometry, clocks, frames, observer transforms and rendering belong behind the public API.
- A missing API capability is recorded and addressed explicitly. Consumers must not patch engine files or import private paths.
- Data enters through public data/provider contracts. An app may load its own static datasets without requiring a bespoke engine branch.
- User actions use public state and control interfaces. Distance, time and other readouts derive from the same state as the scene.
- Every scientific dataset records source, retrieval or generation date, applicable time interval, units, reference frame, time standard and relevant uncertainty. Store licence and attribution information with distributed assets.
- Observed, reconstructed, simulated and illustrative information must be distinguishable. Missing precision must not be disguised by excessive decimal places.
- All apps provide keyboard-operable primary controls, visible focus, labelled inputs and text equivalents for essential visual information. Selection must not depend on colour alone. Playback starts paused and offers an explicit pause control.
- Loading, unavailable data and unsupported dates or locations have useful visible states. A failed optional asset must not leave a misleading scientific view.
- Each app loads the selected experience first. Large optional datasets and images are loaded on demand. Numerical load and frame-rate budgets require an agreed reference device and dataset before implementation; these drafts do not invent measured budgets.
- Each app includes a short integration report: public APIs used, API gaps found, app-owned adaptations and any repeated logic that should become shared capability.

## Validation and delivery

Before implementation, reconcile proposed requirements with the current public API and record actual gaps. For each scientific reference case, specify source, expected result and a numerical tolerance before using it as an acceptance test. Unknown tolerances remain review decisions, not assumed passes.

Implementation follows the project’s configured gates and Savepoint workflow. Scientific assertions belong in deterministic tests where possible. Browser validation and evidence retention follow repository rules; owner visual acceptance remains necessary for appearance and navigation.

Suggested sequence: establish the observer contract and a minimal consumer; extend Meteor Showers; prove observer geometry through Eclipses & Transits; deliver Zodiac and Closest Calls; integrate the broader Solar System app. This is a recommendation, not an approved schedule. Work that does not depend on observer views can begin earlier.

## Decisions for owner review

- Approve or revise the launch catalogue and required demonstrations in each PRD.
- Decide where the apps will live and be hosted; separate consumer builds are required regardless of repository layout.
- Agree reference devices, supported browsers and measurable performance budgets during planning.
- Approve scientific reference cases and tolerances before implementation acceptance.
- Decide whether public sharing links and saved preferences belong in the first release; neither is required here.
