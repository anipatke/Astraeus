# astraeus-data-mars

Mars's moon positions for the [Astraeus](https://github.com/anipatke/Astraeus) engine: every moon JPL Horizons lists for Mars, and Mars itself, as piecewise Chebyshev fits about the system barycentre (geometric, ICRF, TDB), one file per body per calendar year, 2010 to 2030. The measured fit errors are in `index.json`.

```ts
import { mount, Scene, phobos, mars } from "astraeus";
import { dataSource } from "astraeus-data-mars";

mount(element, new Scene().addBody(mars).addBody(phobos), { data: [dataSource] });
```

The engine loads only the year files the scene's time window needs. Moons are offered only when this package is passed to `mount`.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), US Government work, used with credit. See `NOTICE`.
