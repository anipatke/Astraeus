// File and process helpers for tests (the test tsconfig has no Node types): tests/bodyPackages.test.ts, tests/jupiterMoonsEphemeris.test.ts.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

export const exists = (path) => existsSync(path)
export const readText = (path) => readFileSync(path, 'utf8')
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
export const runImporter = (importer, out) => { execFileSync('node', [importer, '--out', out], { stdio: 'pipe' }) }
export const scratchDir = () => `${process.env.TMPDIR ?? '/tmp'}/astraeus-body-packages-${process.pid}`
export const readBytes = (path) => new Uint8Array(readFileSync(path))
export const gzipSize = (bytes) => gzipSync(bytes, { level: 9 }).byteLength
