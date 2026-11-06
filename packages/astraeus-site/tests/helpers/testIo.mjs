// File and process helpers for tests (the test tsconfig has no Node types): a small copy of the engine's own, so no test reaches into the engine for them (O-059 T-270).
import { existsSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

export const exists = (path) => existsSync(path)
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
export const readBytes = (path) => new Uint8Array(readFileSync(path))
export const gzipSize = (bytes) => gzipSync(bytes, { level: 9 }).byteLength
