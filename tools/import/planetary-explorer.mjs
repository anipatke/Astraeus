#!/usr/bin/env node
// Planetary Explorer importer (O-018, T-077).
//
// Reads the owner's Planetary Explorer checkout (read only) and writes one
// data package per body under data/bodies/<body>/. Feature coordinates are
// carried over exactly as the donor holds them: nothing is rounded,
// re-derived, converted or corrected here. Package format: data/bodies/README.md.
//
// Usage: node tools/import/planetary-explorer.mjs [--dry-run] [--donor <dir>] [--out <dir>]
// Needs Node with built-in TypeScript type stripping (22.18+ or 24) to read the
// donor's src/entities/*.ts.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')
const FORMAT = 'astraeus.body-package/1'
const DEFAULT_DONOR = '/home/user/code/planetary-explorer'

function parseArgs(argv) {
  const opts = { dryRun: false, donor: DEFAULT_DONOR, out: join(REPO, 'data', 'bodies') }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dry-run') opts.dryRun = true
    else if (argv[i] === '--donor') opts.donor = resolve(argv[++i])
    else if (argv[i] === '--out') opts.out = resolve(argv[++i])
    else throw new Error(`Unknown argument: ${argv[i]}`)
  }
  return opts
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

/** Throws if any number anywhere in the value is negative zero (JSON would write it as 0). */
function assertNoNegativeZero(value, where) {
  if (typeof value === 'number' && Object.is(value, -0)) throw new Error(`Negative zero at ${where}`)
  if (Array.isArray(value)) value.forEach((v, i) => assertNoNegativeZero(v, `${where}[${i}]`))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertNoNegativeZero(v, `${where}.${k}`)
  }
}

/** Registry order, entity file and feature file per body, read from planetRegistry.ts. */
function readRegistry(donor) {
  const text = readFileSync(join(donor, 'src/entities/planetRegistry.ts'), 'utf8')
  const configFile = new Map() // configVar -> entity file
  for (const m of text.matchAll(/import \{ (\w+Config) \} from '\.\/(\w+)'/g)) configFile.set(m[1], m[2])
  const dataFile = new Map() // dataVar -> data file name
  for (const m of text.matchAll(/import (\w+) from '\.\.\/\.\.\/data\/([\w-]+\.json)'/g)) dataFile.set(m[1], m[2])
  const featureVar = new Map() // featuresVar -> dataVar
  for (const m of text.matchAll(/const (\w+) = (\w+) as PlanetFeature\[\]/g)) featureVar.set(m[1], m[2])
  const entries = []
  for (const m of text.matchAll(/\[(\w+Config)\.id\]: \{\s*config: \w+Config,\s*features: (\w+),/g)) {
    const entityFile = configFile.get(m[1])
    const featureData = dataFile.get(featureVar.get(m[2]))
    if (!entityFile || !featureData) throw new Error(`Cannot resolve registry entry ${m[1]}`)
    entries.push({ configVar: m[1], entityFile, featureData })
  }
  return entries
}

/** Pixel size from a JPEG's start-of-frame header. */
function jpegSize(buffer, label) {
  let i = 2
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) { i += 1; continue }
    const marker = buffer[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) }
    }
    i += 2 + buffer.readUInt16BE(i + 2)
  }
  throw new Error(`No JPEG frame header in ${label}`)
}

/** Top-level README bullets that name texture files, with their indented lines. */
function readTextureBlocks(donor) {
  const lines = readFileSync(join(donor, 'public/textures/README.md'), 'utf8').split('\n')
  const blocks = []
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^- `/.test(lines[i])) continue
    const head = lines[i]
    const block = [head]
    while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i])
    const files = [...head.matchAll(/`([^`]+\.jpg)`/g)].map((m) => m[1])
    blocks.push({ files, lines: block })
  }
  return blocks
}

function readReadmeNotes(donor) {
  const notes = new Map()
  for (const line of readFileSync(join(donor, 'public/textures/README.md'), 'utf8').split('\n')) {
    const m = /^- The current (\w+) release/.exec(line)
    if (m) notes.set(m[1].toLowerCase(), line)
  }
  return notes
}

function creditGroups(donor, bodyName) {
  const groups = []
  let current = null
  for (const line of readFileSync(join(donor, 'CREDITS.md'), 'utf8').split('\n')) {
    if (/^### /.test(line)) current = { group: line.slice(4), licence: null, text: '' }, groups.push(current)
    else if (/^## /.test(line)) current = null
    else if (current) {
      const m = /^- \*\*License:\*\* (.*)/.exec(line)
      if (m) current.licence = m[1]
      current.text += `${line}\n`
    }
  }
  const word = new RegExp(`\\b${bodyName}\\b`, 'i')
  return groups
    .filter((g) => g.licence && /Bodies/.test(g.text) && word.test(g.text.slice(g.text.indexOf('Bodies'))))
    .map((g) => ({ group: g.group, licence: g.licence }))
}

function longitudeRange(features) {
  const values = features.filter((f) => typeof f.longitude === 'number').map((f) => f.longitude)
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : null
}

function findOddities(features, categories, bodyId) {
  const oddities = []
  const ids = new Set()
  const keys = new Set(categories.map((c) => c.key))
  for (const f of features) {
    if (ids.has(f.id)) oddities.push(`duplicate feature id ${f.id}`)
    ids.add(f.id)
    if (!keys.has(f.category)) oddities.push(`${f.id}: category "${f.category}" is not in the body's categories`)
    const hasLat = typeof f.latitude === 'number'
    const hasLon = typeof f.longitude === 'number'
    if (!hasLat || !hasLon) {
      oddities.push(`${f.id}: no latitude/longitude${f.ringRadius !== undefined ? ' (ring-plane feature, ringRadius set)' : ''}`)
      continue
    }
    if (f.latitude < -90 || f.latitude > 90) oddities.push(`${f.id}: latitude ${f.latitude} outside -90..90`)
    if (f.longitude < -180 || f.longitude > 360) oddities.push(`${f.id}: longitude ${f.longitude} outside -180..360`)
  }
  void bodyId
  return oddities
}

function headerFor(commit, id, name, parent, kind) {
  return {
    format: FORMAT, kind, body: id, name, parent: parent ?? null,
    donor: { project: 'planetary-explorer', commit },
  }
}

function textureVariants(donor, config, blocks) {
  const id = config.id
  return config.textures.variants.map((variant) => {
    const file = basename(variant.src)
    const path = join(donor, 'public', variant.src)
    if (!existsSync(path)) throw new Error(`Texture missing for ${id}: ${path}`)
    const bytes = readFileSync(path)
    const block = blocks.find((b) => b.files.includes(file))
    return {
      src: variant.src,
      ...(variant.minViewportWidth !== undefined ? { minViewportWidth: variant.minViewportWidth } : {}),
      ...jpegSize(bytes, path),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      donorReadme: block ? block.lines : null,
    }
  })
}

/** The recorded map source of a body: from the donor README, else from the override file, else null (the body is refused). */
function mapSourceOf(donor, config, variants, override) {
  const readmeHasSource = variants.some((v) => v.donorReadme?.some((l) => /^\s+- (Source|Derived)/.test(l)))
  if (readmeHasSource) {
    const licenceLine = variants.flatMap((v) => v.donorReadme ?? []).find((l) => /^\s+- Licen[cs]e:/.test(l))
    return {
      recordedBy: 'donor public/textures/README.md',
      licence: licenceLine ? licenceLine.replace(/^\s+- Licen[cs]e:\s*/, '') : null,
      creditsMd: creditGroups(donor, config.name),
    }
  }
  if (!override) return null
  return {
    recordedBy: 'astraeus tools/import/planetary-explorer-map-sources.json',
    recordedIn: override.recordedIn,
    donorFileSourced: override.donorFileSourced,
    ...(override.donorFileShippable === false ? { donorFileShippable: false } : {}),
    description: override.source,
    sourcePage: override.sourcePage,
    licence: override.licence,
    credit: override.credit,
    ...(override.registration ? { registration: override.registration } : {}),
  }
}

function coordinatesOf(features, convention, note) {
  return {
    placement: 'latLonToXYZ in the donor src/entities/hotspot.ts, on Three.js SphereGeometry UVs',
    latitudeDegrees: 'north positive, -90 to 90',
    longitudeDegrees: 'exactly as stored in features.json, placed by latLonToXYZ whatever the range; the donor stores values already in its own marker frame (see longitudeRange, markerLongitudeFromSource and donorReadmeNote)',
    longitudeRange: longitudeRange(features),
    phiDeg: '90 - latitude (polar angle from +Y)',
    thetaDeg: 'longitude + 90 (azimuth from +X toward +Z)',
    position: '[radius * sin(phi) * sin(theta), radius * cos(phi), radius * sin(phi) * cos(theta)]',
    phiOffsetDeg: 90,
    thetaOffsetDeg: 90,
    sourceLongitude: convention?.sourceLongitude ?? null,
    markerLongitudeFromSource: convention ? convention.markerLongitudeFromSource : null,
    textureRecentringDeg: convention?.textureRecentringDeg ?? 0,
    ...(convention?.recentringEvidence ? { recentringEvidence: convention.recentringEvidence } : {}),
    ...(convention?.note ? { conventionNote: convention.note } : {}),
    donorReadmeNote: note ?? null,
  }
}

/** One body's package, or { refused: id } when the body has no recorded map source. `ctx` holds the donor path, commit and the files read once. */
async function packageFor(entry, ctx) {
  const { donor, commit, overviews, sourceOverrides, conventions, blocks, notes } = ctx
  const moduleExports = await import(pathToFileURL(join(donor, 'src/entities', `${entry.entityFile}.ts`)).href)
  const config = moduleExports[entry.configVar]
  const id = config.id
  const features = readJson(join(donor, 'data', entry.featureData))
  assertNoNegativeZero(features, entry.featureData)
  const overview = overviews.find((o) => o.bodyId === id)
  if (!overview) throw new Error(`No overview for ${id}`)

  const variants = textureVariants(donor, config, blocks)
  const source = mapSourceOf(donor, config, variants, sourceOverrides[id])
  if (source === null) return { refused: id }

  const header = (kind) => headerFor(commit, id, config.name, config.parentPlanetId, kind)
  const map = {
    ...header('map'),
    textures: variants,
    source,
    coordinates: coordinatesOf(features, conventions[id] ?? null, notes.get(id)),
  }
  const oddities = findOddities(features, config.categories, id)
  return {
    id, name: config.name, oddities,
    files: {
      'features.json': { ...header('features'), featureCount: features.length, features },
      'categories.json': { ...header('categories'), categories: config.categories },
      'overview.json': { ...header('overview'), overview },
      'map.json': map,
    },
  }
}

function catalogueOf(commit, packages) {
  return {
    format: FORMAT,
    kind: 'catalogue',
    donor: { project: 'planetary-explorer', commit },
    bodyCount: packages.length,
    featureCount: packages.reduce((n, p) => n + p.files['features.json'].featureCount, 0),
    bodies: packages.map((p) => ({
      body: p.id, name: p.name, parent: p.files['map.json'].parent,
      featureCount: p.files['features.json'].featureCount,
      categoryCount: p.files['categories.json'].categories.length,
      mapSource: p.files['map.json'].source.recordedBy,
      donorOddities: p.oddities,
    })),
  }
}

function reportAndWrite(packages, opts) {
  for (const p of packages) {
    console.log(`${p.id}: ${p.files['features.json'].featureCount} features, ${p.files['categories.json'].categories.length} categories, map source ${p.files['map.json'].source.recordedBy}${p.oddities.length ? `, ${p.oddities.length} oddities` : ''}`)
    if (!opts.dryRun) {
      const dir = join(opts.out, p.id)
      mkdirSync(dir, { recursive: true })
      for (const [name, value] of Object.entries(p.files)) writeFileSync(join(dir, name), json(value))
    } else {
      console.log(`  would write ${Object.keys(p.files).map((n) => `${p.id}/${n}`).join(', ')}`)
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const { donor } = opts
  if (!existsSync(join(donor, 'src/entities/planetRegistry.ts'))) throw new Error(`Not a Planetary Explorer checkout: ${donor}`)
  const commit = execFileSync('git', ['-C', donor, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  register('./ts-resolve-hook.mjs', import.meta.url)

  const ctx = {
    donor, commit,
    overviews: readJson(join(donor, 'data/body-overviews.json')),
    sourceOverrides: readJson(join(HERE, 'planetary-explorer-map-sources.json')),
    conventions: readJson(join(HERE, 'planetary-explorer-conventions.json')).bodies,
    blocks: readTextureBlocks(donor),
    notes: readReadmeNotes(donor),
  }

  const packages = []
  const refused = []
  for (const entry of readRegistry(donor)) {
    const pkg = await packageFor(entry, ctx)
    if (pkg.refused !== undefined) refused.push(pkg.refused)
    else packages.push(pkg)
  }

  if (refused.length > 0) {
    console.error(`Refusing: no recorded map source for ${refused.join(', ')}. Add a README entry in the donor or a record in tools/import/planetary-explorer-map-sources.json.`)
    process.exitCode = 1
    return
  }

  const catalogue = catalogueOf(commit, packages)
  reportAndWrite(packages, opts)
  if (!opts.dryRun) {
    mkdirSync(opts.out, { recursive: true })
    writeFileSync(join(opts.out, 'catalogue.json'), json(catalogue))
  }
  console.log(`${opts.dryRun ? 'Dry run: would write' : 'Wrote'} ${catalogue.bodyCount} bodies, ${catalogue.featureCount} features (donor ${commit.slice(0, 7)})`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
