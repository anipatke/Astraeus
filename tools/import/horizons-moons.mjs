#!/usr/bin/env node
// Jupiter's moons as piecewise Chebyshev fits of JPL Horizons state vectors (O-025 T-096).
//
// Every moon Horizons lists for Jupiter (its major-body list: 501-5xx and the provisional 555xx designations) and Jupiter
// itself are fetched relative to the Jupiter system barycentre (NAIF 5), geometric, ICRF (Astraeus's EQJ), km and km/s, in
// TDB. Storing each body about the barycentre keeps the outer moons smooth (about Jupiter's centre they carry Jupiter's
// own wobble of about 100 km at the Galilean periods); the provider subtracts Jupiter's series to give Jupiter-centred states.
//
// Steps, all resumable (every Horizons response is cached gzipped under --cache; rerunning never asks twice):
//   1. list       the Horizons major-body list -> the moons, with names and designations
//   2. timescale  Horizons TDB - UT monthly over the span -> the TT - UTC table the provider uses
//   3. calibrate  per body, a dense year over the demo window: find the source's record grid, choose segment length and
//                 degree (tools/import/horizons-moons-policy.mjs); the choices are kept in horizons-moons-fit.json
//   4. build      per body, samples over the span on the chosen grid -> fitted, quantised chunks per calendar year
//   5. verify     per body, independent samples (never fit nodes) over the span and the demo window, and Jupiter-centred
//                 UT samples through the provider itself -> worst and typical error, written to the index and the report
//
// Usage: node tools/import/horizons-moons.mjs [--from 2010-01-01] [--to 2030-01-01] [--only 501,516] [--offline]
//          [--cache tools/import/.horizons-cache] [--out data/ephemerides/jupiter-moons] [--report <dir>] [--recalibrate]
// Needs Node with built-in TypeScript type stripping (22.18+ or 24) to load the shared fitting and provider code.

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gridSamples, headerOf, horizonsText, labelOfSeconds, MAX_ROWS, requestsMade, rowsOf, secondsOfDate, vectorParams } from './horizons-client.mjs'

// The shared fitting and provider code is TypeScript with extensionless imports: register the resolve hook before loading it.
register('./ts-resolve-hook.mjs', import.meta.url)
const {
  CALIBRATION_STEPS_MIN: CALIBRATION_STEPS, calibrationStepMinutes, choosePolicy, detectGrid, firstBoundaryAtOrAfter, fitSeries,
} = await import('./horizons-moons-policy.mjs')
const { encodeChunk, quantize } = await import('./chebyshevFit.ts')
const { decodeChunk, chunkPositionInto } = await import('../../src/core/chebyshevSeries.ts')
const { tdbMinusTtSeconds } = await import('../../src/core/timeScale.ts')
const { ChebyshevEphemeris, parseEphemerisIndex } = await import('../../src/core/chebyshevEphemeris.ts')

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')
const DAY_S = 86_400
const J2000_NOON_UNIX_MS = 946_728_000_000
const ORIGIN = '500@5'
const CENTRE_COMMAND = '599'
const CENTRE_ID = 'jupiter'
/** Jupiter's GM (km^3/s^2), Horizons physical data as recorded in data/orbits/io.json; only used to guess a period from a distance. */
const JUPITER_GM = 126686531.9
/** Jupiter's motion about the barycentre follows the Galilean moons; Io's period (days) is the fastest of them. */
const CENTRE_PERIOD_DAYS = 1.769
/** The demo window (O-025 Decision 4: 4 Nov 2016 for a year) with a month either side; calibration and the dense check use it. */
const CALIBRATION_WINDOW = ['2016-10-01', '2017-12-01']
/** Fit target, km: metre level for every body (one metre is under a pixel even at the closest view of a one-kilometre moon). */
const TARGET_KM = 0.001
/** Jupiter's own series enters every moon's Jupiter-centred position, so it is held ten times tighter. */
const CENTRE_TARGET_KM = TARGET_KM / 10
/** Coefficients are stored as whole multiples of a quantum: one hundredth of the body's target. */
const QUANTUM_PER_TARGET = 1 / 100
const LICENCE = 'JPL Horizons output is produced by NASA/JPL (a US Government-funded facility); used as US Government work with credit to NASA/JPL-Caltech Solar System Dynamics.'

function parseArgs(argv) {
  const opts = {
    from: '2010-01-01', to: '2030-01-01', only: null, offline: false, recalibrate: false,
    cache: join(HERE, '.horizons-cache'), out: join(REPO, 'data', 'ephemerides', 'jupiter-moons'), report: null,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--from') opts.from = argv[++i]
    else if (arg === '--to') opts.to = argv[++i]
    else if (arg === '--only') opts.only = new Set(argv[++i].split(','))
    else if (arg === '--offline') opts.offline = true
    else if (arg === '--recalibrate') opts.recalibrate = true
    else if (arg === '--cache') opts.cache = resolve(argv[++i])
    else if (arg === '--out') opts.out = resolve(argv[++i])
    else if (arg === '--report') opts.report = resolve(argv[++i])
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return opts
}

const log = (message) => process.stdout.write(`${message}\n`)
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

// ---------- 1. list ----------

/** Jupiter's moons from the Horizons major-body list, by its fixed-width columns. */
async function listMoons(opts) {
  const params = { COMMAND: "'MB'" }
  const text = await horizonsText(params, { cacheDir: opts.cache, offline: opts.offline })
  const lines = text.split('\n')
  const ruler = lines.findIndex((line) => /^\s*-{5,}\s+-{5,}/.test(line))
  if (ruler < 0) throw new Error('major-body list has no column ruler')
  const columns = [...lines[ruler].matchAll(/-+/g)].map((match) => [match.index, match.index + match[0].length])
  const cell = (line, index) => line.slice(columns[index][0], index + 1 < columns.length ? columns[index + 1][0] : undefined).trim()
  const moons = []
  for (const line of lines.slice(ruler + 1)) {
    const id = cell(line, 0)
    if (!/^(5\d\d|55\d{3})$/.test(id) || id === '599') continue
    moons.push({ naifId: Number(id), name: cell(line, 1) || null, designation: cell(line, 2) || null, aliases: cell(line, 3) || null })
  }
  const version = text.match(/API VERSION:\s*(\S+)/)?.[1] ?? null
  const cacheFile = (await import('node:fs')).readdirSync(opts.cache).find((name) => name.startsWith('MB-'))
  const fetchedUtc = statSync(join(opts.cache, cacheFile)).mtime.toISOString()
  return { moons, version, fetchedUtc }
}

// ---------- 2. timescale ----------

/** TT - UTC pieces from Horizons' TDB - UT (VEC_DELTA_T) sampled monthly: leap-second steps from 1972, straight lines before. */
async function timeScale(opts, fromS, toS) {
  const params = vectorParams({ command: CENTRE_COMMAND, center: ORIGIN, start: '1950-01-01', stop: '2050-01-01', step: '1 MONTHS', timeType: 'UT', table: '1', deltaT: true })
  const text = await horizonsText(params, { cacheDir: opts.cache, offline: opts.offline })
  const samples = rowsOf(text).map((row) => {
    const utcMs = Math.round((row[0] - 2440587.5) * DAY_S * 1000)
    const tt = (utcMs - J2000_NOON_UNIX_MS) / 1000 + row[1]
    return { utcMs, ttMinusUtc: row[1] - tdbMinusTtSeconds(tt), tdbMinusUt: row[1] }
  })
  const leapEra = Date.UTC(1972, 0, 1)
  const pieces = []
  let worstResidual = 0
  samples.forEach((sample, index) => {
    if (sample.utcMs < leapEra) {
      const next = samples[index + 1]
      pieces.push({ fromUtcMs: sample.utcMs, ttMinusUtcS: Number(sample.ttMinusUtc.toFixed(6)), driftSPerDay: Number(((next.ttMinusUtc - sample.ttMinusUtc) / ((next.utcMs - sample.utcMs) / (DAY_S * 1000))).toExponential(9)) })
      return
    }
    const stepped = 32.184 + Math.round(sample.ttMinusUtc - 32.184)
    worstResidual = Math.max(worstResidual, Math.abs(sample.ttMinusUtc - stepped))
    if (pieces.length === 0 || pieces.at(-1).ttMinusUtcS !== stepped || pieces.at(-1).driftSPerDay !== 0) pieces.push({ fromUtcMs: sample.utcMs, ttMinusUtcS: stepped, driftSPerDay: 0 })
  })
  // Keep only what the span needs (one piece before it, so its start is covered).
  const fromMs = J2000_NOON_UNIX_MS + fromS * 1000 - 2 * DAY_S * 1000
  const toMs = J2000_NOON_UNIX_MS + toS * 1000 + 2 * DAY_S * 1000
  const firstNeeded = Math.max(0, pieces.findLastIndex((piece) => piece.fromUtcMs <= fromMs))
  const kept = pieces.slice(firstNeeded).filter((piece, index) => index === 0 || piece.fromUtcMs <= toMs)
  return {
    table: { pieces: kept, validToUtcMs: Math.min(samples.at(-1).utcMs, Math.max(toMs, kept[0].fromUtcMs + 1)) },
    check: { samples: samples.length, worstResidualAfter1972S: worstResidual, note: 'Horizons TDB - UT less the SOFA dtdb series, against 32.184 s plus whole leap seconds, monthly 1972-2050' },
    source: `JPL Horizons API, COMMAND=599 CENTER=500@5 VECTORS with VEC_DELTA_T=YES, TIME_TYPE=UT, monthly 1950-01-01 to 2050-01-01 (${headerOf(text).generated ?? 'time not printed'})`,
  }
}

// ---------- 3. calibrate ----------

function periodDaysOf(header, firstRow, command) {
  if (command === CENTRE_COMMAND) return CENTRE_PERIOD_DAYS
  const stated = header.notes.join(' ').match(/Orbital period\s*[=~]\s*([\d.]+)\s*d/)
  if (stated) return Number(stated[1])
  const r = Math.hypot(firstRow.positionKm[0], firstRow.positionKm[1], firstRow.positionKm[2])
  return (2 * Math.PI * Math.sqrt((r ** 3) / JUPITER_GM)) / DAY_S
}

async function calibrationData(opts, command) {
  const [from, to] = CALIBRATION_WINDOW.map(secondsOfDate)
  const fetchGrid = async (startS, stepMin, count) => gridSamples(
    await horizonsText(vectorParams({ command, center: ORIGIN, start: labelOfSeconds(startS), stop: labelOfSeconds(startS + (count - 1) * stepMin * 60), step: `${stepMin}m` }), { cacheDir: opts.cache, offline: opts.offline }),
    startS, stepMin * 60, count,
  )
  // A first look at the body (one day) gives its header and a period estimate.
  const peekText = await horizonsText(vectorParams({ command, center: ORIGIN, start: labelOfSeconds(from), stop: labelOfSeconds(from + DAY_S), step: '1d' }), { cacheDir: opts.cache, offline: opts.offline })
  const header = headerOf(peekText)
  const periodDays = periodDaysOf(header, gridSamples(peekText, from, DAY_S, 2)[0], command)
  // A dense stretch from the window start finds the source's record grid: a kink in its higher derivatives only stands out
  // in sixth differences when the step is a small fraction of the period (period / 400, from 1 to 180 minutes).
  const probeStepMin = [1, ...CALIBRATION_STEPS].filter((step) => step <= (periodDays * 1440) / 400).at(-1) ?? 1
  const probe = await fetchGrid(from, probeStepMin, Math.min(20_000, Math.floor((120 * DAY_S) / (probeStepMin * 60))) + 1)
  const grid = detectGrid(probe, probeStepMin * 60)
  // The calibration year: at most period / 40, and at most a 24th of the record grid so a record can take a high degree.
  const gridLimitMin = grid === null ? Infinity : grid.lengthS / 60 / 24
  const stepMin = CALIBRATION_STEPS.filter((step) => step <= Math.min(calibrationStepMinutes(periodDays), gridLimitMin)).at(-1) ?? CALIBRATION_STEPS[0]
  const stepS = stepMin * 60
  const count = Math.floor((to - from) / stepS) + 1
  const samples = await fetchGrid(from, stepMin, count)
  const tests = await fetchGrid(from + stepS / 2, stepMin, count - 1)
  return { header, periodDays, stepS, samples, tests, grid, probeStepS: probeStepMin * 60 }
}

async function calibrate(opts, command, targetKm) {
  const { header, periodDays, stepS, samples, tests, grid, probeStepS } = await calibrationData(opts, command)
  const policy = choosePolicy({ samples, tests, stepS, grid, periodDays, targetKm })
  return {
    periodDays: Number(periodDays.toPrecision(6)),
    calibrationStepMinutes: stepS / 60,
    probeStepMinutes: probeStepS / 60,
    sourceGrid: grid === null ? null : { lengthS: grid.lengthS, phaseS: grid.phaseS, boundariesSeen: grid.boundaries },
    segmentSeconds: policy.lengthS,
    degree: policy.degree,
    phaseS: policy.phaseS,
    sampleStepS: policy.sampleStepS,
    coefficientsPerDay: Number(policy.costPerDay.toFixed(2)),
    calibrationWorstM: Number((policy.calibrationWorstKm * 1000).toFixed(4)),
    calibrationRmsM: Number((policy.calibrationRmsKm * 1000).toFixed(4)),
    calibrationTests: policy.calibrationTests,
    header,
  }
}

// ---------- 4. build ----------

async function productionSamples(opts, command, policy, stepS, fromS, toS) {
  const lengthS = policy.segmentSeconds
  let first = firstBoundaryAtOrAfter(policy.phaseS, lengthS, fromS)
  if (first > fromS) first -= lengthS
  const segmentCount = Math.ceil((toS - first) / lengthS - 1e-9)
  const stepMin = stepS / 60
  const perSegment = Math.round(lengthS / stepS)
  const segmentsPerPiece = Math.max(1, Math.floor((MAX_ROWS - 1) / perSegment))
  const samples = []
  for (let k = 0; k < segmentCount; k += segmentsPerPiece) {
    const segments = Math.min(segmentsPerPiece, segmentCount - k)
    const start = first + k * lengthS
    const rows = segments * perSegment + 1
    const text = await horizonsText(vectorParams({ command, center: ORIGIN, start: labelOfSeconds(start), stop: labelOfSeconds(start + (rows - 1) * stepS), step: `${stepMin}m` }), { cacheDir: opts.cache, offline: opts.offline })
    const piece = gridSamples(text, start, stepS, rows)
    samples.push(...(samples.length > 0 ? piece.slice(1) : piece))
  }
  return { firstS: first, segmentCount, stepS, samples }
}

function yearOf(seconds) {
  return new Date(J2000_NOON_UNIX_MS + seconds * 1000).getUTCFullYear()
}

/** The chunk files for one body (one per calendar year), encoded and read back as the provider will read them. */
function buildChunks(bodyId, lengthS, degree, quantumKm, firstS, blocks, fromYear, toYear) {
  const n = degree + 1
  const byYear = new Map()
  blocks.forEach((block, k) => {
    const year = Math.min(toYear - 1, Math.max(fromYear, yearOf(firstS + k * lengthS)))
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(k)
  })
  const chunks = []
  const decoded = []
  const files = []
  for (const [year, indices] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const coefficients = new Float64Array(indices.length * 3 * n)
    indices.forEach((k, i) => coefficients.set(quantize(blocks[k], quantumKm), i * 3 * n))
    const startTdbS = firstS + indices[0] * lengthS
    const bytes = encodeChunk({ startTdbS, segmentCount: indices.length, coefficientCount: n, quantumKm, coefficients })
    const path = `${bodyId}/${year}.bin`
    files.push({ path, bytes })
    chunks.push({ path, startTdbS, segmentCount: indices.length, bytes: bytes.byteLength })
    decoded.push(decodeChunk(bytes, { startTdbS, segmentSeconds: lengthS, segmentCount: indices.length, coefficientCount: n, quantumKm }))
  }
  return { chunks, decoded, files }
}

function writeChunkFiles(opts, bodyId, files) {
  const directory = join(opts.out, bodyId)
  rmSync(directory, { recursive: true, force: true })
  mkdirSync(directory, { recursive: true })
  for (const file of files) writeFileSync(join(opts.out, file.path), file.bytes)
}

/** The largest whole-minute divisor of the segment at most `maxStepS` leaving at least degree + 2 samples per segment. */
function stepFor(lengthS, maxStepS, degree) {
  const lengthMin = Math.round(lengthS / 60)
  for (let pieces = degree + 1; pieces <= lengthMin; pieces += 1) {
    if (lengthMin % pieces === 0 && (lengthMin / pieces) * 60 <= maxStepS) return (lengthMin / pieces) * 60
  }
  return 60
}

/** The next denser sample step: the largest whole-minute divisor of the segment below `stepS` leaving at least degree + 2 samples. */
function denserStep(lengthS, stepS, degree) {
  const lengthMin = Math.round(lengthS / 60)
  for (let pieces = Math.max(degree + 1, Math.round(lengthS / stepS) + 1); pieces <= lengthMin; pieces += 1) {
    if (lengthMin % pieces === 0) return (lengthMin / pieces) * 60
  }
  return 60
}

// ---------- 5. verify ----------

/** Error (km) of the shipped (decoded, quantised) chunks against samples, skipping any sample within a second of a fit node. */
function chunkError(decoded, samples, nodeStartS, nodeStepS) {
  const out = new Float64Array(3)
  let worst = 0
  let worstAt = null
  let sumSquares = 0
  let count = 0
  for (const sample of samples) {
    const phase = ((sample.tdbS - nodeStartS) % nodeStepS + nodeStepS) % nodeStepS
    if (phase < 1 || nodeStepS - phase < 1) continue
    const chunk = decoded.find((c) => sample.tdbS >= c.startTdbS && sample.tdbS <= c.startTdbS + c.segmentCount * c.segmentSeconds)
    if (chunk === undefined) continue
    chunkPositionInto(chunk, sample.tdbS, out, 0)
    const error = Math.hypot(out[0] - sample.positionKm[0], out[1] - sample.positionKm[1], out[2] - sample.positionKm[2])
    if (error > worst) {
      worst = error
      worstAt = sample.tdbS
    }
    sumSquares += error * error
    count += 1
  }
  return { worstM: Number((worst * 1000).toFixed(4)), worstAt: worstAt === null ? null : labelOfSeconds(worstAt) + ' TDB', rmsM: Number((Math.sqrt(sumSquares / Math.max(1, count)) * 1000).toFixed(4)), count }
}

/** Independent barycentric samples across the span: an odd step (1,051 min) from 17 min after the start. */
async function spanTests(opts, command, fromS, toS) {
  const stepMin = 1051
  const start = fromS + 17 * 60
  const count = Math.floor((toS - start) / (stepMin * 60)) + 1
  const text = await horizonsText(vectorParams({ command, center: ORIGIN, start: labelOfSeconds(start), stop: labelOfSeconds(start + (count - 1) * stepMin * 60), step: `${stepMin}m` }), { cacheDir: opts.cache, offline: opts.offline })
  return gridSamples(text, start, stepMin * 60, count)
}

/** Jupiter-centred UT samples (Horizons' own centre subtraction and time scale) about every 7.3 days across the span. */
async function endToEndSamples(opts, command, fromS, toS) {
  const stepMin = 10_513
  const startMs = J2000_NOON_UNIX_MS + fromS * 1000 + 3 * 3600 * 1000
  const count = Math.floor(((toS - fromS) * 1000 - 3 * 3600 * 1000) / (stepMin * 60_000)) + 1
  const label = (ms) => new Date(ms).toISOString().replace('T', ' ').replace('Z', '')
  const text = await horizonsText(vectorParams({ command, center: '500@599', start: label(startMs), stop: label(startMs + (count - 1) * stepMin * 60_000), step: `${stepMin}m`, timeType: 'UT' }), { cacheDir: opts.cache, offline: opts.offline })
  const rows = rowsOf(text)
  if (rows.length !== count) throw new Error(`end-to-end: expected ${count} rows, got ${rows.length}`)
  return rows.map((row, index) => ({ utcMs: startMs + index * stepMin * 60_000, positionKm: [row[1], row[2], row[3]] }))
}

/** The index as JSON with one body per line: compact, yet a rebuild's diff still shows which bodies changed. */
function indexText(index) {
  const { bodies: list, ...rest } = index
  const head = JSON.stringify(rest, null, 1)
  return `${head.slice(0, -2)},\n "bodies": [\n${list.map((body) => `  ${JSON.stringify(body)}`).join(',\n')}\n ]\n}\n`
}

// ---------- main ----------

const opts = parseArgs(process.argv.slice(2))
const fromS = secondsOfDate(opts.from)
const toS = secondsOfDate(opts.to)
const fromYear = Number(opts.from.slice(0, 4))
const toYear = Number(opts.to.slice(0, 4))
const policyPath = join(HERE, 'horizons-moons-fit.json')
const policies = existsSync(policyPath) && !opts.recalibrate ? readJson(policyPath) : {}

log(`Horizons moons importer: span ${opts.from} to ${opts.to}, cache ${relative(REPO, opts.cache)}`)
const list = await listMoons(opts)
log(`  ${list.moons.length} moons listed for Jupiter (major-body list fetched ${list.fetchedUtc})`)
const scale = await timeScale(opts, fromS, toS)
log(`  time scale: ${scale.table.pieces.length} pieces; after 1972 Horizons agrees with leap seconds + SOFA dtdb to ${(scale.check.worstResidualAfter1972S * 1e6).toFixed(1)} us`)

const targets = [
  { command: CENTRE_COMMAND, id: CENTRE_ID, label: 'Jupiter', naifId: 599, designation: null, aliases: null, role: 'centre' },
  ...list.moons.map((moon) => ({ command: String(moon.naifId), id: slug(moon.name ?? moon.designation), label: moon.name ?? moon.designation, naifId: moon.naifId, designation: moon.designation, aliases: moon.aliases, role: 'moon' })),
]
const ids = new Set()
for (const target of targets) {
  if (ids.has(target.id)) throw new Error(`two bodies would share the id "${target.id}"`)
  ids.add(target.id)
}

const previousIndexPath = join(opts.out, 'index.json')
const previous = existsSync(previousIndexPath) ? readJson(previousIndexPath) : null
const bodies = []
const report = []
for (const target of targets) {
  if (opts.only !== null && !opts.only.has(target.command) && target.role !== 'centre') {
    const kept = previous?.bodies.find((body) => body.id === target.id)
    if (kept) bodies.push(kept)
    continue
  }
  const started = Date.now()
  const targetKm = target.role === 'centre' ? CENTRE_TARGET_KM : TARGET_KM
  if (!policies[target.command]) {
    policies[target.command] = await calibrate(opts, target.command, targetKm)
    writeFileSync(policyPath, `${JSON.stringify(policies, null, 1)}\n`)
  }
  const policy = policies[target.command]
  // Fit the span; if the independent span check misses the target (the calibration year cannot show every orbit's sharpest
  // turn), first raise the degree twice, then halve the segment (rounded down to whole source records) at the calibrated degree.
  const tests = await spanTests(opts, target.command, fromS, toS)
  let lengthS = policy.segmentSeconds
  let degree = policy.degree
  let stepS = policy.sampleStepS
  let production
  let built
  let span
  for (let attempt = 0, raised = 0; ; attempt += 1) {
    production = await productionSamples(opts, target.command, { ...policy, segmentSeconds: lengthS }, stepS, fromS, toS)
    const blocks = fitSeries(production.samples, production.firstS, lengthS, degree, production.segmentCount)
    built = buildChunks(target.id, lengthS, degree, targetKm * QUANTUM_PER_TARGET, production.firstS, blocks, fromYear, toYear)
    span = chunkError(built.decoded, tests, production.firstS, production.stepS)
    if (span.worstM <= targetKm * 1000 || attempt >= 16) break
    const grid = policy.sourceGrid?.lengthS ?? DAY_S
    const shorter = Math.max(grid, Math.floor(lengthS / 2 / grid) * grid)
    if (raised < 2 || shorter >= lengthS) {
      raised += 1
      degree += 1
      if (lengthS / stepS < degree + 1) stepS = denserStep(lengthS, stepS, degree)
    } else {
      lengthS = shorter
      degree = policy.degree
      raised = 0
      stepS = stepFor(lengthS, stepS, degree)
    }
  }
  writeChunkFiles(opts, target.id, built.files)
  const { chunks, decoded } = built
  const demo = chunkError(decoded, (await calibrationData(opts, target.command)).tests, production.firstS, production.stepS)
  const bytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0)
  const header = policy.header
  const recent = header.notes.some((note) => /recently discovered/i.test(note))
  bodies.push({
    id: target.id,
    label: target.label,
    naifId: target.naifId,
    designation: target.designation,
    aliases: target.aliases,
    role: target.role,
    horizons: { command: target.command, center: ORIGIN, ephemeris: header.targetSource, headerNotes: header.notes },
    fit: {
      segmentSeconds: lengthS,
      calibratedSegmentSeconds: policy.segmentSeconds,
      degree,
      calibratedDegree: policy.degree,
      quantumKm: targetKm * QUANTUM_PER_TARGET,
      phaseTdbS: policy.phaseS,
      sampleStepMinutes: production.stepS / 60,
      sourceRecordGridSeconds: policy.sourceGrid?.lengthS ?? null,
      periodDays: policy.periodDays,
    },
    chunks,
    accuracy: { targetM: targetKm * 1000, span, demoWindow: demo },
    provenance: {
      sourceType: 'ephemeris',
      sources: [
        `JPL Horizons API ${list.version ?? ''} (https://ssd.jpl.nasa.gov/api/horizons.api), COMMAND=${target.command} CENTER=500@5, VECTORS geometric ICRF km km/s TDB; ephemeris ${header.targetSource}; fetched ${header.generated ?? 'see cache'}`.replace(/\s+/g, ' '),
        LICENCE,
      ],
      accuracy: `Piecewise Chebyshev fit of Horizons states: worst ${span.worstM} m, typical (rms) ${span.rmsM} m at ${span.count} independent dates ${opts.from} to ${opts.to}; worst ${demo.worstM} m at ${demo.count} dates in the demo window. Horizons' own ephemeris uncertainty is not part of this figure and is not stated in its output.`,
      notes: `${recent ? 'Horizons calls this a recently discovered satellite: its orbit rests on few observations, so its true position can differ from Horizons by far more than this fit does. ' : ''}Horizons header: ${header.notes.join(' / ')}`,
    },
  })
  report.push({ id: target.id, naifId: target.naifId, ephemeris: header.targetSource, periodDays: policy.periodDays, segmentDays: lengthS / DAY_S, calibratedSegmentDays: policy.segmentSeconds / DAY_S, degree, calibratedDegree: policy.degree, sourceGridDays: policy.sourceGrid ? policy.sourceGrid.lengthS / DAY_S : null, sampleStepMinutes: production.stepS / 60, samples: production.samples.length, chunkBytes: bytes, span, demo })
  log(`  ${target.id.padEnd(14)} seg ${(lengthS / DAY_S).toFixed(4)} d deg ${String(degree).padStart(2)} step ${production.stepS / 60} min | span worst ${span.worstM} m rms ${span.rmsM} m | demo worst ${demo.worstM} m | ${bytes} B | ${((Date.now() - started) / 1000).toFixed(0)} s`)
}

const index = {
  format: 'astraeus.chebyshev-ephemeris/1',
  id: 'jupiter-moons',
  label: "Jupiter's moons (JPL Horizons, piecewise Chebyshev fits)",
  frame: 'EQJ',
  units: { position: 'km', velocity: 'km/s', time: 'TDB seconds from J2000 (2000-01-01 12:00 TDB)' },
  origin: { naifId: 5, label: 'Jupiter system barycentre', note: 'Every series is relative to the barycentre; centre-relative states subtract the centre series.' },
  centre: CENTRE_ID,
  span: { fromUtc: opts.from, toUtc: opts.to, chunk: 'one file per body per calendar year (TDB), <body>/<year>.bin' },
  source: {
    title: 'JPL Horizons On-Line Ephemeris System, API',
    url: 'https://ssd.jpl.nasa.gov/api/horizons.api',
    apiVersion: list.version,
    bodyList: `Horizons major-body list (COMMAND=MB), fetched ${list.fetchedUtc}: ${list.moons.length} moons of Jupiter (NAIF 501-5xx and provisional 555xx)`,
    moonCount: list.moons.length,
    licence: LICENCE,
    importer: 'tools/import/horizons-moons.mjs',
  },
  timeScale: { ...scale.table, source: scale.source, check: scale.check },
  bodies,
}
const parsed = parseEphemerisIndex(index)
mkdirSync(opts.out, { recursive: true })
writeFileSync(previousIndexPath, indexText(index))

// End-to-end through the provider: Jupiter-centred UT states against Horizons' own Jupiter-centred UT vectors.
const ephemeris = new ChebyshevEphemeris(parsed)
for (const body of parsed.bodies) for (const chunk of body.chunks) ephemeris.addChunk(body.id, chunk.path, new Uint8Array(readFileSync(join(opts.out, chunk.path))))
for (const entry of report) {
  if (entry.id === CENTRE_ID) continue
  const samples = await endToEndSamples(opts, String(entry.naifId), fromS, toS)
  let worst = 0
  let sumSquares = 0
  for (const sample of samples) {
    const state = ephemeris.stateOf(entry.id, sample.utcMs)
    const error = Math.hypot(...[0, 1, 2].map((axis) => state.positionKm[axis] - sample.positionKm[axis]))
    worst = Math.max(worst, error)
    sumSquares += error * error
  }
  entry.endToEnd = { worstM: Number((worst * 1000).toFixed(4)), rmsM: Number((Math.sqrt(sumSquares / samples.length) * 1000).toFixed(4)), count: samples.length }
  const body = index.bodies.find((candidate) => candidate.id === entry.id)
  body.accuracy.jupiterCentredUtc = entry.endToEnd
}
writeFileSync(previousIndexPath, indexText(index))
if (opts.report !== null) {
  mkdirSync(opts.report, { recursive: true })
  writeFileSync(join(opts.report, 'importer-report.json'), `${JSON.stringify({ span: [opts.from, opts.to], moonCount: list.moons.length, listFetched: list.fetchedUtc, requests: requestsMade(), timeScaleCheck: scale.check, bodies: report }, null, 1)}\n`)
}
log(`Done: ${bodies.length} bodies, ${requestsMade()} Horizons requests this run.`)
