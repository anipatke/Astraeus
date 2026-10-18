#!/usr/bin/env node
// Size and speed report for the fitted Jupiter moon data (O-025 T-096). Offline: reads the committed index and chunks and
// the importer's Horizons cache (it never asks Horizons).
//
//   sizes      total, per calendar year and per decade, raw and gzipped, and the century the importer could build
//              (each body's measured bytes per segment times its segments in 1950-2050)
//   raw tables the step each body would need as a plain table read by cubic Hermite interpolation (the engine's
//              SampledTrajectory) to stay within the same 1 m, measured on the importer's dense probe samples, and the
//              bytes such a table takes (six float64 per row, and as Horizons' own CSV text)
//   speed      all moons' positions for one frame (positionsKmInto), in Node, and with --browser in headless Chromium at
//              CPU throttling 1x, 4x and 6x (phone class); needs PLAYWRIGHT_CORE, or playwright-core installed
//
// Usage: node tools/import/horizons-moons-measure.mjs [--report <dir>] [--browser] [--frames 3000]

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { gridSamples, horizonsText, labelOfSeconds, secondsOfDate, vectorParams } from './horizons-client.mjs'

register('./ts-resolve-hook.mjs', import.meta.url)
const { ChebyshevEphemeris, parseEphemerisIndex } = await import('../../src/core/chebyshevEphemeris.ts')

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')
const DATA = join(REPO, 'data', 'ephemerides', 'jupiter-moons')
const CACHE = join(HERE, '.horizons-cache')
const DAY_S = 86_400
const TARGET_KM = 0.001
const DEMO = ['2016-11-04T00:00:00Z', '2017-11-04T00:00:00Z']

const args = process.argv.slice(2)
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback)
const reportDir = option('--report', null)
const frames = Number(option('--frames', '3000'))
const log = (message) => process.stdout.write(`${message}\n`)

const indexJson = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'))
const index = parseEphemerisIndex(indexJson)
const policies = JSON.parse(readFileSync(join(HERE, 'horizons-moons-fit.json'), 'utf8'))
const bytesOf = (path) => readFileSync(join(DATA, path))

// ---------- sizes ----------

function sizes() {
  const perYear = {}
  let raw = 0
  let gzip = 0
  const perBody = []
  for (const body of indexJson.bodies) {
    let bodyRaw = 0
    let bodyGzip = 0
    let segments = 0
    for (const chunk of body.chunks) {
      const bytes = bytesOf(chunk.path)
      const zipped = gzipSync(bytes, { level: 9 }).byteLength
      const year = chunk.path.split('/')[1].slice(0, 4)
      perYear[year] ??= { raw: 0, gzip: 0 }
      perYear[year].raw += bytes.byteLength
      perYear[year].gzip += zipped
      bodyRaw += bytes.byteLength
      bodyGzip += zipped
      segments += chunk.segmentCount
    }
    raw += bodyRaw
    gzip += bodyGzip
    const centurySegments = Math.ceil((100 * 365.25 * DAY_S) / body.fit.segmentSeconds)
    perBody.push({ id: body.id, raw: bodyRaw, gzip: bodyGzip, segments, bytesPerCoefficient: Number((bodyRaw / (segments * 3 * (body.fit.degree + 1))).toFixed(2)), centuryRawEstimate: Math.round((bodyRaw / segments) * centurySegments) })
  }
  const perDecade = {}
  for (const [year, size] of Object.entries(perYear)) {
    const decade = `${year.slice(0, 3)}0s`
    perDecade[decade] ??= { raw: 0, gzip: 0 }
    perDecade[decade].raw += size.raw
    perDecade[decade].gzip += size.gzip
  }
  const indexBytes = readFileSync(join(DATA, 'index.json')).byteLength
  const demoYears = ['2016', '2017']
  return {
    totalRaw: raw,
    totalGzip: gzip,
    index: { raw: indexBytes, gzip: gzipSync(readFileSync(join(DATA, 'index.json')), { level: 9 }).byteLength },
    files: perBody.reduce((sum, body) => sum + indexJson.bodies.find((b) => b.id === body.id).chunks.length, 0),
    perYear,
    perDecade,
    demoWindowChunks: demoYears.reduce((sum, year) => ({ raw: sum.raw + perYear[year].raw, gzip: sum.gzip + perYear[year].gzip }), { raw: 0, gzip: 0 }),
    century1950to2050RawEstimate: perBody.reduce((sum, body) => sum + body.centuryRawEstimate, 0),
    perBody,
  }
}

// ---------- raw tables ----------

/** Cubic Hermite between two samples (as src/core/sampledTrajectory.ts). */
function hermite(a, b, t) {
  const span = b.tdbS - a.tdbS
  const u = (t - a.tdbS) / span
  const u2 = u * u
  const u3 = u2 * u
  return [0, 1, 2].map((i) => (2 * u3 - 3 * u2 + 1) * a.positionKm[i] + (u3 - 2 * u2 + u) * span * a.velocityKmS[i] + (-2 * u3 + 3 * u2) * b.positionKm[i] + (u3 - u2) * span * b.velocityKmS[i])
}

/** The largest step (a multiple of the probe step) at which Hermite interpolation of the probe samples stays within the target. */
async function rawTableStep(body) {
  const policy = policies[String(body.naifId)]
  const from = secondsOfDate('2016-10-01')
  const stepMin = policy.probeStepMinutes
  const count = Math.min(20_000, Math.floor((120 * DAY_S) / (stepMin * 60))) + 1
  const text = await horizonsText(vectorParams({ command: String(body.naifId), center: '500@5', start: labelOfSeconds(from), stop: labelOfSeconds(from + (count - 1) * stepMin * 60), step: `${stepMin}m` }), { cacheDir: CACHE, offline: true })
  const probe = gridSamples(text, from, stepMin * 60, count)
  const worstAt = (m) => {
    let worst = 0
    for (let k = 0; k + m < probe.length; k += m) {
      for (let j = 1; j < m; j += 1) {
        const p = hermite(probe[k], probe[k + m], probe[k + j].tdbS)
        worst = Math.max(worst, Math.hypot(p[0] - probe[k + j].positionKm[0], p[1] - probe[k + j].positionKm[1], p[2] - probe[k + j].positionKm[2]))
      }
    }
    return worst
  }
  let best = 1
  for (let m = 2; m <= Math.floor(probe.length / 8); m = Math.ceil(m * 1.25)) {
    if (worstAt(m) <= TARGET_KM) best = m
    else break
  }
  const csvLine = text.slice(text.indexOf('$$SOE') + 6).split('\n')[0].length + 1
  return { stepMinutes: best * stepMin, probeStepMinutes: stepMin, worstM: Number((worstAt(best) * 1000).toFixed(4)), csvBytesPerRow: csvLine, limitedByProbe: best === 1 }
}

async function rawTables(spanDays) {
  const result = []
  for (const body of indexJson.bodies) {
    const step = await rawTableStep(body)
    const rows = Math.floor((spanDays * 1440) / step.stepMinutes) + 1
    const fitted = body.chunks.reduce((sum, chunk) => sum + chunk.bytes, 0)
    result.push({ id: body.id, ...step, rows, float64Bytes: rows * 48, csvBytes: rows * step.csvBytesPerRow, fittedBytes: fitted, ratioFloat64: Number(((rows * 48) / fitted).toFixed(1)) })
  }
  return result
}

// ---------- speed ----------

function loadAll(ephemeris, years) {
  for (const body of index.bodies) {
    for (const chunk of body.chunks) {
      if (years === null || years.some((year) => chunk.path.endsWith(`/${year}.bin`))) ephemeris.addChunk(body.id, chunk.path, new Uint8Array(bytesOf(chunk.path)))
    }
  }
}

function nodeSpeed() {
  const ephemeris = new ChebyshevEphemeris(index)
  const decodeStart = performance.now()
  loadAll(ephemeris, ['2016', '2017'])
  const decodeMs = performance.now() - decodeStart
  const moons = index.bodies.filter((body) => body.id !== index.centre).map((body) => body.id)
  const out = new Float64Array(moons.length * 3)
  const start = Date.parse(DEMO[0])
  const stepMs = 3_600_000
  for (let i = 0; i < 500; i += 1) ephemeris.positionsKmInto(start + i * stepMs, moons, out)
  const times = []
  for (let i = 0; i < frames; i += 1) {
    const t0 = performance.now()
    ephemeris.positionsKmInto(start + (i % 8000) * stepMs, moons, out)
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  const stateStart = performance.now()
  for (let i = 0; i < 200; i += 1) for (const id of moons) ephemeris.stateOf(id, start + i * stepMs)
  const stateMs = (performance.now() - stateStart) / 200
  return { moons: moons.length, frames, meanMs: Number((times.reduce((a, b) => a + b, 0) / frames).toFixed(4)), p50Ms: Number(times[frames >> 1].toFixed(4)), p95Ms: Number(times[Math.floor(frames * 0.95)].toFixed(4)), allStatesPerFrameMs: Number(stateMs.toFixed(4)), decodeDemoChunksMs: Number(decodeMs.toFixed(1)), node: process.version }
}

async function browserSpeed() {
  const { build } = await import('vite')
  const outDir = join(tmpdir(), `astraeus-ephemeris-probe-${process.pid}`)
  await build({ configFile: false, logLevel: 'silent', root: REPO, build: { outDir, emptyOutDir: true, minify: true, lib: { entry: join(REPO, 'src/core/chebyshevEphemeris.ts'), formats: ['es'], fileName: 'ephemeris' } } })
  const file = readdirSync(outDir).find((name) => name.endsWith('.js'))
  let bundle = readFileSync(join(outDir, file), 'utf8')
  bundle = bundle.replace(/export\s*\{([^}]*)\};?\s*$/, (_, names) => `window.__ephemeris = {${names.split(',').map((name) => {
    const [local, exported] = name.trim().split(/\s+as\s+/)
    return `${exported ?? local}: ${local}`
  }).join(', ')}};`)
  const pw = await import(process.env.PLAYWRIGHT_CORE ?? 'playwright-core')
  const chromium = pw.chromium ?? pw.default.chromium
  const browser = await chromium.launch()
  const results = []
  try {
    const chunks = []
    for (const body of indexJson.bodies) for (const chunk of body.chunks) if (/\/(2016|2017)\.bin$/.test(chunk.path)) chunks.push({ body: body.id, path: chunk.path, base64: bytesOf(chunk.path).toString('base64') })
    for (const rate of [1, 4, 6]) {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(String(error)))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      await page.setContent('<!doctype html><title>ephemeris speed</title>')
      await page.addScriptTag({ type: 'module', content: bundle })
      await page.waitForFunction(() => window.__ephemeris !== undefined)
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate })
      const result = await page.evaluate(({ indexJson, chunks, frames, start }) => {
        const { ChebyshevEphemeris, parseEphemerisIndex } = window.__ephemeris
        const ephemeris = new ChebyshevEphemeris(parseEphemerisIndex(indexJson))
        const decodeStart = performance.now()
        for (const chunk of chunks) ephemeris.addChunk(chunk.body, chunk.path, Uint8Array.from(atob(chunk.base64), (c) => c.charCodeAt(0)))
        const decodeMs = performance.now() - decodeStart
        const moons = indexJson.bodies.filter((body) => body.id !== indexJson.centre).map((body) => body.id)
        const out = new Float64Array(moons.length * 3)
        for (let i = 0; i < 300; i += 1) ephemeris.positionsKmInto(start + i * 3_600_000, moons, out)
        // performance.now() is coarse in a page (0.1 ms), so time blocks of 20 frames.
        const blocks = []
        for (let b = 0; b < frames / 20; b += 1) {
          const t0 = performance.now()
          for (let i = 0; i < 20; i += 1) ephemeris.positionsKmInto(start + ((b * 20 + i) % 8000) * 3_600_000, moons, out)
          blocks.push((performance.now() - t0) / 20)
        }
        blocks.sort((a, b) => a - b)
        return { moons: moons.length, meanMs: blocks.reduce((a, b) => a + b, 0) / blocks.length, p50Ms: blocks[blocks.length >> 1], p95Ms: blocks[Math.floor(blocks.length * 0.95)], decodeDemoChunksMs: decodeMs, userAgent: navigator.userAgent }
      }, { indexJson, chunks, frames, start: Date.parse(DEMO[0]) })
      results.push({ cpuThrottling: rate, ...Object.fromEntries(Object.entries(result).map(([key, value]) => [key, typeof value === 'number' ? Number(value.toFixed(4)) : value])), consoleErrors: errors })
      await page.close()
    }
  } finally {
    await browser.close()
  }
  return results
}

// ---------- main ----------

const spanDays = (secondsOfDate(indexJson.span.toUtc) - secondsOfDate(indexJson.span.fromUtc)) / DAY_S
const report = { span: indexJson.span, measuredUtc: new Date().toISOString(), sizes: sizes(), rawTables: await rawTables(spanDays), node: nodeSpeed() }
log(`sizes: ${report.sizes.totalRaw} B raw, ${report.sizes.totalGzip} B gzip in ${report.sizes.files} files; demo window ${report.sizes.demoWindowChunks.raw} B; century estimate ${report.sizes.century1950to2050RawEstimate} B`)
log(`node: ${report.node.moons} moons per frame mean ${report.node.meanMs} ms p95 ${report.node.p95Ms} ms`)
if (args.includes('--browser')) {
  report.browser = await browserSpeed()
  for (const run of report.browser) log(`chromium ${run.cpuThrottling}x: mean ${run.meanMs} ms p95 ${run.p95Ms} ms, decode ${run.decodeDemoChunksMs} ms, errors ${run.consoleErrors.length}`)
}
if (reportDir !== null) {
  mkdirSync(reportDir, { recursive: true })
  writeFileSync(join(reportDir, 'measure.json'), `${JSON.stringify(report, null, 1)}\n`)
}
