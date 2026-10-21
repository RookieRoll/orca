import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { AgentDashboardMode } from '../../../../shared/ui-chrome-types'

export function canOpenAgentDashboardPopout(): boolean {
  return true
}

export function resolveAgentDashboardMode(
  settings: Pick<GlobalSettings, 'experimentalAgentDashboardMode'> | null | undefined
): AgentDashboardMode {
  return settings?.experimentalAgentDashboardMode ?? 'in-window'
}
