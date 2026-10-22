import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readServeInstallEvidence } from './serve-install-hold'

describe('readServeInstallEvidence', () => {
  let root: string
  let bundle: string
  let executable: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'orca-install-hold-'))
    bundle = join(root, 'Orca.app')
    executable = join(bundle, 'Contents', 'MacOS', 'Orca')
    await mkdir(join(bundle, 'Contents', 'MacOS'), { recursive: true })
    await writeFile(executable, '')
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('holds while the executable is missing', async () => {
    await expect(readServeInstallEvidence(join(root, 'gone'))).resolves.toEqual({
      kind: 'hold',
      reason: 'bundle-missing'
    })
    await expect(readServeInstallEvidence(executable)).resolves.toEqual({ kind: 'clear' })
  })
})
