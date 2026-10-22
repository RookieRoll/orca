import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { FeatureInteractionId } from '../../../../shared/feature-interaction-catalog'
import type { RuntimeClientTarget } from '../../../../shared/runtime-client-target'
import type { SettingsHostScope } from './settings-host-scope'

export type AccountsPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  hostScope: SettingsHostScope
  wslSupportedPlatform?: boolean
  wslAvailable?: boolean
  wslDistros?: string[]
  wslCapabilitiesLoading?: boolean
  /** Set when the chosen host is a WSL host: this desktop owns that distro's accounts. */
  wslHostDistro?: string | null
}

export type LocalAccountRuntime = {
  runtime: 'host' | 'wsl'
  wslDistro?: string | null
  label: string
}

export type AccountsPaneSectionModel = {
  settings: GlobalSettings
  accountOwner: RuntimeClientTarget
  updateSettings: (updates: Partial<GlobalSettings>) => void
  searchQuery: string
  recordFeatureInteraction: (featureId: FeatureInteractionId) => void
  wslSupportedPlatform: boolean
  wslAvailable: boolean
  wslDistros: string[]
  wslCapabilitiesLoading: boolean
  localAccountRuntime: LocalAccountRuntime
  localAccountRuntimeSentenceLabel: string
  isRemoteAccountScope: boolean
  remoteServerName: string | null
  accountRuntime: LocalAccountRuntime
  accountRuntimeSentenceLabel: string
  recordOpenCodeSettingEdit: (field: 'workspaceId') => void
}
