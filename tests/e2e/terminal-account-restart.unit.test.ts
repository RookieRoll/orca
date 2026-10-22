import { PtyBindingPersistenceOperations } from '../../src/main/persistence/loading-store/pty-binding-persistence'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupPtyIpcSuite, type PtyIpcSuiteFixtures } from '../../src/main/ipc/pty-ipc-test-harness'
import { TerminalKilledError } from '../../src/main/daemon/daemon-pty-lifecycle-errors'
import { makePaneKey } from '../../src/shared/stable-pane-id'
import { registerPtyHandlers } from '../../src/main/ipc/pty/register-handlers'
import { setLocalPtyProvider } from '../../src/main/ipc/pty/provider/registry'
import { TerminalIntentionalStops } from '../../src/main/runtime/terminal-intentional-stops'

vi.mock('electron', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.electronModuleMock())
)
vi.mock('fs', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.fsModuleMock())
)
vi.mock('node-pty', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.nodePtyModuleMock())
)
vi.mock('node:child_process', async (importOriginal) =>
  (await import('../../src/main/ipc/pty-ipc-mock-registry')).childProcessModuleMock(
    await importOriginal()
  )
)
vi.mock('../../src/main/opencode/hook-service', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.openCodeHookServiceModuleMock())
)
vi.mock('../../src/main/mimo/hook-service', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.mimoHookServiceModuleMock())
)
vi.mock('../../src/main/agent-hooks/server', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.agentHookServerModuleMock())
)
vi.mock('../../src/main/pi/titlebar-extension-service', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.piTitlebarExtensionModuleMock())
)
vi.mock('../../src/main/pwsh', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.pwshModuleMock())
)
vi.mock('../../src/main/wsl', async (importOriginal) =>
  (await import('../../src/main/ipc/pty-ipc-mock-registry')).wslModuleMock(await importOriginal())
)
vi.mock('../../src/main/telemetry/client', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.telemetryClientModuleMock())
)
vi.mock('../../src/main/telemetry/classify-error', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.classifyErrorModuleMock())
)
vi.mock('../../src/main/cli/linux-terminal-orca-cli-shim', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.linuxCliShimModuleMock())
)
vi.mock('../../src/main/memory/pty-registry', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) => m.ptyRegistryModuleMock())
)
vi.mock('../../src/main/agent-hooks/migration-unsupported-pty-state', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) =>
    m.migrationUnsupportedPtyModuleMock()
  )
)
vi.mock('../../src/main/codex/codex-pane-account-registry', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) =>
    m.codexPaneAccountRegistryModuleMock()
  )
)
vi.mock('../../src/main/codex/codex-state-db-backfill-recovery', () =>
  import('../../src/main/ipc/pty-ipc-mock-registry').then((m) =>
    m.codexBackfillRecoveryModuleMock()
  )
)

const worktreeId = 'wt-1'
const cwd = '/tmp/restart'
const tabId = 'tab-1'
const leafId = '11111111-1111-4111-8111-111111111111'
const paneKey = makePaneKey(tabId, leafId)

type RestartHarness = ReturnType<typeof installRestartHarness>

function registerWithFakes(
  mainWindow: PtyIpcSuiteFixtures['mainWindow'],
  runtime: RestartHarness['runtime'],
  store: RestartHarness['store']
): void {
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: spawn and kill read only the window, runtime and store members these fakes define.
  const args = [
    mainWindow,
    runtime,
    undefined,
    undefined,
    undefined,
    store
  ] as unknown as Parameters<typeof registerPtyHandlers>
  registerPtyHandlers(...args)
}

function installRestartHarness(
  options: { shutdownFails?: boolean; shutdownGate?: Promise<void> } = {}
) {
  let oldSessionAlive = true
  const control = { shutdownFails: options.shutdownFails ?? false }
  const providerSpawn = vi.fn(async (spawnOptions: { attachOnly?: boolean }) => {
    if (!spawnOptions.attachOnly) {
      return { id: 'pty-new', incarnationId: 'inc-new' }
    }
    if (!oldSessionAlive) {
      throw new TerminalKilledError('pty-old')
    }
    return { id: 'pty-old', incarnationId: 'inc-old', isReattach: true }
  })
  const shutdown = vi.fn(async () => {
    await options.shutdownGate
    if (control.shutdownFails) {
      throw new Error('daemon unreachable')
    }
    oldSessionAlive = false
  })
  const provider = {
    spawn: providerSpawn,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    shutdown,
    sendSignal: vi.fn(),
    getCwd: vi.fn(),
    getInitialCwd: vi.fn(),
    clearBuffer: vi.fn(),
    acknowledgeDataEvent: vi.fn(),
    hasChildProcesses: vi.fn(),
    getForegroundProcess: vi.fn(),
    serialize: vi.fn(),
    revive: vi.fn(),
    onData: vi.fn(() => () => {}),
    onReplay: vi.fn(() => () => {}),
    onExit: vi.fn(() => () => {}),
    listProcesses: vi.fn(async () => []),
    attach: vi.fn(),
    getDefaultShell: vi.fn(),
    getProfiles: vi.fn()
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: the restart path calls only the provider members this fake defines.
  setLocalPtyProvider(provider as unknown as Parameters<typeof setLocalPtyProvider>[0])
  let session = {
    tabsByWorktree: { [worktreeId]: [{ id: tabId, worktreeId, ptyId: 'pty-old' }] },
    terminalLayoutsByTabId: {
      [tabId]: {
        root: { type: 'leaf' as const, leafId },
        activeLeafId: leafId,
        expandedLeafId: null,
        ptyIdsByLeafId: { [leafId]: 'pty-old' }
      }
    },
    terminalPtyIncarnationsByPaneKey: { [paneKey]: 'inc-old' }
  }
  const store = {
    getWorkspaceSession: vi.fn(() => session),
    setWorkspaceSession: vi.fn((next) => {
      session = next
    }),
    flushOrThrow: vi.fn(),
    runDurableMutation: vi.fn(async <T>(mutate: () => { value: T }) => mutate().value),
    getWorkspaceSessionHostIds: vi.fn(() => ['local']),
    getFolderWorkspace: vi.fn(() => undefined),
    getFolderWorkspaces: vi.fn(() => []),
    getProjectGroups: vi.fn(() => []),
    getRepos: vi.fn(() => [])
  }
  const state = { workspaceSession: session, workspaceSessionsByHostId: {} }
  store.getWorkspaceSession.mockImplementation((hostId?: string) => {
    // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: each fake partition has the same session shape.
    const partitions = state.workspaceSessionsByHostId as Record<string, typeof session>
    return (hostId && partitions[hostId]) || state.workspaceSession
  })
  const bindingRuntime = {
    state,
    dirtyProfileStateDomains: new Set(),
    runDurableMutation: store.runDurableMutation,
    writeTimer: null,
    pendingWrite: null,
    quitFlushStarted: false,
    writeGeneration: 0,
    lastDurableWriteGeneration: 0,
    ptyBindingGenerations: new Map<string, number>()
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: binding writes read only state, write bookkeeping, durable mutation, the per-pane binding generations and the session partitions from these fakes.
  const bindingArgs = [bindingRuntime, store] as unknown as ConstructorParameters<
    typeof PtyBindingPersistenceOperations
  >
  const bindingOperations = new PtyBindingPersistenceOperations(...bindingArgs)
  const storeWithRetirement = Object.assign(store, {
    persistPtyBinding: bindingOperations.persistPtyBinding.bind(bindingOperations),
    retirePtyBinding: bindingOperations.retirePtyBinding.bind(bindingOperations)
  })
  const runtime = {
    setPtyController: vi.fn(),
    resolveTerminalPane: vi.fn(() => {
      throw new Error('terminal_not_found')
    }),
    markPtyStopRequested: vi.fn(),
    createPreAllocatedTerminalHandle: vi.fn(() => 'term-restart'),
    preAllocateHandleForPty: vi.fn(() => 'term-restart'),
    registerPreAllocatedHandleForPty: vi.fn(),
    beginPtyRegistration: vi.fn(),
    cancelPendingPtyRegistration: vi.fn(),
    assertPtyRegistrationAllowed: vi.fn(),
    registerPty: vi.fn(),
    noteTerminalSpawnCommand: vi.fn(),
    seedHeadlessTerminal: vi.fn(),
    onPtySpawned: vi.fn(),
    onPtyExit: vi.fn(),
    onPtyData: vi.fn(),
    intentionalPtyStops: new TerminalIntentionalStops()
  }
  return { providerSpawn, shutdown, store: storeWithRetirement, runtime, control }
}

import {
  createPane,
  createManager
} from '../../src/renderer/src/components/terminal-pane/pty-connection-test-pane-fixtures'
import { buildPaneConnectionDeps } from '../../src/renderer/src/components/terminal-pane/pty-connection-test-deps'
import { createInitialStoreState } from '../../src/renderer/src/components/terminal-pane/pty-connection-test-store-fixtures'
import {
  installTerminalTestGlobals,
  restoreTerminalTestGlobals
} from '../../src/renderer/src/components/terminal-pane/pty-connection-test-environment'
import { installIpcPtyWindow } from '../../src/renderer/src/components/terminal-pane/pty-transport-test-harness'
import type { StoreState } from '../../src/renderer/src/components/terminal-pane/pty-connection-test-store-state'
import type * as React from 'react'
import type { PtyTransport } from '../../src/renderer/src/components/terminal-pane/pty-transport-types'

let rendererState: StoreState
vi.mock('@/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: StoreState) => unknown) => selector(rendererState),
    { getState: () => rendererState, subscribe: () => () => {} }
  )
}))
vi.mock('zustand/react/shallow', () => ({ useShallow: (selector: unknown) => selector }))
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void) => effect(),
  useLayoutEffect: (effect: () => void) => effect()
}))
vi.mock('@/runtime/sync-runtime-graph', () => ({ scheduleRuntimeGraphSync: vi.fn() }))
const { requestTerminalPaneRecovery } = vi.hoisted(() => ({
  requestTerminalPaneRecovery: vi.fn(async () => true)
}))
vi.mock(
  '../../src/renderer/src/components/terminal-pane/terminal-pane-recovery',
  async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    requestTerminalPaneRecovery
  })
)

describe('terminal restart through renderer connection and host spawn', () => {
  const { handlers, mainWindow } = setupPtyIpcSuite()
  afterEach(async () => {
    await restoreTerminalTestGlobals()
  })

  it.each([false, true])(
    'paired restart retains the old owner (host authority: %s)',
    async (hostAuthority) => {
      const host = installRestartHarness()
      registerWithFakes(mainWindow, host.runtime, host.store)
      rendererState = createInitialStoreState(() => rendererState)
      await installTerminalTestGlobals()
      const runtimeCall = vi.fn(
        async (args: { method: string; params?: Record<string, unknown> }) => {
          if (args.method === 'status.get') {
            return {
              id: 'status',
              ok: true,
              result: {
                runtimeProtocolVersion: 3,
                minCompatibleRuntimeClientVersion: 2,
                capabilities: hostAuthority ? ['agent-session.host-authority.v1'] : []
              },
              _meta: { runtimeId: 'fake-host' }
            }
          }
          if (args.method !== 'terminal.create' && args.method !== 'terminal.createAgentSession') {
            throw new Error(`Unexpected host method: ${args.method}`)
          }
          // Both host create routes ultimately use stable-pane adoption; keep that real here.
          await handlers.get('pty:spawn')!(null, {
            cols: 80,
            rows: 24,
            cwd,
            tabId,
            leafId,
            worktreeId,
            command: 'codex',
            launchAgent: 'codex',
            startupCommandDelivery: 'shell-ready'
          })
          return {
            id: 'create',
            ok: true,
            result: {
              terminal: { handle: 'term-old', worktreeId, title: null, surface: 'background' }
            },
            _meta: { runtimeId: 'fake-host' }
          }
        }
      )
      const subscribe = vi.fn(
        async (_args: unknown, callbacks: { onResponse: (value: unknown) => void }) => {
          queueMicrotask(() =>
            callbacks.onResponse({
              id: 'stream',
              ok: true,
              result: { type: 'ready' },
              _meta: { runtimeId: 'fake-host' }
            })
          )
          return { unsubscribe: vi.fn(), sendBinary: vi.fn() }
        }
      )
      Object.assign(window.api, { runtimeEnvironments: { call: runtimeCall, subscribe } })
      const { createRemoteRuntimePtyTransport } =
        await import('../../src/renderer/src/components/terminal-pane/remote-runtime-pty-transport')
      const { releasePaneTransportForRestart } =
        await import('../../src/renderer/src/components/terminal-pane/pane-restart-transport-handoff')
      const options = { worktreeId, tabId, leafId }
      const old = createRemoteRuntimePtyTransport('fake-host', options)
      await old.connect({ url: '', callbacks: {} })
      expect(old.getPtyId()).toBe('remote:fake-host@@term-old')
      const replacesPtyId = releasePaneTransportForRestart(old)
      expect(replacesPtyId).toBeNull()
      const replacement = createRemoteRuntimePtyTransport('fake-host', options)
      try {
        await replacement.connect({ url: '', callbacks: {} })
        expect(replacement.getPtyId()).toBe('remote:fake-host@@term-old')
        expect(host.shutdown).not.toHaveBeenCalled()
        expect(host.providerSpawn.mock.calls.every(([options]) => options.attachOnly)).toBe(true)
        expect(
          runtimeCall.mock.calls.filter(([args]) => args.method.startsWith('terminal.create'))
        ).toHaveLength(2)
      } finally {
        replacement.detach?.()
      }
    }
  )
})
