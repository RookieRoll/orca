import { app } from 'electron'
import { isLocalExecutionHost } from '../../shared/execution-host'
import { getPtyIdForPaneKey } from '../ipc/pty/pane/key-state'
import { getDaemonProvider } from '../daemon/daemon-provider-state'
import { initDaemonPtyProvider } from '../daemon/daemon-provider-init'
import { restartLocalTerminalsAfterElevation } from '../windows/windows-administrator-restart'
import { resolveTerminalSpawnAdmissionMode } from '../daemon/terminal-spawn-gate'
import {
  isAgentStatusHooksEnabled
} from '../agent-hooks/managed-agent-hook-controls'
import { agentHookServer } from '../agent-hooks/server'
import { createLocalTmuxManagedPtyResolver } from '../agent-hooks/local-tmux-managed-pty'
import {
  indexPersistedPaneKeyPtyIds,
  resolveAgentWorkspaceExecutionHostId,
  retireRestoredStatusesWithDeadTerminals
} from '../agent-hooks/restored-status-dead-terminal-sweep'
import { startFirstWindowStartupServices } from './first-window-startup-services'
import { logStartupMilestone } from './startup-diagnostics'
import type { WindowsDesktopStartupServices } from './windows-desktop-shell-path-startup'
import type { RuntimeWorktreeLifecycleEvent } from '../runtime/orca-runtime'
import { mainProcessState as state } from './main-process-state'

export function emitPluginWorktreeLifecycle(event: RuntimeWorktreeLifecycleEvent): void {
  state.pluginService?.emitEvent(
    event.kind === 'created' ? 'worktree.created' : 'worktree.removed',
    event.kind === 'created'
      ? { worktreeId: event.worktreeId, path: event.path, branch: event.branch }
      : { worktreeId: event.worktreeId, path: event.path }
  )
}

export function handleCodexHomePtySpawned(args: {
  id: string
  codexHomePath: string | null
  reattached?: boolean
  launchEnv?: NodeJS.ProcessEnv
  startedAt?: Date
  startedSequence?: number
}): void {
  const fullScanRequired =
    state.codexRuntimeHome?.beginHostSystemDefaultSessionMigrationLaunch(args.codexHomePath, {
      reattached: args.reattached,
      launchEnv: args.launchEnv
    }) ?? null
  if (fullScanRequired !== null) {
    state.codexSessionMigration?.beginLaunch(
      args.id,
      args.reattached === true || fullScanRequired,
      args.startedAt,
      args.startedSequence
    )
  }
}

export function handlePtyExit(id: string, exitSequence: number): void {
  state.codexSessionMigration?.finishLaunch(id, exitSequence)
}

/** Runs once provider and hook hydration settle, so targeted PTY liveness can answer. */
async function sweepRestoredStatusesAgainstLocalPtys(): Promise<void> {
  const store = state.store
  const provider = getDaemonProvider()
  if (!store || !provider) {
    return
  }
  const persistedPtyIdByPaneKey = indexPersistedPaneKeyPtyIds(
    store.getWorkspaceSession().terminalLayoutsByTabId ?? {}
  )
  await retireRestoredStatusesWithDeadTerminals({
    server: agentHookServer,
    probePtyLiveness: (ptyId) => provider.probePtyLiveness(ptyId),
    isLocalExecutionHost: (worktreeId) =>
      isLocalExecutionHost(
        resolveAgentWorkspaceExecutionHostId(worktreeId, {
          getRepo: (repoId) => store.getRepo(repoId),
          getWorktreeMeta: (resolvedWorktreeId) => store.getWorktreeMeta(resolvedWorktreeId),
          getFolderWorkspace: (folderWorkspaceId) => store.getFolderWorkspace(folderWorkspaceId),
          getProjectGroups: () => store.getProjectGroups()
        })
      ),
    getBoundPtyIdForPaneKey: getPtyIdForPaneKey,
    getPersistedPtyIdForPaneKey: (paneKey) => persistedPtyIdByPaneKey.get(paneKey)
  })
  state.runtime?.agentTransitions.seedRestoredRows()
  await state.runtime?.sidebarFacts?.reconcileSortStampTiers(provider)
}

export function startTerminalRuntimeStartupServices(): WindowsDesktopStartupServices {
  agentHookServer.setTmuxManagedPtyResolver(
    createLocalTmuxManagedPtyResolver({
      getPtyId: getPtyIdForPaneKey,
      listProcesses: async () => (await getDaemonProvider()?.listProcesses()) ?? []
    })
  )
  logStartupMilestone('first-window-startup-services-start')
  const startupServices = startFirstWindowStartupServices({
    // Why: both desktop and headless serve must adopt the same persistent provider before creating terminals or a renderer.
    startDaemonPtyProvider: async (signal) => {
      logStartupMilestone('startup-service-start', { service: 'daemon-pty-provider' })
      // Why: only GUI-spawned macOS daemons watch for login-session death; a headless
      // serve daemon must survive its spawning session ending (SSH disconnect).
      await initDaemonPtyProvider(signal, {
        macosLoginSessionWatch: process.platform === 'darwin' && !state.isServeMode,
        // Why both: desktop and `orca serve` share one restore budget per machine (D1 Q1).
        spawnAdmission: resolveTerminalSpawnAdmissionMode()
      })
      await restartLocalTerminalsAfterElevation(signal)
      logStartupMilestone('startup-service-done', { service: 'daemon-pty-provider' })
    },
    // Why: PTY spawn env reads ORCA_AGENT_HOOK_* from live server state, so the renderer awaits this before restored terminals reconnect.
    startAgentHookServer: async () => {
      const settings = state.store?.getSettings()
      logStartupMilestone('startup-service-start', { service: 'agent-hook-server' })
      await agentHookServer.start({
        statusHooksEnabled: isAgentStatusHooksEnabled(settings),
        env: app.isPackaged ? 'production' : 'development',
        // Why: hooks source this endpoint file at invocation time so old PTY env reaches the current process after restart; dev namespaces it (worktrees share `orca-dev`).
        userDataPath: app.getPath('userData'),
        endpointNamespace: state.devAgentHookEndpointNamespace
      })
      logStartupMilestone('startup-service-done', { service: 'agent-hook-server' })
    },
    onDaemonError: (error) => {
      // Why: daemon failure silently falls back to non-persistent local PTYs.
      const reason = error instanceof Error ? error.message : String(error)
      console.error(
        `[daemon] STARTUP FAILED — falling back to local PTYs; terminals will not persist across quit. Reason: ${reason}`
      )
    },
    onAgentHookServerError: (error) => {
      // Why: hook callbacks are sidebar enrichment only; Orca must still boot if the loopback receiver fails.
      console.error('[agent-hooks] Failed to start local hook server:', error)
    }
  })
  void startupServices.firstWindowReady.then(() =>
    logStartupMilestone('first-window-startup-services-ready')
  )
  void startupServices.localPtyReady.then(() => {
    logStartupMilestone('local-pty-startup-ready')
    void sweepRestoredStatusesAgainstLocalPtys().catch((error) =>
      console.warn('[agent-hooks] restored-status dead-terminal sweep failed:', error)
    )
  })
  return startupServices
}

export function bindTerminalRuntimeStartupServices(
  services: Promise<WindowsDesktopStartupServices>
): void {
  state.firstWindowStartupServicesReady = services.then((value) => value.firstWindowReady)
  state.localPtyStartupReady = services.then((value) => value.localPtyReady)
  state.localPtyProviderStartupReady = services.then((value) => value.localPtyProviderReady)
}
