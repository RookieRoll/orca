import type { Store } from '../persistence'
import type { CodexRateLimitHomeResolution } from './runtime-home-service-types'
import type { CodexAccountSelectionTarget } from './runtime-selection'
import type { CodexSessionBackfillDate } from '../codex/codex-session-backfill-types'

export abstract class CodexRuntimeHomeState {
  protected hostSystemDefaultSessionMigrationPending = false
  protected pendingHostSystemDefaultSessionMigrationNeedsFullScan = false
  protected pendingHostSystemDefaultSessionMigrationTarget: string | null = null

  protected constructor(protected readonly store: Store) {}

  abstract prepareForCodexLaunch(target?: CodexAccountSelectionTarget, launchEnv?: NodeJS.ProcessEnv): string | null
  abstract prepareForCodexLaunchAsync(
    target?: CodexAccountSelectionTarget,
    launchEnv?: NodeJS.ProcessEnv
  ): Promise<string | null>
  abstract beginHostSystemDefaultSessionMigrationLaunch(
    codexHomePath: string | null,
    options?: { reattached?: boolean; launchEnv?: NodeJS.ProcessEnv }
  ): boolean | null
  abstract isHostSystemDefaultSessionMigrationEligible(launchEnv?: NodeJS.ProcessEnv): boolean
  abstract prepareHostSystemDefaultSessionMigrationPass(scanDates?: readonly CodexSessionBackfillDate[]): boolean
  abstract finishHostSystemDefaultSessionMigrationPass(): void

  abstract getHostCodexHomePathsForSessionDiscovery(): string[]
  abstract isHostSystemDefaultRealHomeSelected(launchEnv?: NodeJS.ProcessEnv): boolean
  abstract prepareForRateLimitFetch(target?: CodexAccountSelectionTarget): CodexRateLimitHomeResolution
}
