# Packaging the engine for npm (T-159, O-036)

Decision note for the owner. Plain words first, technical appendix last. Measured 2026-10-23 on branch `o036-npm`; nothing in `packages/` was changed, the spike lives outside the repository.

## The short version

1. **Build:** compile the engine with `tsc` (plain JavaScript plus type files), then a small script turns each picture import into a file reference the customer's bundler understands and copies the pictures. Vite's own "library mode" was tried and rejected: it pastes every picture into the code as text and produced a 61 MB JavaScript file.
2. **Two kinds of package:** `astraeus` (about 10.5 MB to download) holds the code, the planets' positions and the pictures of the Sun, Earth, Moon and the eight planets plus the Milky Way. The pictures and positions for the moons go in `astraeus-data`.
3. **One number in the plan was wrong.** The Objective says the moon positions are "about 38 MB". Measured, they are **120 MB** (9,275 files; Saturn alone is 39 MB), and they do not compress. Together with 35 MB of pictures the data package would be **146 MB** to download. That is allowed by npm but is heavy, and it sits right at the size some mirrors accept. So I recommend splitting the data (decision A below).
4. **Finding the data:** the customer imports what they want from `astraeus-data` and hands it to the engine. Nothing is searched for behind their back. If it was not handed in, those bodies are simply not offered (never invented).
5. **Publishing by GitHub:** possible, but npm needs the package to exist first, so the very first publish of each package is done by hand once. After that a GitHub release publishes both, with a provenance badge.

## Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Build tool | `tsc` emits ES modules plus `.d.ts`; a post step rewrites picture imports to `new URL("./x.jpg", import.meta.url).href` and copies the pictures. Relative imports and exports get their `.js`, and JSON named imports become default imports, so webpack 5 accepts them (O-036 repair of I-077). Proven in scratch apps from the packed tarballs: Vite 8, webpack 5.112 and Parcel 2.16 (with `packageExports: true`). Source code is not touched until step 3. |
| 2 | Pictures and JSON | Pictures stay separate files (no inlining). JSON is imported as JSON; the customer's bundler handles it. Moon position chunks (`.bin`) are listed one by one in a generated file per planet system, so a customer's build copies only the systems they import. Each URL ends `?no-inline` because Vite otherwise pastes every chunk under 4 kB into the entry script as a `data:` URL (Saturn: a 14.97 MB entry, 5,321 inlined chunks; with the query: 1.87 MB and 5,849 separate files; I-078). Spike: importing Mars alone put 61 chunk files plus Earth into the build (7.5 MB), nothing else. |
| 3 | Finding `astraeus-data` | Explicit: `import { chunkUrls, loadIndex } from "astraeus-data/saturn"` and pass it to `mount(..., { data })`. A hidden "look for the package" lookup was rejected: bundlers either fail on a missing optional package or ship all of it. Without data the catalogue does not list those bodies and `addBody("titan")` throws a message naming the package to install. The engine already takes chunk URLs from the caller, so this matches today's design. |
| 4 | Dependencies | `react`, `react-dom`, `@react-three/fiber`, `three`, `@lizard-isana/orb` are ordinary dependencies of `astraeus`, so `npm install astraeus` just works for someone who knows no React. `mount` makes its own React root, so a second React copy is harmless. Revisit `three` as a peer dependency if users report duplicate-three warnings. |
| 5 | What `astraeus` holds | Code; `data/bodies`, `moons`, `orbits`, `rings`, `ephemerides/planets` (positions of the planets, 0.33 MB); pictures of Earth, Moon, Sun, Mercury, Venus (2k), Mars, Jupiter, Saturn, Uranus, Neptune (about 5.9 MB) plus the Milky Way pair (3.7 MB) and the star list (0.28 MB). |
| 6 | What the data holds | Pictures: Venus 8k, the Saturn moons (4k), Triton, Pluto, Charon, Io, Europa, Ganymede, Callisto (35.1 MB). Moon positions for Jupiter, Mars, Saturn, Uranus, Neptune, Pluto (119.6 MB). |
| 7 | Licences | Each package ships a `licenses/` folder and `NOTICE` for what it contains (PROV-01, PROV-02). Pictures keep their per-picture credit records in the code that references them: the records for the moved pictures must move to `astraeus-data` with them. The engine's `ERFA`, orb.js and sgp4 notices stay with the engine. Data package adds the Horizons credit from `data/ephemerides/README.md`. |
| 8 | The code move this implies | Today the engine's catalogue imports the moon pictures directly (for example `planetSystemMaps.ts`). A compiled engine without those files would fail to build for customers. The moon visual records (and moon definitions) must move into `astraeus-data` and register themselves into the engine's catalogue. This is the main work of step 3, and the demos must keep working unchanged. |

### Owner decision A: how to split the data

| Option | Packages | Largest download |
|---|---|---|
| One package (as planned) | `astraeus-data` 146 MB | 146 MB |
| **Recommended: pictures and positions apart, positions per system** | `astraeus-data` (pictures, about 35 MB) and `astraeus-data-jupiter` 22.9 MB, `-saturn` 40.0 MB, `-uranus` 32.6 MB, `-neptune` 17.8 MB, `-mars` 5.5 MB, `-pluto` 1.8 MB | 40 MB |
| Trim the date range | Keep 2010 to 2030 but ship fewer years | Changes what the demos show; not recommended |

The recommended option costs six more package names on npm (all published by the same workflow) and keeps every download under about 40 MB. It does mean the roadmap's "`astraeus-data`" becomes a family. If you want exactly two packages, the 146 MB single package works but I can not confirm that mirrors such as jsDelivr will serve it (I did not find their current limit; check before relying on it).

### Owner decision B: the Milky Way pictures (3.7 MB, a third of the engine) could go to the data package, leaving a plain star field in the small engine. Recommended: keep them in the engine.

## Size limits for the pack check (step 3)

Measured with `npm pack` of the spike; limits are about 10% above measured. The check also lists the files and fails on anything unexpected (for example `.test.`, `tools/`, `.horizons-cache`).

| Package | Measured packed / unpacked / files | Limit packed / unpacked / files |
|---|---|---|
| `astraeus` | 10.5 MB / 12.0 MB / 387 | 12 MB / 14 MB / 450 |
| `astraeus-data` (pictures only, option A) | about 35 MB / 35.1 MB / about 20 | 39 MB / 39 MB / 40 |
| `astraeus-data-jupiter` | about 22.9 MB | 25 MB, 2,400 files |
| `astraeus-data-saturn` | about 40.0 MB | 44 MB, 6,000 files |
| `astraeus-data-uranus` | about 32.6 MB | 36 MB, 700 files |
| `astraeus-data-neptune` | about 17.8 MB | 20 MB, 400 files |
| `astraeus-data-mars` | about 5.5 MB | 6.1 MB, 80 files |
| `astraeus-data-pluto` | about 1.8 MB | 2 MB, 140 files |
| Single `astraeus-data` (if you refuse A) | 146.0 MB / 155.7 MB / 9,297 | 160 MB / 171 MB / 9,400 |

(Per-system figures are the committed file sizes plus the generated list; the pack check of step 3 replaces them with real `npm pack` numbers.)

## Publishing from GitHub (owner addition, 2026-10-23: "A GitHub release you create")

**Can npm trusted publishing be set up before the package exists?** No. npm's `npm trust` page states "The package you're configuring must already exist on the npm registry", and the trusted-publisher setting lives in the package's own settings page on npmjs.com. The trusted-publishing page does not mention first publishes at all. So:

- **Recommended:** publish `0.1.0` of each package once by hand from your machine (`npm publish --access public`, with 2FA). Then add the trusted publisher. Every later release is automatic. (A granular token in a GitHub secret would also allow the first publish from GitHub, but it is a long-lived secret that we would then have to delete; trusted publishing needs none.)
- If a name is already taken on npm, we find out at that first manual publish. Check availability of `astraeus` and `astraeus-data` (or scoped `@owner/...`) before step 3 finishes.

**One-time setup on npmjs.com (you), per package:** turn on 2FA for your account; publish the package once; open the package, Settings, "Trusted Publisher", choose GitHub Actions; enter the GitHub user or organisation, the repository, and the workflow file name exactly (for example `publish.yml`, case-sensitive, extension included; leave the environment empty or name a GitHub environment you also create). npm does not check the entry when you save it; mistakes show up only when the workflow runs, and a new entry must have its first successful publish within 2 days. An entry cannot be edited, only deleted and re-added. Each package can have up to 10 entries.

**Workflow outline** (file `.github/workflows/publish.yml`, written in the last step, not now):

- Trigger: `on: release: types: [published]` (you press "Publish release" on GitHub).
- Permissions: `contents: read` and `id-token: write` (needed for the sign-in with no token and for provenance).
- Runner: GitHub-hosted `ubuntu-latest` (self-hosted runners are not supported).
- Steps: checkout; `actions/setup-node` with Node 24 (needs Node 22.14 or later and npm 11.5.1 or later) and the npm registry; `npm ci`; run the gates (lint, typecheck, test) and the pack check; build the packages; check the release tag equals the version in each `package.json`; `npm publish --provenance --access public` for each package from its folder (provenance is added automatically with trusted publishing from a public repository; the flag is harmless).
- `package.json` needs a `repository` field matching the GitHub repository exactly, and the repository must be public for the provenance badge.

Sources (read 2026-10-23): https://docs.npmjs.com/trusted-publishers ; https://docs.npmjs.com/generating-provenance-statements ; https://docs.npmjs.com/cli/v11/commands/npm-trust

## Open risks

- The moon visuals and definitions must move into the data package (decision 8); this touches the catalogue and, through it, the demos. Highest-risk part of step 3.
- Customers using esbuild directly (no Vite, webpack or Parcel) do not get `new URL(..., import.meta.url)` copying by default.
- The compiled output needs a bundler: it imports CSS, pictures and JSON, so plain Node or bare browser module loading fails. Its relative imports do carry `.js` (I-077).
- `__PUBLIC_BUILD__` is a build-time flag in the source; the post step replaces it with `false`.
- The 120 MB size figure must be corrected in the Objective text.
- Public-site rights: the `PLANETS_DEMO_ONLY` list in the site config is unaffected, but it names engine picture paths that will change when pictures move.

## Appendix: commands and results

Scratch folder: `/tmp/claude-1000/-home-user-code-Astraeus/00a3b7e2-dcc4-432a-a7e9-b1f995ca1a1f/scratchpad/` (engine copy `engine/`, packages `pk/`, tarballs `tarballs/`, consumer `app/`).

```
# sizes: tracked files only (git ls-files), packages/astraeus
src/assets/textures 45.14 MB (28 files)   data/ephemerides 119.95 MB (9,277 files)
  jupiter 22.67, saturn 39.44, uranus 32.51, neptune 17.73, mars 5.49, pluto 1.77, planets 0.33
src/core 0.24, src/app 0.45, src/shell 0.21; data/bodies 0.51, moons 0.29, orbits 0.08, rings 0.01

# rejected: Vite 8.3.5 library mode (assetsInlineLimit 0 and () => false both ignored)
vite build  -> dist/index.js 61,179 kB (45 MB gzip), pictures base64 inside

# chosen: tsc 6.0.2 -p tsconfig.build.json (declaration, outDir dist-tsc), then
node fix-assets.mjs dist-tsc ..      # 27 picture imports rewritten, pictures copied; 174 .d.ts files
# compiled tree: 4.6 MB before copy, 48 MB with all pictures

# packs
astraeus-0.1.0.tgz       package size 10.5 MB  unpacked 12.0 MB  387 files
astraeus-data-0.1.0.tgz  package size 146.0 MB unpacked 155.7 MB 9,297 files
generated chunk lists: jupiter.js 237 kB, saturn 601 kB, uranus 58 kB, neptune 34 kB, pluto 12 kB, mars 6 kB

# consumer: scratch Vite 8.3.5 app, npm i both tarballs; main.js imports astraeus/spike and astraeus-data/mars
vite build -> dist 7.5 MB, 63 assets (61 chunks of Mars, Earth picture, scripts)
headless chromium (playwright-core, swiftshader, no screenshot), console line:
SPIKE {"textureUrl":".../assets/earth-bmng-july-4k-....jpg","imageWidth":4096,"triangles":2208,"marsChunks":60,"indexBodies":3}
```

The spike draws a sphere with the engine's real Earth picture reference through the compiled package (picture loaded at 4096 px wide, 2,208 triangles rendered) and reads Mars's index and chunk list from the data package. It does not run the full `App`; that arrives with the API in step 2.

## Owner decisions

Owner decisions (2026-10-23): data split "Split per planet (Recommended)" — `astraeus-data` holds the moon pictures (and Venus 8k), `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` hold moon positions; Milky Way pictures "Move to the data package" — a plain engine install shows the catalogue stars without the Milky Way picture until `astraeus-data` is added; note accepted "Yes, go ahead (Recommended)". Names `astraeus`, `astraeus-data`, `astraeus-data-jupiter`, `astraeus-data-saturn` checked free on npm by the coordinator.
