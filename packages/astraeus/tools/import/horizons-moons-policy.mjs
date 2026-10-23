// Choosing each body's segment length and degree from its own motion (O-025 T-096), and measuring fit error.
//
// JPL's satellite kernels are themselves piecewise Chebyshev records; at a record boundary the source's higher derivatives
// jump slightly, and a fit that straddles one cannot reach metre level (Metis: 150 m floor at 0.75-day segments across the
// kernel's 0.375-day records, against 0.000 m on aligned segments). So the importer finds the source's record grid from a
// dense calibration sample (sixth differences spike at a boundary), tries segment lengths that are whole multiples of that
// grid, and keeps the cheapest (coefficients per day) whose worst error at independent test times meets the target.

import { chebyshevValue } from '../../src/core/chebyshev.ts'
import { fitSegment } from './chebyshevFit.ts'

const DAY_S = 86_400

/**
 * Steps (minutes) Horizons is asked for while calibrating; the largest at most period / 40 is used. Each divides 9 hours, so a
 * record grid that is a whole number of 9-hour blocks (all the Jovian kernels seen: 0.375, 1.125, 2.25 and 6 days) lands on samples.
 */
export const CALIBRATION_STEPS_MIN = [5, 10, 15, 20, 30, 45, 60, 90, 180]

export function calibrationStepMinutes(periodDays) {
  const limit = (periodDays * 1440) / 40
  return CALIBRATION_STEPS_MIN.filter((step) => step <= limit).at(-1) ?? CALIBRATION_STEPS_MIN[0]
}

/** Sixth-difference magnitude of the positions at each interior sample (km). */
function sixthDifferences(samples) {
  const weights = [-1, 6, -15, 20, -15, 6, -1]
  const result = []
  for (let i = 3; i < samples.length - 3; i += 1) {
    let sum = 0
    for (let axis = 0; axis < 3; axis += 1) {
      let d = 0
      for (let j = 0; j < 7; j += 1) d += weights[j] * samples[i - 3 + j].positionKm[axis]
      sum += d * d
    }
    result.push({ tdbS: samples[i].tdbS, size: Math.sqrt(sum) })
  }
  return result
}

const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1]

/**
 * The source's record grid seen in evenly spaced samples: { lengthS, phaseS } when the boundaries are regular, else null.
 * A boundary shows as a short cluster of sixth differences far above the median.
 */
export function detectGrid(samples, stepS) {
  const differences = sixthDifferences(samples)
  const typical = median(differences.map((d) => d.size))
  const spikes = differences.filter((d) => d.size > 8 * typical && d.size > 1e-9)
  const clusters = []
  for (const spike of spikes) {
    const last = clusters.at(-1)
    if (last !== undefined && spike.tdbS - last.end <= 8 * stepS) {
      last.end = spike.tdbS
      last.weight += spike.size
      last.moment += spike.size * spike.tdbS
    } else clusters.push({ start: spike.tdbS, end: spike.tdbS, weight: spike.size, moment: spike.size * spike.tdbS })
  }
  if (clusters.length < 4) return null
  // The spike pattern is symmetric about the boundary, so its size-weighted centre finds it even when weak neighbours join.
  const centres = clusters.map((cluster) => cluster.moment / cluster.weight)
  const gaps = centres.slice(1).map((centre, index) => centre - centres[index])
  // The grid is the gap length (rounded to the step) of which the most gaps are whole multiples (at least 80%; the longest
  // within 5% of the best): the source may skip grid points (Europa: gaps of 1.125 and 2.25 days on a 1.125-day grid).
  const explained = (lengthS) => gaps.filter((value) => {
    const multiple = Math.round(value / lengthS)
    return multiple >= 1 && Math.abs(value - multiple * lengthS) <= 1.5 * stepS
  }).length / gaps.length
  const candidates = [...new Set(gaps.map((value) => Math.round(value / stepS) * stepS))].filter((value) => value >= stepS).sort((a, b) => b - a)
  const scores = candidates.map((value) => explained(value))
  const bestScore = Math.max(...scores)
  if (bestScore < 0.8) return null
  const detectedS = candidates[scores.findIndex((score) => score >= bestScore - 0.05)]
  // Every source record length seen is a whole number of half hours; at a one-minute probe a gap can land a minute off (Deimos: 721 min
  // for 720), which no segment length would then align with. Snap to the half hour when the detection is within two steps of it.
  const halfHours = Math.round(detectedS / 1800) * 1800
  const lengthS = halfHours > 0 && Math.abs(halfHours - detectedS) <= 2 * stepS ? halfHours : detectedS
  const regular = explained(lengthS)
  const offsets = centres.map((centre) => {
    const r = ((centre - centres[0]) % lengthS + lengthS) % lengthS
    return r > lengthS / 2 ? r - lengthS : r
  })
  const origin = samples[0].tdbS
  const phaseS = origin + Math.round((centres[0] + median(offsets) - origin) / (stepS / 2)) * (stepS / 2)
  return { lengthS, phaseS, boundaries: clusters.length, regular }
}

/** Fits `segmentCount` segments from `startS`; samples sorted by time. Returns one coefficient block per segment. */
export function fitSeries(samples, startS, lengthS, degree, segmentCount) {
  const blocks = []
  let from = 0
  for (let k = 0; k < segmentCount; k += 1) {
    const a = startS + k * lengthS
    const b = a + lengthS
    while (from < samples.length && samples[from].tdbS < a - 1e-6) from += 1
    let to = from
    while (to < samples.length && samples[to].tdbS <= b + 1e-6) to += 1
    blocks.push(fitSegment(samples.slice(from, to), a, lengthS, degree))
  }
  return blocks
}

/** Position (km) of a fitted series at tdbS, or null outside it. */
export function evaluateBlocks(blocks, startS, lengthS, degree, tdbS) {
  const elapsed = (tdbS - startS) / lengthS
  if (elapsed < 0 || elapsed > blocks.length) return null
  const k = Math.min(blocks.length - 1, Math.floor(elapsed))
  const x = 2 * (elapsed - k) - 1
  const n = degree + 1
  return [0, 1, 2].map((axis) => chebyshevValue(blocks[k], axis * n, n, x))
}

/** Worst and root-mean-square position error (km) of a fitted series at test samples inside it. */
export function seriesError(blocks, startS, lengthS, degree, tests) {
  let worst = 0
  let worstAt = null
  let sumSquares = 0
  let count = 0
  for (const test of tests) {
    const position = evaluateBlocks(blocks, startS, lengthS, degree, test.tdbS)
    if (position === null) continue
    const error = Math.hypot(position[0] - test.positionKm[0], position[1] - test.positionKm[1], position[2] - test.positionKm[2])
    if (error > worst) {
      worst = error
      worstAt = test.tdbS
    }
    sumSquares += error * error
    count += 1
  }
  return { worstKm: worst, worstAtTdbS: worstAt, rmsKm: count === 0 ? 0 : Math.sqrt(sumSquares / count), count }
}

/** First grid boundary at or after `fromS`. */
export function firstBoundaryAtOrAfter(phaseS, lengthS, fromS) {
  return phaseS + Math.ceil((fromS - phaseS) / lengthS - 1e-9) * lengthS
}

/** Sample-step multiples m (of the calibration step) whose step divides the segment and leaves at least degree + 2 samples per segment, largest first. */
function stepMultiples(lengthS, stepS, degree) {
  const result = []
  for (let m = Math.floor(lengthS / stepS); m >= 1; m -= 1) {
    const sampleS = m * stepS
    if (Math.abs(lengthS / sampleS - Math.round(lengthS / sampleS)) < 1e-9 && lengthS / sampleS >= degree + 1) result.push(m)
  }
  return result
}

/** Fit with every m-th calibration sample (counted from the segment grid start) and measure at the test times. */
function trial(samples, tests, start, lengthS, degree, segments, sampleS) {
  const thinned = samples.filter((sample) => {
    const r = ((sample.tdbS - start) % sampleS + sampleS) % sampleS
    return r < 1e-3 || sampleS - r < 1e-3
  })
  return seriesError(fitSeries(thinned, start, lengthS, degree, segments), start, lengthS, degree, tests)
}

/**
 * The cheapest (segment length, degree) meeting `targetKm` with a factor-two margin on a calibration window, and the
 * sparsest sample step (a multiple of the calibration step) that still meets it: the fit is checked as it will be made.
 * `grid` (from detectGrid) or null; `samples` and `tests` are interleaved, never the same instants.
 */
export function choosePolicy({ samples, tests, stepS, grid, periodDays, targetKm, searchDays = Infinity, maxDegree = 40 }) {
  const windowStart = samples[0].tdbS
  const windowEnd = samples.at(-1).tdbS
  const phaseS = grid?.phaseS ?? windowStart
  const baseS = grid?.lengthS ?? DAY_S
  const factors = [1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
  const maxLengthS = Math.min(64 * DAY_S, (windowEnd - windowStart) / 4, Math.max(periodDays * DAY_S * 2, baseS))
  const lengths = factors
    .map((factor) => factor * baseS)
    .filter((length) => length <= maxLengthS && length >= stepS * 4 && Math.abs(length / stepS - Math.round(length / stepS)) < 1e-9)
  const tried = []
  let best = null
  for (const lengthS of lengths) {
    const start = firstBoundaryAtOrAfter(phaseS, lengthS, windowStart)
    const segments = Math.max(1, Math.min(Math.floor((windowEnd - start) / lengthS), Math.ceil((searchDays * DAY_S) / lengthS)))
    for (let degree = 3; degree <= maxDegree; degree += 1) {
      const multiples = stepMultiples(lengthS, stepS, degree)
      if (multiples.length === 0) break
      const cost = (3 * (degree + 1) * DAY_S) / lengthS
      if (best !== null && cost >= best.costPerDay) break
      const passes = (m) => trial(samples, tests, start, lengthS, degree, segments, m * stepS).worstKm <= targetKm / 2
      if (!passes(1)) continue
      const m = multiples.find(passes) ?? 1
      tried.push({ lengthS, degree, sampleS: m * stepS, costPerDay: cost })
      best = { lengthS, degree, phaseS, sampleStepS: m * stepS, costPerDay: cost }
      break
    }
  }
  if (best === null) throw new Error(`no segment length and degree up to ${maxDegree} reaches ${targetKm * 1000} m`)
  // Confirm on the whole calibration window, as it will be sampled.
  const start = firstBoundaryAtOrAfter(best.phaseS, best.lengthS, windowStart)
  const segments = Math.floor((windowEnd - start) / best.lengthS)
  const confirm = trial(samples, tests, start, best.lengthS, best.degree, segments, best.sampleStepS)
  return { ...best, calibrationWorstKm: confirm.worstKm, calibrationRmsKm: confirm.rmsKm, calibrationTests: confirm.count, tried }
}
