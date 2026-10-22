import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeAppEnvironment } from '../../../config/scripts/vitest-host-ports-setup'
import { join } from 'node:path'
import { createSettings } from './runtime-home-settings-test-fixtures'
import {
  createStore,
  getSystemCodexHomePath,
  setupRuntimeHomeTest,
  teardownRuntimeHomeTest,
  testState
} from './runtime-home-service-test-harness'

vi.mock('electron', () => ({ app: { getPath: () => testState.userDataDir } }))
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os') // eslint-disable-line @typescript-eslint/consistent-type-imports -- vi.importActual requires inline import()
  return { ...actual, homedir: () => testState.fakeHomeDir }
})

describe('CodexRuntimeHomeService CLI home routing', () => {
  const previousCodexHome = process.env.CODEX_HOME
  const previousOrcaCodexHome = process.env.ORCA_CODEX_HOME

  beforeEach(() => {
    installFakeAppEnvironment({ getPath: () => testState.userDataDir })
    setupRuntimeHomeTest()
    delete process.env.CODEX_HOME
    delete process.env.ORCA_CODEX_HOME
  })

  afterEach(() => {
    teardownRuntimeHomeTest()
    if (previousCodexHome === undefined) delete process.env.CODEX_HOME
    else process.env.CODEX_HOME = previousCodexHome
    if (previousOrcaCodexHome === undefined) delete process.env.ORCA_CODEX_HOME
    else process.env.ORCA_CODEX_HOME = previousOrcaCodexHome
  })

  it('uses the CLI system home by default and honors an explicit CODEX_HOME', async () => {
    const store = createStore(createSettings({ realHomeRoutable: true }))
    const { CodexRuntimeHomeService } = await import('./runtime-home-service')
    const service = new CodexRuntimeHomeService(store as never)
    const customHome = join(testState.fakeHomeDir, 'custom-codex-home')

    expect(service.resolveHostCodexHomePathForLaunchReadOnly()).toBeNull()
    expect(store.updateSettings).not.toHaveBeenCalled()
    expect(service.prepareForCodexLaunch()).toBeNull()
    expect(service.getHostCodexHomePathsForSessionDiscovery()).toEqual([getSystemCodexHomePath()])
    expect(service.prepareForRateLimitFetch()).toEqual({
      kind: 'ready',
      codexHomePath: getSystemCodexHomePath()
    })

    expect(
      service.resolveHostCodexHomePathForLaunchReadOnly({ CODEX_HOME: customHome })
    ).toBe(customHome)
    expect(service.prepareForCodexLaunch(undefined, { CODEX_HOME: customHome })).toBe(customHome)
    expect(service.getHostCodexHomePathsForSessionDiscovery()).toEqual([getSystemCodexHomePath()])
    expect(service.prepareForRateLimitFetch()).toEqual({
      kind: 'ready',
      codexHomePath: getSystemCodexHomePath()
    })

    process.env.CODEX_HOME = customHome
    expect(service.getHostCodexHomePathsForSessionDiscovery()).toEqual([
      getSystemCodexHomePath(),
      customHome
    ])
    expect(service.prepareForRateLimitFetch()).toEqual({ kind: 'ready', codexHomePath: customHome })
  })

  it('maps a null launch home to the system Codex home for structured creation', async () => {
    const { CodexRuntimeHomeService } = await import('./runtime-home-service')
    const service = new CodexRuntimeHomeService(
      createStore(createSettings({ realHomeRoutable: true })) as never
    )
    const { resolveStructuredCodexAccountHomePath } =
      await import('../runtime/structured-agent-account-home')

    await expect(
      resolveStructuredCodexAccountHomePath({
        launchEnv: {},
        resolveLaunchHome: (input) =>
          service.resolveHostCodexHomePathForLaunchReadOnly(input.launchEnv)
      })
    ).resolves.toBe(getSystemCodexHomePath())
  })
})
