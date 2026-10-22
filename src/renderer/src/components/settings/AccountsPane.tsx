import { useAppStore } from '../../store'
import { translate } from '@/i18n/i18n'
import {
  getAccountsAntigravitySearchEntries,
  getAccountsPaneSearchEntries
} from './accounts-search'
import { SettingsSectionStack } from './SettingsSectionStack'
import { matchesSettingsSearch } from './settings-search'
import { AntigravityAccountsSection } from './AntigravityAccountsSection'
import { runtimeTargetEnvironmentId } from '@/runtime/runtime-client-target'
import type { AccountsPaneProps } from './accounts-pane-types'
import {
  EMPTY_WSL_DISTROS,
  getRuntimeSentenceLabel,
  getSelectedAccountRuntime
} from './accounts-pane-runtime'
import { ZcodeCliSetupSection } from './ZcodeCliSetupSection'

export { getAccountsPaneSearchEntries }

export function AccountsPane({
  settings,
  hostScope,
  wslSupportedPlatform = false,
  wslAvailable = false,
  wslDistros = EMPTY_WSL_DISTROS,
  wslCapabilitiesLoading = false,
  wslHostDistro = null
}: AccountsPaneProps): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const runtimeEnvironments = useAppStore((s) => s.runtimeEnvironments)
  const localAccountRuntime = getSelectedAccountRuntime(
    settings,
    wslSupportedPlatform,
    wslAvailable,
    wslDistros,
    wslCapabilitiesLoading,
    wslHostDistro
  )
  const accountOwner = hostScope.target
  const isRemoteAccountScope = accountOwner.kind === 'environment'
  const scopeEnvironmentId = runtimeTargetEnvironmentId(hostScope.target)
  const accountOwnerKey = scopeEnvironmentId ?? 'local'
  // Why: keep the real name separate from the prose fallback below; the scope
  // label must not interpolate the fallback.
  const remoteServerName = isRemoteAccountScope
    ? (runtimeEnvironments.find((environment) => environment.id === scopeEnvironmentId)?.name ??
      null)
    : null
  const remoteServerLabel = isRemoteAccountScope
    ? (remoteServerName ??
      translate('auto.components.settings.AccountsPane.remoteServerFallback', 'the remote server'))
    : null
  const accountRuntime = isRemoteAccountScope
    ? { runtime: 'host' as const, label: remoteServerLabel ?? '' }
    : localAccountRuntime
  const accountRuntimeSentenceLabel = isRemoteAccountScope
    ? accountRuntime.label
    : getRuntimeSentenceLabel(accountRuntime)
  const visibleSections = [
    matchesSettingsSearch(searchQuery, getAccountsAntigravitySearchEntries()) ? (
      <AntigravityAccountsSection
        key={`antigravity:${accountOwnerKey}:${accountRuntime.runtime}:${accountRuntime.wslDistro ?? ''}`}
        owner={accountOwner}
        target={{ runtime: accountRuntime.runtime, wslDistro: accountRuntime.wslDistro }}
        label={accountRuntimeSentenceLabel}
      />
    ) : null,
    <ZcodeCliSetupSection key="zcode-cli-setup" />
  ]

  return (
    <div className="space-y-8">
      <SettingsSectionStack sections={visibleSections} spacing="group" />
    </div>
  )
}
