import { getSystemCodexHomePath } from '../codex/codex-home-paths'
import { resolveHostCodexSessionSourceHome } from '../codex/codex-session-source-home'
import { normalizeRuntimePathForComparison } from '../../shared/cross-platform-path'
import type { CodexAccountSelectionTarget } from './runtime-selection'
import {
  hasCustomCodexHomeOverrideForLaunch,
  resolveExplicitCustomCodexHomeForLaunch
} from '../codex/codex-real-home-path'
import { markCodexSessionBackfillMarkerPending } from '../codex/codex-session-backfill-marker'
import { getCodexSessionBackfillDate } from '../codex/codex-session-backfill-scan-dates'
import { resolveCodexSessionBackfillPaths } from '../codex/codex-session-backfill'
import type { CodexSessionBackfillDate } from '../codex/codex-session-backfill-types'
import { CodexRuntimeHomeRouting } from './runtime-home-service-home-routing'

export abstract class CodexRuntimeHomeLaunch extends CodexRuntimeHomeRouting {
  prepareForCodexLaunch(
    target?: CodexAccountSelectionTarget,
    launchEnv?: NodeJS.ProcessEnv
  ): string | null {
    if (target?.runtime === 'wsl') {
      const wslTarget = this.resolveWslDefaultTarget(target)
      const homePath = this.getWslCodexHomePathForSelection(wslTarget)
      return homePath
    }
    const explicitCustomHome = resolveExplicitCustomCodexHomeForLaunch(launchEnv)
    if (explicitCustomHome) {
      return explicitCustomHome
    }
    if (!this.isHostSystemDefaultRealHomeSelected(launchEnv)) {
      return null
    }
    return null
  }

  resolveHostCodexHomePathForLaunchReadOnly(launchEnv?: NodeJS.ProcessEnv): string | null {
    return resolveExplicitCustomCodexHomeForLaunch(launchEnv)
  }

  prepareForCodexLaunchAsync(
    target?: CodexAccountSelectionTarget,
    launchEnv?: NodeJS.ProcessEnv
  ): Promise<string | null> {
    return Promise.resolve(this.prepareForCodexLaunch(target, launchEnv))
  }

  beginHostSystemDefaultSessionMigrationLaunch(
    codexHomePath: string | null,
    options: { reattached?: boolean; launchEnv?: NodeJS.ProcessEnv } = {}
  ): boolean | null {
    if (
      !this.isHostSystemDefaultSessionMigrationEligible(options.launchEnv) ||
      (codexHomePath !== null &&
        normalizeRuntimePathForComparison(codexHomePath) !==
          normalizeRuntimePathForComparison(getSystemCodexHomePath()))
    ) {
      return null
    }
    return this.invalidateBackfillAfterSystemDefaultLaunch(
      options.reattached && !codexHomePath ? undefined : options.launchEnv
    )
  }

  isHostSystemDefaultSessionMigrationEligible(launchEnv?: NodeJS.ProcessEnv): boolean {
    const customHome = resolveExplicitCustomCodexHomeForLaunch(launchEnv)
    return customHome === null && !hasCustomCodexHomeOverrideForLaunch(launchEnv)
  }

  prepareHostSystemDefaultSessionMigrationPass(
    scanDates: readonly CodexSessionBackfillDate[] = []
  ): boolean {
    const paths = resolveCodexSessionBackfillPaths(
      resolveHostCodexSessionSourceHome(this.store.getSettings())
    )
    const target = normalizeRuntimePathForComparison(paths.systemSessionsRoot)
    if (
      this.hostSystemDefaultSessionMigrationPending &&
      this.pendingHostSystemDefaultSessionMigrationTarget !== target
    ) {
      this.pendingHostSystemDefaultSessionMigrationNeedsFullScan = true
      this.pendingHostSystemDefaultSessionMigrationTarget = target
    }
    const markerOwesFullScan = markCodexSessionBackfillMarkerPending(
      paths.markerPath,
      paths.systemSessionsRoot,
      scanDates.length > 0 ? scanDates : [getCodexSessionBackfillDate()]
    )
    this.pendingHostSystemDefaultSessionMigrationNeedsFullScan ||= markerOwesFullScan
    return this.pendingHostSystemDefaultSessionMigrationNeedsFullScan
  }

  finishHostSystemDefaultSessionMigrationPass(): void {
    this.hostSystemDefaultSessionMigrationPending = false
    this.pendingHostSystemDefaultSessionMigrationNeedsFullScan = false
    this.pendingHostSystemDefaultSessionMigrationTarget = null
  }

}
