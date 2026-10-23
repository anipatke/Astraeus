# astraeus-data-neptune

Neptune's moon positions for the [Astraeus](https://github.com/anipatke/Astraeus) engine: every moon JPL Horizons lists for Neptune, and Neptune itself, as piecewise Chebyshev fits about the system barycentre (geometric, ICRF, TDB), one file per body per calendar year, 2010 to 2030. The measured fit errors are in `index.json`.

```ts
import { mount, Scene, triton, neptune } from "astraeus";
import { dataSource } from "astraeus-data-neptune";

mount(element, new Scene().addBody(neptune).addBody(triton), { data: [dataSource] });
```

The engine loads only the year files the scene's time window needs. Moons are offered only when this package is passed to `mount`.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), US Government work, used with credit. See `NOTICE`.
