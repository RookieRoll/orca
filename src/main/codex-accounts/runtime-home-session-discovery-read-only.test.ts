import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeAppEnvironment } from '../../../config/scripts/vitest-host-ports-setup'
import { readdirSync } from 'node:fs'
import type * as NodeOs from 'node:os'
import { createSettings } from './runtime-home-settings-test-fixtures'
import {
  createStore,
  getSystemCodexHomePath,
  setupRuntimeHomeTest,
  teardownRuntimeHomeTest,
  testState
} from './runtime-home-service-test-harness'

vi.mock('electron', () => ({
  app: {
    getPath: () => testState.userDataDir
  }
}))
beforeEach(() => installFakeAppEnvironment({ getPath: () => testState.userDataDir }))

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof NodeOs>('node:os')
  return {
    ...actual,
    homedir: () => testState.fakeHomeDir
  }
})

describe('Codex session discovery on a transcript lookup miss', () => {
  beforeEach(() => {
    setupRuntimeHomeTest()
  })

  afterEach(() => {
    teardownRuntimeHomeTest()
  })

  it('discovers only the CLI system home without creating directories', async () => {
    const store = createStore(createSettings())
    const { CodexRuntimeHomeService } = await import('./runtime-home-service')
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the service reads only getSettings/updateSettings, which the harness store implements.
    const service = new CodexRuntimeHomeService(store as never)
    const { configureHostReadableTranscriptPathSources } =
      await import('../native-chat/host-readable-transcript-path')
    const { resolveSessionFilePath } = await import('../native-chat/session-file-resolver')
    configureHostReadableTranscriptPathSources({
      getAdditionalCodexHomePaths: () => service.getHostCodexHomePathsForSessionDiscovery()
    })
    const before = readdirSync(testState.userDataDir).sort()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      await expect(resolveSessionFilePath('codex', 'never-written-session')).resolves.toBeNull()
      await expect(resolveSessionFilePath('codex', 'never-written-session')).resolves.toBeNull()

      expect(readdirSync(testState.userDataDir).sort()).toEqual(before)
      expect(warn).not.toHaveBeenCalled()
      expect(service.getHostCodexHomePathsForSessionDiscovery()).toEqual([getSystemCodexHomePath()])
    } finally {
      warn.mockRestore()
      configureHostReadableTranscriptPathSources({})
    }
  })
})
