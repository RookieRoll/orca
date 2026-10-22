import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => {
  const state: {
    spawnProcess: ReturnType<typeof vi.fn>
    runProcess: ReturnType<typeof vi.fn>
    controller: AbortController
    preflight: Promise<number | null>
    markPreflightStarted?: () => void
  } = {
    spawnProcess: vi.fn(),
    runProcess: vi.fn(),
    controller: new AbortController(),
    preflight: Promise.resolve<number | null>(null)
  }
  return state
})

vi.mock('@orca/process-host', () => ({
  spawnProcess: harness.spawnProcess,
  runProcess: harness.runProcess
}))

vi.mock('./serve-supervisor-relocation', () => ({
  relocateThisServeSupervisor: async () => 'in-place'
}))

vi.mock('./serve-pid1-init-reaper', () => ({
  reexecThisServeUnderInitReaper: vi.fn()
}))

vi.mock('./serve-supervised-service', () => ({
  superviseServeService: async (options: { runOnce: (signal: AbortSignal) => Promise<number> }) =>
    options.runOnce(harness.controller.signal)
}))

vi.mock('./serve-electron-preflight', () => ({
  preflightElectronServe: () => {
    harness.markPreflightStarted?.()
    return harness.preflight
  },
  recordElectronServeStartupAbort: vi.fn(),
  refuseIfProfileServed: vi.fn()
}))

import { serveOrcaApp } from './launch'

describe('serveOrcaApp stop before spawn', () => {
  const originalEnv = {
    appExecutable: process.env.ORCA_APP_EXECUTABLE,
    serveRuntime: process.env.ORCA_SERVE_RUNTIME,
    userDataPath: process.env.ORCA_USER_DATA_PATH
  }

  beforeEach(() => {
    harness.spawnProcess.mockReset()
    harness.runProcess.mockReset()
    harness.controller = new AbortController()
    process.env.ORCA_APP_EXECUTABLE = '/opt/orca/orca'
    process.env.ORCA_SERVE_RUNTIME = 'electron'
    process.env.ORCA_USER_DATA_PATH = '/tmp/orca-stop-before-spawn'
  })

  afterEach(() => {
    if (originalEnv.appExecutable === undefined) delete process.env.ORCA_APP_EXECUTABLE
    else process.env.ORCA_APP_EXECUTABLE = originalEnv.appExecutable
    if (originalEnv.serveRuntime === undefined) delete process.env.ORCA_SERVE_RUNTIME
    else process.env.ORCA_SERVE_RUNTIME = originalEnv.serveRuntime
    if (originalEnv.userDataPath === undefined) delete process.env.ORCA_USER_DATA_PATH
    else process.env.ORCA_USER_DATA_PATH = originalEnv.userDataPath
  })

  it('does not spawn Electron when stop arrives during asynchronous preflight', async () => {
    let finishPreflight: ((value: number | null) => void) | undefined
    let markStarted: (() => void) | undefined
    const preflightStarted = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    harness.markPreflightStarted = () => markStarted?.()
    harness.preflight = new Promise<number | null>((resolve) => {
      finishPreflight = resolve
    })

    const running = serveOrcaApp({ supervise: true })
    await preflightStarted
    harness.controller.abort()
    finishPreflight?.(null)

    await expect(running).resolves.toBe(0)
    expect(harness.spawnProcess).not.toHaveBeenCalled()
  })
})
