# astraeus-data-jupiter

Jupiter's moon positions for the [Astraeus](https://github.com/anipatke/Astraeus) engine: every moon JPL Horizons lists for Jupiter, and Jupiter itself, as piecewise Chebyshev fits about the system barycentre (geometric, ICRF, TDB), one file per body per calendar year, 2010 to 2030, except Io, Europa, Ganymede and Callisto, and Jupiter itself, which are fitted from 1950 (1950 to 2030). Each body's own years are its `span` in `index.json` (the other moons 2010 to 2030); a scene whose timeline reaches outside a body's years fails once at mount with `SceneError` code `out-of-span`. The measured fit errors are in `index.json`.

```ts
import { mount, Scene, io, jupiter } from "astraeus";
import { dataSource } from "astraeus-data-jupiter";

mount(element, new Scene().addBody(jupiter).addBody(io), { data: [dataSource] });
```

The engine loads only the year files the scene's time window needs. Moons are offered only when this package is passed to `mount`.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), US Government work, used with credit. See `NOTICE`.
