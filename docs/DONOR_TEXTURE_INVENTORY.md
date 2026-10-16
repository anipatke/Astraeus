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
| Saturn | saturn-2k.jpg / saturn-4k.jpg | 2048×1024 / 4096×2048 | 0.16 / 1.10 MB | Solar System Scope | CC BY 4.0 | Same terms as our other Solar System Scope maps. **No ring picture exists in the donor.** |

## B. Source recorded, licence line missing (NASA/JPL images, normally public domain; confirm per page)

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

## C. Source vague

| Body | File | Pixels | Size | What's recorded | Needed |
|---|---|---|---|---|---|
| Ganymede | ganymede-2k.jpg / ganymede-4k.jpg | 2048×1024 / 4096×2048 | 0.42 / 1.60 MB | "local derivative of the checked-in USGS/NASA Ganymede Voyager-Galileo global mosaic" | Exact product page and licence line. Likely the USGS Ganymede Voyager–Galileo SSI mosaic (unconfirmed). |

## D. No source recorded (cannot ship until traced)

Added in donor commits `9453003`, `e802623` and `0c1a619` (2026-04-10/11), with no README entry.

| Body | File | Pixels | Size | Likely origin (unconfirmed) | Concern |
|---|---|---|---|---|---|
| Uranus | uranus-2k.jpg | 2048×1024 | 0.08 MB | Solar System Scope | Near-featureless, as expected for Uranus. |
| Neptune | neptune-2k.jpg | 2048×1024 | 0.24 MB | Solar System Scope | — |
| Pluto | pluto-4k.jpg | 5926×2963 | 3.97 MB | A New Horizons global mosaic (NASA/USGS) | The far side was barely imaged, so any global map is partly filled in. |
| Charon | charon-2k.jpg | 1024×512 | 0.07 MB | Unknown | Mislabelled "2k"; low resolution. |
| Ceres | ceres-2k.jpg | 4000×2000 | 2.45 MB | Possibly Solar System Scope's Ceres pack, which forum posts suggest was partly invented | **Must be traced**: if it's an artistic map it breaks "reliable where data exists". Dawn mapped Ceres fully, so a real NASA/USGS map is available. |

## E. Other donor files, not needed

- Higher-resolution variants of bodies Astraeus ships: `mars-8k`, `mercury-8k`, `venus-8k`, `moon-lroc-4k`. Optional desktop upgrades; most are over budget.
- `venus-2k-balanced` / `venus-8k-balanced`: a softened USGS Magellan radar map (public domain). An alternative to our Solar System Scope Venus, if wanted.
- `earth-2k`, `moon-orig-2k`, `moon-orig-4k`, `moon-8k`: no recorded source. Already replaced by NASA maps under I-029; do not use.
- `jupiter-4k`: byte-identical to the donor's mis-sized `jupiter-2k`; Astraeus's own `jupiter-2k` is a true 2k.

## Also in the donor, not assessed here

`planetary-explorer/data/*-features.json`: surface-feature labels for 24 bodies (from the USGS Gazetteer, per the README notes), plus `body-overviews.json`, `hotspots.json` and Earth mission and satellite lists. These are story material and would need their own sourcing pass.
