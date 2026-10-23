# astraeus-data-uranus

Uranus's moon positions for the [Astraeus](https://github.com/anipatke/Astraeus) engine: every moon JPL Horizons lists for Uranus, and Uranus itself, as piecewise Chebyshev fits about the system barycentre (geometric, ICRF, TDB), one file per body per calendar year, 2010 to 2030. The measured fit errors are in `index.json`.

```ts
import { mount, Scene, uranus } from "astraeus";
import { dataSource } from "astraeus-data-uranus";

mount(element, new Scene().addBody(uranus), { data: [dataSource] });
```

The engine loads only the year files the scene's time window needs. This system has no ready-made moon bodies yet; the positions are for scenes that read them.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), US Government work, used with credit. See `NOTICE`.
