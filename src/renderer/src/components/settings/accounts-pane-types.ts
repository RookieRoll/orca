import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { SettingsHostScope } from './settings-host-scope'

export type AccountsPaneProps = {
  settings: GlobalSettings
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
