import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ORCAD_LOCAL_SERVE_SELECTION_ENTRY } from '../../src/shared/orcad-local-serve-selection'

const require = createRequire(import.meta.url)
const { SERVE_SELECTION_ENTRY, assertPackagedServeSelectionEntry } = require(
  './verify-packaged-serve-payload.cjs'
)
const roots = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('assertPackagedServeSelectionEntry', () => {
  function packagedEntry(files) {
    const resourcesDir = mkdtempSync(join(tmpdir(), 'verify-packaged-serve-payload-'))
    roots.push(resourcesDir)
    const outDir = join(resourcesDir, 'app.asar.unpacked', 'out')
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(outDir, path)), { recursive: true })
      writeFileSync(join(outDir, path), content)
    }
    return resourcesDir
  }

  it('looks where orca serve runs the entry from', () => {
    expect(SERVE_SELECTION_ENTRY).toBe(`main/${ORCAD_LOCAL_SERVE_SELECTION_ENTRY}.js`)
  })

  it('passes an unpacked entry whose relative requires are all unpacked', () => {
    const resourcesDir = packagedEntry({
      [SERVE_SELECTION_ENTRY]: 'require("../chunks/a.js"); require("node:fs")',
      'main/chunks/a.js': 'require("./b"); require("../persistence")',
      'main/chunks/b.js': '',
      'main/persistence/index.js': ''
    })
    expect(() => assertPackagedServeSelectionEntry(resourcesDir)).not.toThrow()
  })

  it('fails a package that left the entry inside app.asar (#27404)', () => {
    expect(() => assertPackagedServeSelectionEntry(packagedEntry({}))).toThrow(/missing unpacked/)
  })

  it('fails when a chunk the entry reaches was not unpacked', () => {
    const resourcesDir = packagedEntry({
      [SERVE_SELECTION_ENTRY]: 'require("../chunks/a.js")',
      'main/chunks/a.js': 'require("./b.js")'
    })
    expect(() => assertPackagedServeSelectionEntry(resourcesDir)).toThrow(/chunks.b\.js/)
  })
})
