import { normalizeRuntimePathForComparison } from '../../shared/cross-platform-path'
import { hasCustomCodexHomeOverrideForLaunch } from '../codex/codex-real-home-path'
import { resolveCodexSessionBackfillPaths } from '../codex/codex-session-backfill'
import { hasCompletedCodexSessionBackfillMarker } from '../codex/codex-session-backfill-marker'
import { CodexRuntimeHomeWsl } from './runtime-home-service-wsl'

export abstract class CodexRuntimeHomeSessionBackfill extends CodexRuntimeHomeWsl {
  protected invalidateBackfillAfterSystemDefaultLaunch(
    launchEnv?: NodeJS.ProcessEnv
  ): boolean | null {
    if (hasCustomCodexHomeOverrideForLaunch(launchEnv)) {
      return null
    }
    if (!this.hostSystemDefaultSessionMigrationPending) {
      const paths = resolveCodexSessionBackfillPaths()
      this.pendingHostSystemDefaultSessionMigrationNeedsFullScan =
        !hasCompletedCodexSessionBackfillMarker(paths.markerPath, paths.systemSessionsRoot)
      this.pendingHostSystemDefaultSessionMigrationTarget = normalizeRuntimePathForComparison(
        paths.systemSessionsRoot
      )
      this.hostSystemDefaultSessionMigrationPending = true
    }
    return this.prepareHostSystemDefaultSessionMigrationPass()
  }
}
