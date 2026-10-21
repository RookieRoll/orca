const { existsSync, readFileSync, statSync } = require('node:fs')
const { dirname, join } = require('node:path')

function failure(message) {
  return new Error(`[verify-packaged-serve-payload] ${message}`)
}

// Relative to out/; mirrors ORCAD_LOCAL_SERVE_SELECTION_ENTRY, which a test pins.
const SERVE_SELECTION_ENTRY = 'main/orcad/orcad-local-serve-selection-entry.js'

/** The file Node loads for a relative require, or null when none is unpacked. */
function resolveRequiredFile(path) {
  const candidates = [path, `${path}.js`, `${path}.json`, join(path, 'index.js')]
  return (
    candidates.find((candidate) => statSync(candidate, { throwIfNoEntry: false })?.isFile()) ?? null
  )
}

/** Relative requires reachable from `entry`, so a packed chunk fails here and not at serve time. */
function missingRelativeRequires(entry) {
  const missing = new Set()
  const visited = new Set([entry])
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()
    for (const match of readFileSync(file, 'utf8').matchAll(
      /\brequire\(["'](\.{1,2}\/[^"']+)["']\)/g
    )) {
      const required = join(dirname(file), match[1])
      const resolved = resolveRequiredFile(required)
      if (!resolved) {
        missing.add(required)
      } else if (!visited.has(resolved)) {
        visited.add(resolved)
        queue.push(resolved)
      }
    }
  }
  return [...missing]
}

/**
 * Why: `orca serve` asks this entry which host to serve on, running it on the app's executable
 * as plain Node, which cannot read app.asar. A packed copy made every serve fall back (#27404).
 */
function assertPackagedServeSelectionEntry(resourcesDir) {
  const entry = join(resourcesDir, 'app.asar.unpacked', 'out', ...SERVE_SELECTION_ENTRY.split('/'))
  if (!existsSync(entry)) {
    throw failure(`missing unpacked ${entry}; orca serve runs it under ELECTRON_RUN_AS_NODE`)
  }
  const missing = missingRelativeRequires(entry)
  if (missing.length > 0) {
    throw failure(`${entry} requires files missing from the unpacked app: ${missing.join(', ')}`)
  }
  console.log('[verify-packaged-serve-payload] OK — serve-selection entry unpacked')
}

module.exports = {
  SERVE_SELECTION_ENTRY,
  assertPackagedServeSelectionEntry
}
