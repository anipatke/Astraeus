# astraeus-data

Pictures for the [Astraeus](https://github.com/anipatke/Astraeus) engine, kept apart so the engine stays small:

- maps of Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Pluto and Charon;
- the 8k Venus map (used on wide screens);
- the Milky Way picture (Kevinmloch, from Gaia EDR3, CC BY-SA 4.0), one 3840x1920 image.

Without this package the engine still draws every body: moons are flat-coloured spheres, Venus uses its 2k map and the sky shows the catalogue stars without the Milky Way. Nothing is invented to fill the gap.

```ts
import { mount, Scene, titan, saturn } from "astraeus";
import { dataSource as pictures } from "astraeus-data";
import { dataSource as saturnMoons } from "astraeus-data-saturn";

mount(element, new Scene().addBody(saturn).addBody(titan), { data: [pictures, saturnMoons] });
```

Every picture carries its licence record (`PICTURES[name].licence`); `NOTICE` lists them. Most are NASA/JPL or USGS public-domain or credit-required work; the Milky Way is CC BY 4.0.
