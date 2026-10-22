import type { PtySpawnResult } from '../../../providers/pty-provider-contract'
import { allocatePtyLifecycleSequence } from '../host-env/types'
import { ensureWslHookRelayForReattach } from '../../../agent-hooks/wsl-hook-relay-reattach'
import type { RuntimePtySpawnState } from './spawn-state'
import { getConnectionExecutionHostId } from '../../../../shared/execution-host'

export function adoptMaterializedRuntimePtySpawn(
  ctx: RuntimePtySpawnState,
  startupAlreadyAwaited = false
): Promise<PtySpawnResult | null> | PtySpawnResult | null {
  const args = ctx.args
  // Why: the re-entry after the startup await must not re-mint the lifecycle sequence.
  if (!startupAlreadyAwaited) {
    ctx.codexHomeLaunchStartedAt = !args.connectionId ? new Date() : undefined
    ctx.codexHomeLaunchStartedSequence = !args.connectionId
      ? allocatePtyLifecycleSequence()
      : undefined
    ctx.preAdoptedStablePane = args.adoptedStablePane ?? null
  }
  const startupPromise = ctx.deps.getLocalPtyStartupPromise(
    getConnectionExecutionHostId(args.connectionId)
  )
  if (startupPromise && !startupAlreadyAwaited) {
    return startupPromise.then(() => adoptMaterializedRuntimePtySpawn(ctx, true))
  }
  if (!ctx.preAdoptedStablePane?.materialized) {
    return null
  }
  const handle = ctx.preAdoptedStablePane.owner.handle ?? args.preAllocatedHandle
  if (!handle) {
    throw new Error('terminal_pane_owner_unknown')
  }
  ctx.result = {
    id: ctx.preAdoptedStablePane.result.id,
    ...(ctx.preAdoptedStablePane.result.incarnationId
      ? { incarnationId: ctx.preAdoptedStablePane.result.incarnationId }
      : {}),
    ...(typeof ctx.preAdoptedStablePane.result.wslDistro === 'string'
      ? { wslDistro: ctx.preAdoptedStablePane.result.wslDistro }
      : {}),
    stablePaneOwner: {
      handle,
      tabId: ctx.preAdoptedStablePane.owner.tabId,
      leafId: ctx.preAdoptedStablePane.owner.leafId
    }
  }
  ensureWslHookRelayForReattach(
    { isReattach: true, wslDistro: ctx.preAdoptedStablePane.result.wslDistro },
    args.connectionId
  )
  if (!args.connectionId) {
    ctx.deps.options?.onCodexHomePtySpawned?.({
      id: ctx.result.id,
      codexHomePath: null,
      reattached: true,
      startedAt: ctx.codexHomeLaunchStartedAt,
      startedSequence: ctx.codexHomeLaunchStartedSequence
    })
  }
  return ctx.result
}
