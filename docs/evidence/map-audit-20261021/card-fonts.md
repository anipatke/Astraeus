# Info card font audit (read-only)

Component: src/shell/InfoPanel.tsx (props from src/shell/infoModel.ts). CSS: src/shell/style.css.
Monospace (12px ui-monospace) = `.info-panel-subtitle` (:47) and `.info-panel-facts dd` (:52). Title, description, labels (dt), provenance badge detail, Sources = UI font.
(.metric-value :136 and .story-badge :241 are monospace by design: numbers / caps pill; not in scope.)
No inline styles, no <code>, no italic/weight differences in the info panel.

## Where content comes from
- Subtitle: only tagged-place (feature) cards and event cards. Feature subtitle = `${featureType} on ${body}`, e.g. "dark polar region on Charon" -> WORDS in mono, on all 403 place cards. Event subtitle = UTC timestamp (figure, fine).
- Facts: feature `details` (data/bodies/*/features.json); object facts (planetDefinition.ts: "Known moons" for the planet, moonFacts() in src/assets/moonCatalogue.ts for mapped and dot moons); window facts (timestamps/rate, figures).
- Planet/moon object cards have no subtitle. Description (data/planets/*.json, header text) is UI font. Fit-error / accuracy / licence text lives in the provenance badge detail: UI font (consistent).

## Cards checked
- 403 tagged-place cards, 23 bodies (data/bodies/*/features.json): 392 have details; 391 carry a prose row in mono; 1 is figures only; 11 no details. 997 detail rows, ~658 are sentences. All 403 have a words subtitle in mono.
- Object cards with facts: planets with a moon list (Mars, Jupiter, Saturn, Uranus, Neptune, Pluto: "Known moons"), 11 mapped moons + Moon, and every dot moon (hundreds). Sun, Mercury, Venus, Earth: no facts, so no mono (those cards are tidy).
- Total untidy: all 403 place cards, plus every moon/planet object card that has facts (about 6 planets + ~12 mapped + ~300 dot moons).

## Patterns
1. Place-card subtitle is words, mono: "dark polar region on Charon", "crater on Callisto".
2. Place-card detail rows are sentences in mono and wrap awkwardly: Fun Fact (281 rows) "Kerwan is so smooth and shallow that it lacks a distinct central peak..."; Map cue / Science value / Naming origin ("Named for Debegey, a Yukaghir mythological hero.").
3. Same kind of fact in different fonts' look: Diameter is a figure in 30 cards ("1,212 km") but words in 32 ("About 30.8 km", "~230 km (rough estimate from limited-resolution imaging)"); Depth likewise.
4. Moon cards: Family = words ("Small regular moons", "Inuit group") mono; Size "1,212 km across (estimated from brightness)" mixes figure+words; Found "1978" figure. Planet: "115 moons in the JPL Horizons list of 18 October 2026" words+date mono.

## Proposed rule
Monospace only for pure figures (numbers with unit, years, timestamps, coordinates); everything else in --ui-font.
Smallest change: one font. Delete the `font:` declarations on `.info-panel-subtitle` and `.info-panel-facts dd` (style.css:47, 52), add `font-variant-numeric: tabular-nums` on dd. Effect: all ~400+ cards change, zero data/code edits, no per-fact classification needed (the data mixes "About 30.8 km" with sentences, so classifying figures would need heuristics or data edits).
Alternative (keep mono for figures): add optional `kind?: "figure"` to InfoFact (infoModel.ts), set by moonFacts (Found, Size) and window facts, render `<dd data-kind="figure">` in InfoPanel.tsx, style only that in mono; feature details default to UI font. Files: infoModel.ts, InfoPanel.tsx, moonCatalogue.ts, planetDefinition.ts, style.css. Subtitle: UI font unless event timestamp.
Recommendation: one font + tabular-nums (1 file).
