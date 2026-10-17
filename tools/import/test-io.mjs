// File and process helpers for tests/bodyPackages.test.ts (the test tsconfig has no Node types).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

export const exists = (path) => existsSync(path)
export const readText = (path) => readFileSync(path, 'utf8')
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
export const runImporter = (importer, out) => { execFileSync('node', [importer, '--out', out], { stdio: 'pipe' }) }
export const scratchDir = () => `${process.env.TMPDIR ?? '/tmp'}/astraeus-body-packages-${process.pid}`
