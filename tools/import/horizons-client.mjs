// JPL Horizons API client for the moon importer (O-025 T-096): one request at a time with a pause between requests,
// every raw response kept gzipped in a git-ignored cache so a rerun never asks twice, and parsing of the VECTORS table.
//
// Times are TDB (or UT for the end-to-end checks) calendar labels built from whole milliseconds; row times are taken from
// the requested grid, never from the printed Julian date (9 decimals, about 40 microseconds: a metre at Metis' speed).

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

export const HORIZONS_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api'
/** Horizons refuses a table longer than 90,024 lines; stay under it. */
export const MAX_ROWS = 85_000
const PAUSE_MS = 1_000
const J2000_NOON_UNIX_MS = 946_728_000_000

let lastRequestAt = 0
let requestCount = 0
export const requestsMade = () => requestCount

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Calendar label (YYYY-MM-DD HH:MM:SS.fff) of a TDB-seconds-from-J2000 instant, read on a uniform clock. */
export function labelOfSeconds(seconds) {
  const ms = Math.round(J2000_NOON_UNIX_MS + seconds * 1000)
  return new Date(ms).toISOString().replace('T', ' ').replace('Z', '')
}

/** TDB seconds from J2000 of a calendar date read on a uniform clock (the inverse of labelOfSeconds). */
export function secondsOfDate(isoDate) {
  const ms = Date.parse(isoDate.length === 10 ? `${isoDate}T00:00:00Z` : isoDate)
  if (!Number.isFinite(ms)) throw new Error(`not a date: ${isoDate}`)
  return (ms - J2000_NOON_UNIX_MS) / 1000
}

function cachePath(cacheDir, params) {
  const key = createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 24)
  const tag = String(params.COMMAND ?? 'x').replace(/[^A-Za-z0-9]/g, '')
  return join(cacheDir, `${tag}-${key}.txt.gz`)
}

/** The raw text of one Horizons response, from the cache when present. */
export async function horizonsText(params, { cacheDir, offline = false }) {
  mkdirSync(cacheDir, { recursive: true })
  const path = cachePath(cacheDir, params)
  if (existsSync(path)) return gunzipSync(readFileSync(path)).toString('utf8')
  if (offline) throw new Error(`not cached and --offline: ${JSON.stringify(params)}`)
  const query = new URLSearchParams({ format: 'text', ...params })
  for (let attempt = 1; ; attempt += 1) {
    const wait = lastRequestAt + PAUSE_MS - Date.now()
    if (wait > 0) await sleep(wait)
    lastRequestAt = Date.now()
    requestCount += 1
    try {
      const response = await fetch(`${HORIZONS_URL}?${query}`, { headers: { 'accept-encoding': 'gzip' } })
      const text = await response.text()
      if (response.status >= 500 || response.status === 429) throw new Error(`HTTP ${response.status}`)
      if (!text.startsWith('API VERSION')) throw new Error(`unexpected response: ${text.slice(0, 200)}`)
      writeFileSync(path, gzipSync(text))
      return text
    } catch (error) {
      if (attempt >= 4) throw error
      process.stderr.write(`  Horizons request failed (${error.message}); retrying in ${attempt * 10} s\n`)
      await sleep(attempt * 10_000)
    }
  }
}

/** The common VECTORS parameters: geometric ICRF states in km and km/s, CSV. */
export function vectorParams({ command, center, start, stop, step, timeType = 'TDB', table = '2', deltaT = false }) {
  return {
    COMMAND: `'${command}'`,
    CENTER: `'${center}'`,
    EPHEM_TYPE: 'VECTORS',
    VEC_TABLE: table,
    VEC_CORR: 'NONE',
    OUT_UNITS: 'KM-S',
    REF_SYSTEM: 'ICRF',
    REF_PLANE: 'FRAME',
    TIME_TYPE: timeType,
    CSV_FORMAT: 'YES',
    ...(deltaT ? { VEC_DELTA_T: 'YES' } : {}),
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: `'${step}'`,
  }
}

/** Header facts of a VECTORS response: ephemeris sources, the API version line and the body's own note block. */
export function headerOf(text) {
  const target = text.match(/Target body name:\s*(.+?)\s*\{source:\s*([^}]+)\}/)
  const center = text.match(/Center body name:\s*(.+?)\s*\{source:\s*([^}]+)\}/)
  const version = text.match(/API VERSION:\s*(\S+)/)
  const generated = text.match(/Ephemeris \/ API_USER\s+(.+?)\s+Pasadena/)
  const notes = []
  const lines = text.split('\n')
  const revised = lines.findIndex((line) => line.includes('Revised:'))
  if (revised >= 0) {
    for (let i = revised; i < lines.length && !lines[i].startsWith('*****'); i += 1) {
      const line = lines[i].trim()
      if (line.length > 0) notes.push(line.replace(/\s{2,}/g, '  '))
    }
  }
  return {
    target: target?.[1] ?? null,
    targetSource: target?.[2]?.trim() ?? null,
    centerSource: center?.[2]?.trim() ?? null,
    apiVersion: version?.[1] ?? null,
    generated: generated?.[1] ?? null,
    notes,
  }
}

/** Rows of a VECTORS CSV table: [jd, x, y, z, vx, vy, vz] (or [jd, deltaT, x, y, z] with deltaT, position only). */
export function rowsOf(text) {
  const start = text.indexOf('$$SOE')
  const end = text.indexOf('$$EOE')
  if (start < 0 || end < 0) {
    const reason = text.split('\n').filter((line) => /error|no ephemeris|cannot|exceeds|prior to|after/i.test(line)).slice(0, 4).join(' | ')
    throw new Error(`Horizons returned no table: ${reason || text.slice(0, 300)}`)
  }
  return text
    .slice(start + 5, end)
    .trim()
    .split('\n')
    .map((line) => line.split(',').map((cell) => cell.trim()).filter((cell, index) => index !== 1 && cell.length > 0).map(Number))
}

/**
 * Samples on an exact grid: `count` rows from `startS` every `stepS` seconds. Checks the response has exactly those rows
 * (printed Julian dates within 10 ms of the grid) and returns them with grid times.
 */
export function gridSamples(text, startS, stepS, count) {
  const rows = rowsOf(text)
  if (rows.length !== count) throw new Error(`expected ${count} rows, Horizons returned ${rows.length}`)
  return rows.map((row, index) => {
    const tdbS = startS + index * stepS
    const jd = 2451545.0 + tdbS / 86400
    if (Math.abs(row[0] - jd) * 86400 > 0.01) throw new Error(`row ${index} is at JD ${row[0]}, grid says ${jd}`)
    if (row.length < 7 || row.slice(1, 7).some((value) => !Number.isFinite(value))) throw new Error(`row ${index} is not a finite state`)
    return { tdbS, positionKm: [row[1], row[2], row[3]], velocityKmS: [row[4], row[5], row[6]] }
  })
}
