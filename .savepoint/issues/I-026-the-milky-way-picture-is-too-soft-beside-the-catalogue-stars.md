---
id: I-026
title: The Milky Way picture is too soft beside the catalogue stars
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o011-t053-sky-look-20261015}
  at: '2026-10-15T07:30:00Z'
tasks: [T-053]
checks: [C-028]
history:
  - at: '2026-10-15T07:30:00Z'
    actor: {role: owner, session: owner-chat-o011-t053-sky-look-20261015}
    kind: observed
    note: 'Owner: "I like the idea of the milky way, we do need to find a better texture ... still find the stars arent sharp with the mily way on, but we could find better textures later". Owner decision 2026-10-15: the picture ships off by default. Recorded by the T-053 builder on the owner''s direct words; not in O-011 scope.'
  - at: '2026-10-16T10:23:02Z'
    actor: {role: executor, session: i026-repair-2026-10-16}
    kind: repair_attempted
    note: 'Owner asked for a better Milky Way picture. Licence decided first: NASA SVS Deep Star Maps 2020 states no licence of its own (SVS help: public domain "unless otherwise noted"), but is built from Gaia DR2, which the Gaia users page licenses as CC BY-NC 3.0 IGO (not CC BY-SA; share-alike is on ESA images). Whether the render inherits the non-commercial term is not established, so decision (b): local only (docs/DONOR_PROVENANCE.md has the quotes). tools/data/fetch-sky-map.mjs fetches the 16k EXR, tone-maps it (exposure 10, gamma 2.2, settings) and writes 4x2 tiles of 4096 px (8.69 MB, JPEG q20) plus a manifest to git-ignored data/local/sky/nasa/. The sky now draws N tiles from a manifest (frame equatorial-j2000 or galactic), picks the source by ?skymap=nasa|eso or sky.source (default nasa, loaded only when the picture is first switched on, falls back to ESO when absent or in a public build). Registration to the 16k pixels: Vega, Deneb, Sirius and Capella within one pixel. Gates: tsc, vite build, full vitest 828 passed 1 skipped, public-build validator ok, browser-sky.mjs zero console errors; before/after images in docs/evidence/o011-i026-20261016T101356Z/. The 16k set is about 715 MB of GPU memory with mipmaps; 8k is one argument away. The picture stays off by default; the owner''s look decides default-on, and a Brunier original can drop in by the same manifest. Issue left open for the owner and a Check.'
  - at: '2026-10-16T10:26:21Z'
    actor: {role: executor, session: i026-repair-2026-10-16}
    kind: repair_attempted
    note: 'Owner decision 2026-10-16: "use ESO, give credit". Default picture source set back to eso (ESO/S. Brunier, CC BY 4.0, credited in the Sky item''s Sources); the NASA tiles stay local-only, by ?skymap=nasa or sky.source. Tests that assert the default updated. Issue stays open; the better-texture question is the owner''s.'
  - at: '2026-10-17T10:00:00Z'
    actor: {role: owner, session: owner-chat-20261017}
    kind: owner_decision
    note: 'Owner, 2026-10-17: "milkyway needs a better photo still". Not accepted; stays open until a sharper Milky Way picture that lines up with the stars is found.'
  - at: '2026-10-24T02:51:07Z'
    actor: {role: owner, session: improvements-intake-20261024}
    kind: owner_decision
    note: 'Owner, 2026-10-24: "Keep it off by default, close it". The Milky Way stays off by default (a placeable switch); sharper free maps carry a non-commercial term, so no change.'
  - at: '2026-10-27T21:40:00Z'
    actor: {role: owner, session: owner-chat-milky-way-20261027}
    kind: reopened
    note: 'Owner asked why star-explorer.anipatke.com''s Milky Way looks better ("the star explorer one is just smoother and subtle, our one is bright and splotchy"), then, after a local trial, judged the starless Wikimedia render "way better" and said "log it now, do it after" (after T-181). Reopened on the owner''s direct instruction; the 2026-10-24 accepted resolution is cleared. Recorded by the assistant.'
  - at: '2026-10-27T21:40:00Z'
    actor: {role: executor, session: owner-chat-milky-way-20261027}
    kind: observed
    note: 'Cause, measured against star-explorer/public/textures/milky-way-4k.jpg (NASA SVS 4851 Milky Way layer, bright stars removed): (1) splotchy = ESO eso0932a has its stars baked in; (2) bright = Star Explorer draws an sRGB texture times colour #6e6e6e (0.155 linear, AdditiveBlending, toneMapped false), which darkens faint values far more than bright ones, while SkyView multiplies raw sRGB values by PICTURE_GAIN 0.5, leaving a grey haze. Rejected: ESA Gaia EDR3 flux map (sci.esa.int, CC BY-SA 3.0 IGO): mean grey 18.8% vs NASA 3.9%, 64% of the sky above 8% vs 16%; owner "soo much worse". Chosen: Wikimedia Commons File:Milky_Way_360_equirectangular_rendering_with_foreground_stars_removed.png (Kevinmloch, bsrender from Gaia EDR3, stars within 3 kpc removed, CC BY-SA 4.0, 8000x4000; 32000x16000 original not linked). Galactic, l = 0 centred, increasing left, as milkyWayUv expects: LMC 0.1 deg and SMC 0.3 deg from expected (mirrored copy 15.2/9.5 deg). Local trial (uncommitted; files git-ignored in packages/astraeus-site/data/local/sky/): the 3840 px Wikimedia thumbnail, linearised, times 0.04, re-encoded, times 2 to undo PICTURE_GAIN, JPEG q85 = 245 KB, mean grey 2.2% matching the NASA layer drawn the Star Explorer way; NASA layer reprojected equatorial to galactic as a control (?skymap=nasa, local only, licence unchanged). Switch: trialPictureFromSearch in packages/astraeus/src/app/SkyView.ts, ?skymap=starless|nasa. tsc passed; no tests run, no browser run by the assistant.'
  - at: '2026-10-29T10:50:00Z'
    actor: {role: executor, session: i026-repair-2026-10-29}
    kind: repair_attempted
    note: 'Repair built on the owner''s 2026-10-27 and 2026-10-29 decisions (3840 px starless Gaia EDR3 render). Fetched the 3840 px Commons thumbnail of File:Milky_Way_360_equirectangular_rendering_with_foreground_stars_removed.png (Special:FilePath ?width=3840, 10.08 MB PNG, undimmed; the 8000 px original was not fetched), flattened alpha, re-encoded as JPEG q70 4:2:0: packages/astraeus-data/src/textures/milky-way.jpg, 3840x1920, 530,833 bytes. Removed milky-way-left.jpg and milky-way-right.jpg (3.70 MB together): download 3.70 MB -> 0.53 MB. Licence record (PROV-02) in astraeus-data pictures.ts (one picture "milky-way"), NOTICE, README, root README table and credit line, assets.html (card, credit row, caption) and DONOR_PROVENANCE.md: Milky Way render by Kevinmloch (bsrender) from Gaia EDR3, ESA/Gaia/DPAC, CC BY-SA 4.0, resized and re-encoded; dimmed when drawn. Engine: ESO_PICTURE became MILKY_WAY_PICTURE (one tile), SKY_SOURCES and the sky accuracy text updated. Dimming is in the picture shader (PICTURE_DIM 0.04: pow 2.2 decode, times 0.04, pow 1/2.2 encode, then times PICTURE_GAIN, now 1 where it was 0.5; the trial''s x0.04 then x2 for the old gain is the same default), so milkyWayBrightness still scales it; the brightness slider is the live tuning. Removed trialPictureFromSearch and deleted the git-ignored trial files in data/local/sky/. Registration probe on the shipped file (blurred peak vs expected galactic position): LMC 0.09 deg, SMC 0.23 deg off (limit 0.5). Default off unchanged. Tests updated for one tile (sky, skyPicture, publicApi, assetsPageCredits, packagePacks). Gates: lint, typecheck, build, npm test (1886 passed 1 skipped), check:pack, check:engine-alone all pass. No browser run; owner look on localhost:5490 pending. Not resolved: a Check verifies.'
  - at: '2026-10-29T10:58:25Z'
    actor: {role: owner, session: i026-repair-20261029}
    kind: owner_decision
    note: 'Owner, 2026-10-29, after looking at the repaired picture on the localhost:5490 preview (app.html?milkyway=on): "Keep it off by default (Recommended)"; earlier the same day chose the 3840 px picture. Recorded by the coordinator.'
---

# I-026: The Milky Way picture is too soft beside the catalogue stars

## Summary

The Milky Way picture (ESO eso0932a, ESO/S. Brunier, CC BY 4.0) is the largest free version available, 6000x3000 pixels, which is 16.7 px/deg. A 60 degree view on a 1920 px screen needs about 32 px/deg, so it is magnified about 2x and looks soft beside the sharp catalogue stars. Its registration to the galactic frame is also good only to a few degrees (T-053 evidence, criterion 2), and it carries its own baked-in faint stars that do not coincide with the catalogue stars. Owner decision 2026-10-15: the picture starts switched off (`?milkyway=on`, or Developer > Display settings > "Milky Way picture", turns it on) until a better texture is found. This is outside O-011.

## Evidence

- T-053 evidence ("Owner feedback 2" and the 2026-10-15 rework): the owner finds the stars not sharp with the picture on.
- eso0932a's Fullsize Original is 6000x3000; no larger version is published.

## Proof Needed

Evaluate better sources and pick one with a recorded licence (PROV-02):

- NASA SVS Deep Star Maps 2020 (licence to be confirmed).
- Gaia DR3 all-sky maps (ESA/Gaia/DPAC, CC BY-SA 3.0 IGO; check the share-alike effect on the repository).
- Tiled HiPS surveys (resolution on demand, needs a loader).

A replacement should reach roughly 30 px/deg or be tiled to do so, register to the galactic frame better than the current few degrees, and carry no baked-in stars that disagree with the catalogue. The owner's look then decides whether it can be on by default.

### 2026-10-27: owner's choice

The owner chose the starless Gaia EDR3 render on Wikimedia Commons (Kevinmloch, CC BY-SA 4.0) on a local trial; see the 2026-10-27 history entries. A smooth, subtle look outranks the 30 px/deg target above: the trial's 3840 px picture is about 10.7 px/deg and still won. The repair, after T-181:

- Ship the picture in `astraeus-data` in place of the two ESO halves, with its licence and credit recorded (PROV-02): "Milky Way render by Kevinmloch (bsrender) from Gaia EDR3, ESA/Gaia/DPAC, CC BY-SA 4.0", and say that it was resized and dimmed. Decide the size: the 3840 px thumbnail, or the 8000x4000 original (about 60 MB to fetch once) cut into two 4000 px tiles.
- Do the dimming in the picture shader (linearise, scale, re-encode, as Star Explorer's sRGB texture times #6e6e6e does), not baked into the file, so `milkyWayBrightness` keeps working.
- Remove the trial switch `trialPictureFromSearch` and the git-ignored trial files.
- Re-check registration (Magellanic Clouds within 0.5 deg) and the download size against today's 3.7 MB. The owner decides whether it is on by default.
