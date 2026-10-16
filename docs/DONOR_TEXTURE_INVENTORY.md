# Donor texture inventory (2026-10-17)

Every surface map in the donor (`/home/user/code/planetary-explorer/public/textures/`, read only) that Astraeus does not ship, assessed for a later "more of the solar system" Objective. Nothing here is copied into Astraeus; this is a paperwork pass only (owner decision, 2026-10-17). Follow-up: I-032.

Method: pixel size and file weight measured from each JPEG header; source and licence read from the donor's `public/textures/README.md`; donor git history checked for files with no README entry. No file was downloaded or compared against its claimed source, so "recorded" means the donor says so, not that it was re-verified.

Astraeus ships today (all sourced, see `assets.html` and `docs/DONOR_PROVENANCE.md`): Sun, Mercury, Venus, Earth (NASA BMNG), Moon (NASA SVS LROC), Mars, Jupiter, Io, Milky Way. Budget reference: the donor's own policy is 2k ≤ 1.5 MB soft / 3 MB hard, 4k ≤ 5 MB soft / 10 MB hard.

**Pictures are not enough on their own.** Astraeus has no position source for Saturn, Uranus, Neptune, Pluto, Ceres or any moon other than the Moon and Io. Each body added needs an ephemeris provider first (engine work); the picture is the easy part.

## A. Ready: source and licence recorded, correct 2:1 shape

| Body | File | Pixels | Size | Source | Licence | Notes |
|---|---|---|---|---|---|---|
| Europa | europa-2k.jpg | 2048×1024 | 0.55 MB | USGS Astrogeology, Voyager–Galileo SSI global mosaic 500 m | Public domain (USGS/NASA) | Positive-west source; check orientation like Io. |
| Callisto | callisto-2k.jpg | 2048×1024 | 0.42 MB | USGS/NASA Voyager–Galileo SSI global mosaic 1 km | Public domain (USGS/NASA) | Source page not recorded, only the download URL. |
| Io (4k) | io-4k.jpg | 4096×2048 | 1.24 MB | Same USGS mosaic as the shipped io-2k | Public domain | Optional desktop variant of a body we already ship. |
| Saturn | saturn-2k.jpg / saturn-4k.jpg | 2048×1024 / 4096×2048 | 0.16 / 1.10 MB | Solar System Scope | CC BY 4.0 | Same terms as our other Solar System Scope maps. Rings are drawn in code, not pictured (see D). |

## B. Source recorded; licence confirmed by the JPL image use policy

JPL's image use policy (jpl.nasa.gov/jpl-image-use-policy, read 2026-10-17): unless a caption says otherwise, images "may be used for any purpose without prior permission", with a credit line; no claim of NASA endorsement. Credit each map as its caption gives it (below).

| Body | File | Pixels | Size | Source | Notes |
|---|---|---|---|---|---|
| Mimas | mimas-4k.jpg | 5760×2880 | 1.61 MB | NASA/JPL-Caltech/SSI, PIA17214 | Non-standard size; resize to 2k/4k. |
| Enceladus | enceladus-4k.jpg | 4096×2048 | 3.66 MB | NASA/JPL-Caltech/SSI/LPI, PIA18435 | Needs a 2k variant. |
| Tethys | tethys-4k.jpg | 4096×2048 | 2.57 MB | NASA/JPL-Caltech/SSI/LPI, PIA18439 | Registered 180° from the Mimas frame. |
| Dione | dione-4k.jpg | 14134×7067 | 10.26 MB | NASA/JPL-Caltech/SSI/LPI, PIA18434 | Mislabelled "4k"; over the hard limit. Must be resized. |
| Rhea | rhea-4k.jpg | 4096×2048 | 3.01 MB | NASA/JPL-Caltech/SSI/LPI, PIA18438 | Needs a 2k variant. |
| Titan | titan-4k.jpg | 4096×2048 | 1.48 MB | NASA/JPL-Caltech/SSI, PIA19658 | Cropped from a labelled map; check crop edges for seams. |
| Iapetus | iapetus-4k.jpg | 4096×2048 | 1.64 MB | NASA/JPL-Caltech/SSI/LPI, PIA18436 | Taken from a Wikimedia copy, not NASA directly; registered 180° off. |
| Triton | triton-voyager-map.jpg | 14138×7069 | 4.28 MB | NASA/JPL-Caltech/LPI, PIA18668 | Wikimedia copy; Voyager 2 covers only part of the surface. Resize. |

## C. Traced 2026-10-17 (no donor record; matched against the original)

Method: candidate originals downloaded to a scratch directory (not committed) and compared with ImageMagick. "Identical" is a byte match; otherwise RMSE on 512×256 resamples, or normalised cross-correlation (NCC) on greyscale when the donor file was recoloured. These files were added in donor commits `9453003`, `e802623` and `0c1a619` (2026-04-10/11).

| Body | File | Pixels | Size | Traced to | Match | Licence and credit | Use |
|---|---|---|---|---|---|---|---|
| Uranus | uranus-2k.jpg | 2048×1024 | 0.08 MB | Solar System Scope `2k_uranus.jpg` | Byte-identical | CC BY 4.0, Solar System Scope | Ready |
| Neptune | neptune-2k.jpg | 2048×1024 | 0.24 MB | Solar System Scope `2k_neptune.jpg` | Byte-identical | CC BY 4.0, Solar System Scope | Ready |
| Pluto | pluto-4k.jpg | 5926×2963 | 3.97 MB | NASA Photojournal PIA11707, New Horizons global colour map (assets.science.nasa.gov copy) | Same pixel size; colour RMSE 0.25% (recompressed) | NASA/JHUAPL/SwRI; JPL policy, credit required | Ready. Southern third black (unlit at flyby). |
| Charon | charon-2k.jpg | 1024×512 | 0.07 MB | USGS Astrogeology, Charon New Horizons LORRI MVIC Global Mosaic 300 m (Jul 2017), the 1024 px preview JPG | Byte-identical | Use constraint "Please cite authors": New Horizons team; NASA, JHUAPL, SwRI, LPI; USGS Astrogeology 2017 | Re-derive from the 77 MB GeoTIFF for a true 2k. |
| Ganymede | ganymede-2k.jpg / -4k.jpg | 2048×1024 / 4096×2048 | 0.42 / 1.60 MB | USGS Astrogeology, Ganymede Voyager–Galileo SSI Global Mosaic 1 km | NCC 0.72 after a 180° longitude shift (0.05 unshifted); contrast differs | Public domain; use constraints "None" | Ready; record the 180° re-centring as a change. |
| Ceres | ceres-2k.jpg | 4000×2000 | 2.45 MB | Surface geometry: USGS/DLR Ceres Dawn FC Global Mosaic 140 m (Feb 2016) | NCC 0.96 after a 180° shift. **Not** Solar System Scope's fictional Ceres (RMSE 28%) | Colour and the yellow-green polar fill come from an unknown source | Do not ship this file. Use the traced USGS/DLR mosaic ("Please cite authors"), greyscale or tinted by us and labelled as tinted. |

## D. Rings (drawn in code, not pictures)

The donor draws rings for Jupiter, Saturn, Uranus and Neptune as coloured bands generated in code (`src/entities/<planet>.ts`, `SaturnRingMesh.tsx`). The owner reports that the colours were matched to detailed NASA photos; the code itself records only the radii. Band edges converted back to km and checked against NASA NSSDC ring fact sheets (2026-10-17):

| Planet | Fact sheet | Result |
|---|---|---|
| Saturn | satringfact.html | D, C, B, Cassini Division, A, Encke, Keeler and F within about 1%; Colombo and Maxwell gaps placed correctly. G and E rings not drawn. |
| Uranus | uranringfact.html | Inner rings 6 to Epsilon grouped at 42–51 thousand km; Epsilon correct, drawn about 5× wider for visibility. Inner edge 38,100 km against the fact sheet's 41,837. The two outer dusty rings (R/2003 U1 and U2) are in the right places. |
| Neptune | nepringfact.html | Galle, LeVerrier, Lassell and Arago correct. Adams at 64,100–64,500 km against 62,933 (2% out). Adams ring arcs not drawn. |
| Jupiter | jupringfact.html | **Off.** Main ring drawn at 95,300–102,500 km against 123,000–128,940; halo and gossamer rings likewise about 20% too close in. Re-derive from the fact sheet. |

Ring band data is factual, not a licensed picture. Donor code has no licence, so Astraeus would re-implement it from the fact sheets.

## E. Moons with no picture

The donor shows these only as dots on circular orbits, with no map: Mars's Phobos and Deimos; Jupiter's Adrastea, Amalthea and Thebe; Saturn's Pan, Daphnis, Prometheus, Pandora, Epimetheus and Janus; Uranus's Miranda, Ariel, Umbriel, Titania and Oberon; Neptune's Naiad, Thalassa, Despina, Galatea, Larissa and Proteus; Pluto's small moons.

Candidates, not downloaded or verified:
- **Phobos and Deimos.** Both are irregular, so a sphere with a map would look wrong; they need a shape model. Candidates are the Gaskell shape models (NASA PDS, listed US public domain) and the Mars Express HRSC Phobos global mosaic (DLR, 16 px/degree).
- **Uranus's five main moons.** Voyager 2 imaged only their southern hemispheres; USGS holds 1986 maps.
- **The small moons.** Most have no global map at all.

## F. Previous concern, resolved

Ceres was suspected to be Solar System Scope's "fictional" Ceres. It is not, but its colouring is still untraced (see C).

## G. Other donor files, not needed

- Higher-resolution variants of bodies Astraeus ships: `mars-8k`, `mercury-8k`, `venus-8k`, `moon-lroc-4k`. Optional desktop upgrades; most are over budget.
- `venus-2k-balanced` / `venus-8k-balanced`: a softened USGS Magellan radar map (public domain). An alternative to our Solar System Scope Venus, if wanted.
- `earth-2k`, `moon-orig-2k`, `moon-orig-4k`, `moon-8k`: no recorded source. Already replaced by NASA maps under I-029; do not use.
- `jupiter-4k`: byte-identical to the donor's mis-sized `jupiter-2k`; Astraeus's own `jupiter-2k` is a true 2k.

## Also in the donor, not assessed here

`planetary-explorer/data/*-features.json`: surface-feature labels for 24 bodies (from the USGS Gazetteer, per the README notes), plus `body-overviews.json`, `hotspots.json` and Earth mission and satellite lists. These are story material and would need their own sourcing pass.
