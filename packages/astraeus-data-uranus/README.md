# astraeus-data-uranus

Uranus's moon positions for the [Astraeus](https://github.com/anipatke/Astraeus) engine: every moon JPL Horizons lists for Uranus, and Uranus itself, as piecewise Chebyshev fits about the system barycentre (geometric, ICRF, TDB), one file per body per calendar year, 2010 to 2030, except Miranda, Ariel, Umbriel, Titania and Oberon, and Uranus itself, which are fitted from 1950 (1950 to 2030). Each body's own years are its `span` in `index.json` (the other moons 2010 to 2030); a scene whose timeline reaches outside a body's years fails once at mount with `SceneError` code `out-of-span`. The measured fit errors are in `index.json`.

```ts
import { mount, Scene, uranus } from "astraeus";
import { dataSource } from "astraeus-data-uranus";

mount(element, new Scene().addBody(uranus), { data: [dataSource] });
```

The engine loads only the year files the scene's time window needs. This system has no ready-made moon bodies yet; the positions are for scenes that read them.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), US Government work, used with credit. See `NOTICE`.
