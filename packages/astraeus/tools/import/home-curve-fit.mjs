#!/usr/bin/env node
// Writes the real curve-fit numbers the home page's "how it works" picture draws (O-025 T-101) into index.html, between the fit-data markers.
//   node tools/import/home-curve-fit.mjs [--planets <planet-fits report.json>]
// Taken from the committed core data (data/ephemerides/jupiter-moons/): Io's two 1.125-day pieces and Jupiter's one 2.25-day piece that cover the
// same stretch (the series are about the Jupiter system barycentre, so the page subtracts Jupiter's to draw Io about Jupiter, as the provider does),
// the orbit-plane axes, and the measured size and accuracy figures from the index and the T-096 measurement. tests/homePage.test.ts keeps the page equal to the data.
import { readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

register("./ts-resolve-hook.mjs", import.meta.url);
const { decodeChunk } = await import("../../src/core/chebyshevSeries.ts");
const { chebyshevValue } = await import("../../src/core/chebyshev.ts");

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = join(REPO, "..", "astraeus-data-jupiter", "data", "jupiter-moons");
const index = JSON.parse(readFileSync(join(DATA, "index.json"), "utf8"));
const measure = JSON.parse(readFileSync(join(REPO, "docs", "evidence", "o025-t096-20261018T043531Z", "measure.json"), "utf8"));
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const WINDOW_UTC_MS = Date.UTC(2016, 10, 4);
const tdbOfUtc = (ms) => (ms - J2000_MS) / 1000 + 69.184; // within a millisecond-scale of the full conversion; only picks a window

function chunkOf(id) {
  const entry = index.bodies.find((body) => body.id === id);
  const chunk = entry.chunks.find((c) => c.path === `${id}/2016.bin`);
  const bytes = new Uint8Array(readFileSync(join(DATA, chunk.path)));
  return decodeChunk(bytes, { startTdbS: chunk.startTdbS, segmentSeconds: entry.fit.segmentSeconds, segmentCount: chunk.segmentCount, coefficientCount: entry.fit.degree + 1, quantumKm: entry.fit.quantumKm });
}
const ioChunk = chunkOf("io");
const jupChunk = chunkOf("jupiter");
const wanted = tdbOfUtc(WINDOW_UTC_MS);
const jupIndex = Math.floor((wanted - jupChunk.startTdbS) / jupChunk.segmentSeconds);
const startTdbS = jupChunk.startTdbS + jupIndex * jupChunk.segmentSeconds;
const ioFirst = Math.round((startTdbS - ioChunk.startTdbS) / ioChunk.segmentSeconds);
if (Math.abs(ioChunk.startTdbS + ioFirst * ioChunk.segmentSeconds - startTdbS) > 1e-6 || ioChunk.segmentSeconds * 2 !== jupChunk.segmentSeconds) throw new Error("Io and Jupiter pieces do not line up");

const n = ioChunk.coefficientCount;
const slice = (chunk, first, count) => Array.from(chunk.coefficients.subarray(first * 3 * n, (first + count) * 3 * n), (v) => Math.round(v / 1e-5) / 1e5);
const io = slice(ioChunk, ioFirst, 2);
const jup = slice(jupChunk, jupIndex, 1);

// Orbit plane: from Io about Jupiter at the window start and a quarter orbit on.
const at = (tS) => {
  const rel = [0, 1, 2].map((axis) => {
    const segment = Math.min(1, Math.floor((tS - startTdbS) / ioChunk.segmentSeconds));
    const x = 2 * ((tS - startTdbS) / ioChunk.segmentSeconds - segment) - 1;
    const xj = 2 * ((tS - startTdbS) / jupChunk.segmentSeconds) - 1;
    return chebyshevValue(io, segment * 3 * n + axis * n, n, x) - chebyshevValue(jup, axis * n, n, xj);
  });
  return rel;
};
const a = at(startTdbS + 1);
const b = at(startTdbS + 0.25 * 1.769 * 86400);
const norm = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const e1 = norm(a);
const normal = norm(cross(a, b));
const e2 = norm(cross(normal, e1));
const round = (v) => v.map((c) => Math.round(c * 1e6) / 1e6);

const ioEntry = index.bodies.find((body) => body.id === "io");
const row = measure.rawTables.find((r) => r.id === "io");
const totalTable = measure.rawTables.reduce((sum, r) => sum + r.float64Bytes, 0);
const totalFits = measure.sizes.totalRaw - measure.sizes.index.raw;
const args = process.argv.slice(2);
const planets = args.includes("--planets") ? JSON.parse(readFileSync(args[args.indexOf("--planets") + 1], "utf8")) : undefined;
const data = {
  source: "data/ephemerides/jupiter-moons/ (JPL Horizons, fitted in O-025 T-096); NASA/JPL-Caltech SSD",
  startTdbS, pieceSeconds: ioChunk.segmentSeconds, jupiterPieceSeconds: jupChunk.segmentSeconds, coefficients: n,
  io, jupiter: jup, plane: { e1: round(e1), e2: round(e2) },
  tableStepMinutes: row.stepMinutes, ioPeriodDays: ioEntry.fit.periodDays,
  figures: {
    ioTableBytes: row.float64Bytes, ioFitBytes: row.fittedBytes, ioWorstM: ioEntry.accuracy.span.worstM,
    setTableBytes: totalTable, setFitBytes: totalFits, bodies: index.bodies.length, span: [index.span.fromUtc, index.span.toUtc],
    worstOfAllM: Math.max(...index.bodies.map((body) => body.accuracy.span.worstM)),
    ...(planets === undefined ? {} : { planets: planets.figures }),
  },
};
const path = join(REPO, "index.html");
const html = readFileSync(path, "utf8");
const block = `<!-- fit-data:start -->\n<script type="application/json" id="fit-data">${JSON.stringify(data)}</script>\n<!-- fit-data:end -->`;
const next = html.replace(/<!-- fit-data:start -->[\s\S]*<!-- fit-data:end -->/, () => block);
if (next === html && !html.includes("fit-data:start")) throw new Error("index.html has no fit-data markers");
writeFileSync(path, next);
console.log(`fit data: ${JSON.stringify(data).length} bytes; Io ${row.fittedBytes} vs table ${row.float64Bytes} (${row.ratioFloat64}x); set ${totalFits} vs ${totalTable}`);
