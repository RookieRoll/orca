import { resolveLocalAccountRuntimeTarget } from '../../shared/local-account-runtime'
import type { GlobalSettings } from '../../shared/global-settings-types'
import type { ClaudeAccountSelectionTarget } from '../claude-accounts/runtime-selection'

export function getInitialClaudeRateLimitTarget(
  settings: GlobalSettings,
  platform: NodeJS.Platform = process.platform
): ClaudeAccountSelectionTarget {
  if (
    settings.localAccountRuntime === 'host' ||
    (settings.localAccountRuntime === 'wsl' && platform !== 'win32')
  ) {
    return { runtime: 'host' }
  }
  const target = resolveLocalAccountRuntimeTarget(settings, platform)
  return target.runtime === 'wsl'
    ? { runtime: 'wsl', wslDistro: target.wslDistro }
    : { runtime: 'host' }
}
