import { normalizeRuntimePathForComparison } from '../../shared/cross-platform-path'
import { getSystemCodexHomePath } from '../codex/codex-home-paths'
import { resolveExplicitCustomCodexHomeForLaunch } from '../codex/codex-real-home-path'
import type { CodexAccountSelectionTarget } from './runtime-selection'
import type { CodexRateLimitHomeResolution } from './runtime-home-service-types'
import { CodexRuntimeHomeSessionBackfill } from './runtime-home-service-session-backfill'

export abstract class CodexRuntimeHomeRouting extends CodexRuntimeHomeSessionBackfill {
  getHostCodexHomePathsForSessionDiscovery(): string[] {
    return uniqueHomePaths([getSystemCodexHomePath(), resolveExplicitCustomCodexHomeForLaunch()])
  }

  isHostSystemDefaultRealHomeSelected(launchEnv?: NodeJS.ProcessEnv): boolean {
    return resolveExplicitCustomCodexHomeForLaunch(launchEnv) === null
  }

  prepareForRateLimitFetch(target?: CodexAccountSelectionTarget): CodexRateLimitHomeResolution {
    if (target?.runtime === 'wsl') {
      return { kind: 'ready', codexHomePath: this.getPreparedWslRateLimitHomePath(target) }
    }
    return {
      kind: 'ready',
      codexHomePath: resolveExplicitCustomCodexHomeForLaunch() ?? getSystemCodexHomePath()
    }
  }

}

function uniqueHomePaths(paths: readonly (string | null)[]): string[] {
  const seen = new Set<string>()
  return paths.filter((path): path is string => {
    if (!path) {
      return false
    }
    const key = normalizeRuntimePathForComparison(path)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
