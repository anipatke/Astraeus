# Constellation figures, boundaries and names (O-067 T-303)

Researched 2026-11-10. Every licence below was read on its primary source (the repository file or the publisher's page) on that date; where the live page is gone, the Internet Archive copy is named. No data was added to any package in this step.

## Summary

- **What we need:** for each of the 88 constellations, the stick figure (which stars to join), the official outline (IAU boundary) and the name.
- **Figures, recommended: Stellarium's "Modern (IAU)" set.** These are the IAU's own published figures (drawn for the IAU by Sky & Telescope), typed into a data file by the Stellarium team. Licence **CC BY-SA 4.0**, the same as the star list the engine already ships. All 88 constellations are there. Of the 745 stars they join, **744 are in the engine's star list by Hipparcos number**. The one left over is Alula Australis (xi Ursae Majoris), which *is* in the engine's star list but without a Hipparcos number, so that one end would be given as a sky position.
- **Boundaries, recommended:** the CDS catalogue VI/49 (Davenhall and Leggett, built from Delporte 1930, the IAU's definition). Use its original 1875 corner list and have our import tool add points along each edge and convert them to J2000, which is what VI/49 itself did. We do it ourselves because the J2000 file as served today is **sorted by right ascension**, not in outline order, so it cannot be drawn as is. VI/49 states no licence. CDS says its data are free for scientific use and that other use depends on the source. The same 1875 corners are also in Stellarium's files under CC BY-SA 4.0, which is a fallback with a written licence.
- **Names and abbreviations:** the IAU's constellations page (the name, abbreviation and genitive table). The IAU releases its web texts under **CC BY 4.0**, with the credit "IAU".
- **Size:** about **250 KB unpacked and 92 KB compressed** for the data. Most of that is the boundaries. The whole package would be roughly 100 to 110 KB to download.
- **Your choice:** pick the figure set (recommended: Modern (IAU); alternatives below) and confirm the boundary and name sources.

## Figure sets compared

| | Stellarium **Modern (IAU)** | Stellarium **Modern** | Stellarium **Modern (Sky & Telescope)** | **d3-celestial** (Olaf Frohn) | **dcf21** IAU file (Dominic Ford) |
|---|---|---|---|---|---|
| What it is | The IAU/Sky & Telescope figures (Alan MacRobert), typed in as Hipparcos lists by the Stellarium team | Stellarium's own default figures (simpler and different) | The same S&T figures, an older add-on (Krizak, Piskor, Zotti) | IAU figures with "some line modifications by me", as sky positions | The IAU figures typed in by D. Ford |
| Licence (exact wording) | "CC BY-SA 4.0" (`description.md`, `## License`) | "Text and data: CC BY-SA 4.0 / Illustrations: Free Art License" | "CC BY-SA 2.0" | Repository `LICENSE`: BSD 3-clause, "Copyright (c) 2015, Olaf Frohn"; README: "Released under BSD License". Lines source given as "[3] IAU Constellation page … some line modifications by me" | **Conflicting.** README: "constellation_lines_iau.dat … released under a Creative Commons Attribution 4.0 International license". File header: "Copyright 2015-2025 Dominic Ford … free software … under the terms of the GNU General Public License … version 3 … or (at your option) any later version" |
| Attribution | Credit Stellarium's team and the IAU/S&T origin, link the licence, say what was changed. Adapted data stays CC BY-SA 4.0 | Same | Same, BY-SA 2.0 | Keep the BSD notice; the IAU's CC BY 4.0 credit is owed for the underlying figures | Unclear until the author settles which licence applies |
| Ends | Hipparcos numbers | Hipparcos numbers | Hipparcos numbers | RA/Dec positions (J2000, 4 decimals) | Hipparcos numbers |
| Coverage | 88/88 | 88/88 | 88/88 (its note says Mic and Men lack lines, but the current file has lines for both) | 89 features (Serpens in two parts) | 89 (Serpens in two parts) |
| Lines | 843 steps in the file, 752 distinct lines (4 zero-length and 87 repeated steps, to be dropped) | 695, none repeated | 844 steps, 757 distinct lines | 743 | 750 |
| End stars in engine list | 744 of 745 (only HIP 55203 missing, see below) | 708 of 710 (HIP 33165 CMa V 6.65, HIP 30665 Mon V 6.60, both fainter than the list's 6.5 cut) | 744 of 745 (HIP 55203) | all 757 ends within 0.05° of an engine star | 741 of 742 (HIP 55203) |
| Format, size | JSON `index.json`, 132 KB (the figures are a small part) | JSON, 201 KB (includes long descriptions and star names) | JSON, 92 KB | GeoJSON, 27 KB | Text, 11 KB |
| Maintenance | Active: last change to the file 2026-06-18 (`dc5679c9`) | Active: 2026-03-05 (`daace2ad`) | In the same repository | Last commit 2022-07-05 (`7e720a3d`) | Last commit 2025-02-22 (`75d29c20`) |
| URL | [modern_iau](https://github.com/Stellarium/stellarium/tree/master/skycultures/modern_iau) | [modern](https://github.com/Stellarium/stellarium/tree/master/skycultures/modern) | [modern_st](https://github.com/Stellarium/stellarium/tree/master/skycultures/modern_st) | [d3-celestial](https://github.com/ofrohn/d3-celestial) | [constellation-stick-figures](https://github.com/dcf21/constellation-stick-figures) |

**The IAU/Sky & Telescope charts themselves:** the IAU constellations page (now 404 on the new iau.org; [archived 2025-01-08](https://web.archive.org/web/20250108164011/https://www.iau.org/public/themes/constellations/)) says: "The charts below were produced in collaboration with Sky & Telescope magazine (Roger Sinnott and Rick Fienberg). Alan MacRobert's constellation patterns, drawn in green on the charts, were influenced by those of H. A. Rey but, in many cases, were adjusted to preserve earlier traditions. Each chart was produced using the J2000 epoch. The images are released under the Creative Commons Attribution 4.0 International license." The IAU publishes them only as images (GIF, PDF, TIF). There is no machine-readable IAU version. The Stellarium Modern (IAU) set and the dcf21 file are transcriptions of these charts.

**How closely the IAU-style sets agree**, counting distinct star-to-star lines (`agree.py`):

| | shared | only in first | only in second |
|---|---:|---:|---:|
| Modern (IAU) vs Modern (S&T) | 756 | 0 | 1 |
| Modern (IAU) vs dcf21 IAU | 706 | 50 | 44 |
| Modern (IAU) vs d3-celestial | 596 | 160 | 147 |
| Modern (IAU) vs Stellarium Modern | 427 | 329 | 268 |

Two separate transcriptions of the IAU charts (Stellarium's and dcf21's) agree on about 93 per cent of lines. d3-celestial has been edited further. Stellarium's default Modern set is a different drawing.

### The one star the recommended set cannot name by number

HIP 55203 is xi Ursae Majoris (Alula Australis, V 4.33), the end of the Great Bear's back foot. HYG v4.2 takes this double star from the Gliese catalogue and gives it **no Hipparcos number**. The rows are `id 118742, hd 98231, hr 4375, proper "Alula Australis", hip ""` plus its companion. So the engine's star list holds the star (`[169.54677, 31.52878, 4.33, 0.59, 0]`) but with HIP 0. The `unknown-star` check would refuse `{ hip: 55203 }`. The package gives this end as the star's sky position, which the Objective allows ("star-map positions where it does not"). It is drawn on the star itself.

## Boundaries compared

| | VI/49 `bound_18.dat` (B1875, original) | VI/49 `bound_20.dat` (J2000) | Stellarium `edges` (in Modern and Modern (IAU)) | d3-celestial `constellations.bounds.json` | IAU per-constellation TXT |
|---|---|---|---|---|---|
| Source | Davenhall & Leggett 1989, from Delporte 1930 | Same, precessed with points every 1° | "edges_source": pbarbier.com `edges_18.txt` | "[4] … Davenhall A.C., Leggett S.K. (1989) VizieR VI/49" | "Davenhall … VI/49" in the page's references |
| Licence | ReadMe states no copyright or licence. VizieR rules (below) | Same | Inside a CC BY-SA 4.0 sky culture. The pbarbier.com page refused our requests (406 from curl, empty to the fetch tool), so its own terms are unread | BSD 3-clause (repository) | IAU web texts CC BY 4.0 (copyright page below). The page names the files "A text file containing a set of coordinates …", but no licence is stated for the files themselves |
| Epoch | B1875 | J2000 | B1875 | J2000 | J2000 |
| Points | 1,565 corners, all "O" (original) | 12,948 (1,533 original, 11,415 interpolated) | 781 edges with the constellation on each side | 1,659, corners only | corners only (Orion 28) |
| Order and closure | One unbroken run per constellation (89 runs, 89 codes, `SER1`/`SER2` for Serpens), corners in order, last joins first | **Sorted by right ascension, not outline order**: 12,645 of 12,947 steps fall in RA, and the median largest jump between "successive" points is 22°. Cannot be drawn as is | Edges, to be chained | Closed GeoJSON rings (first point repeated), 89/89 | In order |
| Fit for J2000 drawing | Needs interpolation and precession (our importer) | Point set usable only as a check | Same as `bound_18` | Straight lines between precessed corners cut corners along long east-west edges (largest single step 30° in Hya and Cen) | Same weakness; file links now 404 |
| URL | [CfA mirror](https://vizier.cfa.harvard.edu/ftp/cats/VI/49/) | same | [modern index.json](https://github.com/Stellarium/stellarium/blob/master/skycultures/modern/index.json) | [d3-celestial data](https://github.com/ofrohn/d3-celestial/tree/master/data) | [archived page](https://web.archive.org/web/20250108164011/https://www.iau.org/public/themes/constellations/) |

**VI/49 terms.** The ReadMe ([CfA mirror](https://vizier.cfa.harvard.edu/ftp/cats/VI/49/ReadMe), dated 23-Jul-2024 for the last fix) has no copyright, licence or "Acknowledging" section. It credits "Davenhall A.C., Leggett S.K., Royal Obs. Edinburgh (1989), =1997yCat.6049....0D". The VizieR "Rules of usage" page (cds.unistra.fr refused connections from here; read via the [archive, 2025-12-18](https://web.archive.org/web/20251218180444/https://cds.unistra.fr/vizier-org/licences_vizier.html)) says: "The data retrieved with VizieR are free of usage in a scientific context ; however, as it is the usage in scientific publication, the original authors and publication references including the publisher have to be explicitely cited … The commercial usage of the data is subject to rules depending of the origin (see section How to search Copyright information)". That section says: "Please refer to the ReadMe file associated to the catalogue to verify if a "copyright" exists." For VI/49 none does. The coordinates are the IAU's own definition of the boundaries. Whether such coordinates are protected at all is a legal question this note does not settle. The plain reading is that no licence is granted and none is claimed. If you want an explicit licence, use the CC BY-SA 4.0 Stellarium `edges` (the same Delporte 1875 corners) as the source instead. The output is the same.

**Recommended method:** the import tool reads `bound_18.dat`, adds points every 1° along each edge in B1875, precesses to J2000 (as VI/49 did; its `constell.txt` says "points were interpolated at one-degree intervals along the boundaries … a smooth curve should be drawn through the interpolated points"), and writes one closed outline per constellation. The first point is not repeated, because `SkyFigureInput` boundaries join the last point to the first. The tool's test should match the result against the `bound_20.dat` point set. Serpens has two separate areas (`SER1` Caput, `SER2` Cauda). A `SkyFigureInput` boundary holds one ring, so Serpens needs two boundary figures (for example `Ser-caput`, `Ser-cauda`) with one label. The planner should decide this in the build step.

## Names and abbreviations

The IAU constellations page's table (Name, Abbr., English name, Genitive, for all 88; [archived 2025-01-08](https://web.archive.org/web/20250108164011/https://www.iau.org/public/themes/constellations/)). The IAU copyright page ([archived 2025-01-24](https://web.archive.org/web/20250124201854/https://www.iau.org/copyright/)) says: "The images, videos and web texts on iau.org are released under the Creative Commons Attribution 4.0 International license and may on a non-exclusive basis be reproduced without fee, on the conditions outlined below. Conditions: The full image, footage or web text credit must be presented in a clear and readable manner to all users, with the wording unaltered (for example: "IAU")." The new iau.org returns 404 for both pages, so the archive copy is the source of record. The live Stellarium files also carry each constellation's IAU name ("common_name … context: IAU constellation name", CC BY-SA 4.0) and can serve as a cross-check.

## Coverage counts (method)

Downloads went into separate fresh folders under the session scratchpad. The scripts were kept apart and run with `python3 -I`, with paths passed as arguments. Files: Stellarium `skycultures/{modern,modern_iau,modern_st,modern_rey}/{index.json,description.md}` (master, 2026-11-10), dcf21 `constellation_lines_iau.dat` and `README.md`, d3-celestial `data/constellations.lines.json`, `constellations.bounds.json` and `constellations.json`, VI/49 `bound_18.dat`, `bound_20.dat` and `constell.txt` (CfA mirror; Strasbourg timed out), and HYG v4.2 `hygdata_v42.csv.gz` from astronexus (13.6 MB, 119,626 rows, 117,951 with a HIP).

```
python3 -I coverage.py packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json hyg/hygdata_v42.csv.gz <scratch> dcf21/constellation_lines_iau.dat d3c/constellations.lines.json
python3 -I agree.py   <engine json> st-modern_iau/index.json st-modern_st/index.json stellarium-modern/modern-index.json dcf21/constellation_lines_iau.dat d3c/constellations.lines.json
python3 -I bounds.py  vi49/bound_20.dat d3c/constellations.bounds.json stellarium-modern/modern-index.json
python3 -I size.py    st-modern_iau/index.json vi49/bound_20.dat d3c/constellations.json <out>
```

Engine list: 8,920 rows, 8,870 with a HIP. Results:

| Set | Constellations | Steps | Distinct end stars | In engine list | Missing | Missing and not in HYG v4.2 | Constellations with a missing end |
|---|---:|---:|---:|---:|---:|---:|---|
| Stellarium Modern (IAU) | 88 | 843 | 745 | 744 | 1 | 1 (55203) | UMa |
| Stellarium Modern | 88 | 695 | 710 | 708 | 2 | 0 | CMa (HIP 33165, V 6.65), Mon (HIP 30665, V 6.60) |
| Stellarium Modern (S&T) | 88 | 844 | 745 | 744 | 1 | 1 (55203) | UMa |
| Stellarium Rey (for reference) | 88 + 82 parts | 1,144 | 847 | 843 | 4 | 1 (55203) | And (HIP 1411, V 9.09), Ori (HIP 29239, V 7.36), UMa (55203, 64468 V 7.23) |
| dcf21 IAU | 89 | 750 | 742 | 741 | 1 | 1 (55203) | UMa |
| d3-celestial (positions) | 89 | 743 | 757 positions | all 757 within 0.05° of an engine star | 0 | n/a | none |

The scripts are kept in the session scratchpad (`o067/scripts/`) and are not committed. The build step's import tool reproduces these counts from the recorded sources.

## Package size (recommended choice)

Compact JSON (`size.py`): Modern (IAU) figures as HIP lists (before dropping repeats) 6.9 KB (3.2 KB gzip). Boundaries at the VI/49 J2000 density (12,948 points, 4 decimals, about 0.4 arcsec) 239 KB (87 KB gzip). Names and genitives 2.6 KB (1.0 KB gzip). Total **249 KB raw, 92 KB gzip -9**. With `src/`, README, NOTICE and the CC BY-SA 4.0 and CC BY 4.0 licence texts, the estimate is **about 100 to 110 KB packed and 280 to 300 KB unpacked**, against astraeus-data-pluto's limits of 2 MB / 2.1 MB in `tools/check-packs.mjs`. A limit of about 0.2 MB packed and 0.4 MB unpacked would fit. Measured on stand-in data; the importer's output is the real figure. Points every 2° instead of 1° would roughly halve the boundaries.

## Recommendation

**Figures: Stellarium Modern (IAU), CC BY-SA 4.0.**

1. They are the IAU's own published figures, the ones on the IAU charts the public sees.
2. They use the same licence as the engine's HYG star list, which the owner has accepted for this package (decision 1).
3. Coverage is complete: 88 of 88, with 744 of 745 stars matched by Hipparcos number and the last one (xi UMa) in the list as a position.
4. Stellarium maintains the file actively, and the import tool can pin a commit.
5. The Sky & Telescope set is the same drawing under an older licence version (BY-SA 2.0). The dcf21 transcription has two conflicting licences in its own repository.

The import tool must drop the 4 zero-length and 87 repeated steps.

**Alternatives:**

- **(a) d3-celestial.** Choose it if you want a permissive licence: BSD, plus a CC BY 4.0 credit to the IAU and Sky & Telescope. It is not share-alike. Its ends are positions, which the importer would map to HIP (every end lies within 0.05° of an engine star). It is a simplified IAU drawing ("some line modifications") and has not changed since 2022.
- **(b) Stellarium Modern.** Choose it if you prefer Stellarium's simpler default look. Two ends are stars fainter than 6.5, so they would be given as positions.

**Boundaries:** VI/49 `bound_18.dat`, interpolated and precessed by our import tool and checked against `bound_20.dat`. If you want a written licence, use Stellarium's CC BY-SA 4.0 `edges` for the same corners.

**Names:** the IAU table, CC BY 4.0, credit "IAU".

**NOTICE wording:** the package NOTICE would name the IAU/Sky & Telescope origin of the figures (Alan MacRobert; Roger Sinnott and Rick Fienberg), Stellarium's team and CC BY-SA 4.0 for the figure file, Davenhall & Leggett (1989), Delporte (1930), VizieR VI/49 for the boundaries, and "IAU" with CC BY 4.0 for the names. The package code stays MIT.

## Uncertain

- **VI/49 licence:** none is stated (see above). The CC BY-SA 4.0 Stellarium edges fallback removes the question.
- **Current `bound_20.dat`:** whether the RA-sorted order is only on the CfA mirror or also on the Strasbourg master is unknown, because Strasbourg could not be reached. The recommended method does not depend on it.
- **pbarbier.com:** the page (source of Stellarium's edges) could not be read.
- **IAU pages:** only archive copies are available, because the new iau.org returns 404 for the constellations and copyright pages.
- **dcf21 licence:** README and file header disagree (CC BY 4.0 against GPL-3.0-or-later); not asked.

## Owner decision

Pending: the figure set (recommended: Stellarium Modern (IAU)), the boundary source (recommended: VI/49 1875 corners via our import tool, or Stellarium edges for a written licence), and the names source (recommended: IAU, CC BY 4.0).
