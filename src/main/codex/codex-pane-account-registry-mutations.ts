import type { CodexPtyHomeRegistryFile } from './codex-pane-account-registry-types'

const MAX_TRACKED_PANES = 2000
const RETRY_DELAYS_MS = [100, 1_000, 5_000, 30_000] as const

type MutationStoreDependencies = {
  read: () => CodexPtyHomeRegistryFile | null
  write: (registry: CodexPtyHomeRegistryFile) => boolean
}

export class CodexPtyHomeRegistryMutations {
  private readonly pending = new Map<string, string | null>()
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryAttempt = 0
  private needsPersistence = false

  constructor(private readonly dependencies: MutationStoreDependencies) {}

  record(ptyId: string, homePath: string | null): void {
    this.pending.delete(ptyId)
    this.pending.set(ptyId, homePath)
    if (this.pending.size > MAX_TRACKED_PANES) {
      const oldestPtyId = this.pending.keys().next().value
      if (typeof oldestPtyId === 'string') {
        this.pending.delete(oldestPtyId)
      }
    }
    this.flush()
  }

  flush(): void {
    if (this.pending.size === 0 && !this.needsPersistence) {
      this.clearRetryState()
      return
    }
    const registry = this.dependencies.read()
    if (!registry) {
      this.scheduleRetry()
      return
    }
    let changed = false
    for (const [ptyId, homePath] of this.pending) {
      changed = applyMutation(registry, ptyId, homePath) || changed
    }
    trimRegistry(registry)
    if ((changed || this.needsPersistence) && !this.dependencies.write(registry)) {
      this.needsPersistence = true
      this.scheduleRetry()
      return
    }
    this.needsPersistence = false
    this.pending.clear()
    this.clearRetryState()
  }

  getPendingRegistry(): CodexPtyHomeRegistryFile | null {
    if (this.pending.size === 0) return null
    const registry: CodexPtyHomeRegistryFile = { version: 3, homes: {} }
    for (const [ptyId, homePath] of this.pending) {
      applyMutation(registry, ptyId, homePath)
    }
    return registry
  }

  persistReconciliation(registry: CodexPtyHomeRegistryFile, changed: boolean): void {
    if (!changed) return
    if (!this.dependencies.write(registry)) {
      this.needsPersistence = true
      this.scheduleRetry()
      return
    }
    this.needsPersistence = false
    this.pending.clear()
    this.clearRetryState()
  }

  reset(): void {
    this.needsPersistence = false
    this.pending.clear()
    this.clearRetryState()
  }

  private scheduleRetry(): void {
    if (this.retryTimer || this.retryAttempt >= RETRY_DELAYS_MS.length) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.flush()
    }, RETRY_DELAYS_MS[this.retryAttempt])
    this.retryAttempt += 1
    this.retryTimer.unref?.()
  }

  private clearRetryState(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    this.retryAttempt = 0
  }
}

function applyMutation(
  registry: CodexPtyHomeRegistryFile,
  ptyId: string,
  homePath: string | null
): boolean {
  if (!homePath) {
    if (!(ptyId in registry.homes)) return false
    delete registry.homes[ptyId]
    return true
  }
  if (registry.homes[ptyId] === homePath) return false
  registry.homes[ptyId] = homePath
  return true
}

function trimRegistry(registry: CodexPtyHomeRegistryFile): void {
  const trackedPtyIds = Object.keys(registry.homes)
  if (trackedPtyIds.length <= MAX_TRACKED_PANES) return
  for (const staleId of trackedPtyIds.slice(0, trackedPtyIds.length - MAX_TRACKED_PANES)) {
    delete registry.homes[staleId]
  }
}
