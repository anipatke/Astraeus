---
id: O-023
title: Show the Sun at scale in the Earth–Moon and Jupiter–Io scenes
status: planned
depends_on: [O-020]
release: G-005
---

# O-023: Show the Sun at scale in the Earth–Moon and Jupiter–Io scenes

## Outcome

The Earth–Moon and Jupiter–Io demos (and Apollo 11, which shares the Earth–Moon system, if the owner wants) draw the Sun where it really is, at its real size, so looking past Io and Jupiter you see a small, bright Sun in the distance, in the direction the light comes from.

## Why

Owner, 2026-10-18: "Can we add the sun at scale to the Jupiter io and earth moon demos? Would be cool to be looking at io and Jupiter and see the sun in the distance".

## Launch Note (owner, 2026-10-18)

In the launch (G-005 Launch Definition of Done). Earth–Moon is dropped, so this applies to the Jupiter demo (with all its moons, O-025) and Apollo 11 (owner, 2026-10-18: "yes" to Apollo too).

## Success Conditions

1. At True scale the Sun is drawn at its real distance and size (about 0.1 degrees across seen from Jupiter, about 0.5 degrees from Earth), in the same direction as the scene's lighting.
2. It stays visible as a point with the existing Sun glow when its disc is under a pixel, without washing out the scene (Sun glow settings, live).
3. Camera reach, the floating origin and depth precision handle a body about 780 million km away (Jupiter) without flicker or clipping; the Sun appears in the object picker as a focus target only if the owner wants it.
4. Generic: the Sun is added as a body of the existing compositions (ARCH-01); the showers' Sun is unchanged.
5. Browser checks through the shared driver show the Sun in view from Io and from the Moon at True scale; full run passes; owner look.

## Open Questions (to settle when this Objective is planned)

- At Readable scale, where does the Sun go (a fixed far distance in the true direction, or hidden)?
- Should the Sun be selectable to focus (and a tap target under O-022)?

## Architectural Considerations

Positions come from the existing ephemeris path the showers use for the Sun; lighting already uses the Sun's direction, so the drawn Sun must agree with it.

## Boundaries

**In scope:** drawing the Sun at scale in these scenes, its glow, camera reach.

**Out of scope:** other planets in these scenes, lens flares, and changing the showers.
