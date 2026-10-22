import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeAppEnvironment } from '../../../config/scripts/vitest-host-ports-setup'
import { join } from 'node:path'
import { createSettings } from './runtime-home-settings-test-fixtures'
import {
  createStore,
  setupRuntimeHomeTest,
  teardownRuntimeHomeTest,
  testState
} from './runtime-home-service-test-harness'

vi.mock('electron', () => ({ app: { getPath: () => testState.userDataDir } }))
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os')
  return { ...actual, homedir: () => testState.fakeHomeDir }
})

describe('CodexRuntimeHomeService WSL CLI home routing', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')

  beforeEach(() => {
    installFakeAppEnvironment({ getPath: () => testState.userDataDir })
    setupRuntimeHomeTest()
    Object.defineProperty(process, 'platform', { configurable: true, value: 'win32' })
    vi.doMock('../wsl', () => ({
      getDefaultWslDistro: () => 'Ubuntu',
      getWslHome: () => '/home/alice'
    }))
  })

  afterEach(() => {
    teardownRuntimeHomeTest()
    if (originalPlatform) Object.defineProperty(process, 'platform', originalPlatform)
  })

  it('uses the target distro home for both launch and rate-limit lookup', async () => {
    const { CodexRuntimeHomeService } = await import('./runtime-home-service')
    const service = new CodexRuntimeHomeService(createStore(createSettings()) as never)
    const target = { runtime: 'wsl' as const, wslDistro: 'Ubuntu' }
    const expectedHome = join('/home/alice', '.codex')

    expect(service.prepareForCodexLaunch(target)).toBe(expectedHome)
    expect(service.prepareForRateLimitFetch(target)).toEqual({
      kind: 'ready',
      codexHomePath: expectedHome
    })
  })
})
