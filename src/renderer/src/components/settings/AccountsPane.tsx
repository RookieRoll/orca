import { useRef } from 'react'
import { useAppStore } from '../../store'
import { translate } from '@/i18n/i18n'
import {
  getAccountsGeminiSearchEntries,
  getAccountsCursorSearchEntries,
  getAccountsGrokSearchEntries,
  getAccountsAntigravitySearchEntries,
  getAccountsMiniMaxSearchEntries,
  getAccountsOpencodeSearchEntries,
  getAccountsPaneSearchEntries,
  getAccountsZcodePlanSearchEntries
} from './accounts-search'
import { SettingsSectionStack } from './SettingsSectionStack'
import { matchesSettingsSearch } from './settings-search'
import { GrokAccountsSection } from './GrokAccountsSection'
import { AntigravityAccountsSection } from './AntigravityAccountsSection'
import { runtimeTargetEnvironmentId } from '@/runtime/runtime-client-target'
import { CursorAccountsSection } from './CursorAccountsSection'
import { ZcodePlanAccountsSection } from './ZcodePlanAccountsSection'
import type {
  AccountsPaneProps,
  AccountsPaneSectionModel
} from './accounts-pane-types'
import {
  EMPTY_WSL_DISTROS,
  getRuntimeSentenceLabel,
  getSelectedAccountRuntime
} from './accounts-pane-runtime'
import {
  renderGeminiAccountsSection,
  renderOpenCodeAccountsSection
} from './accounts-pane-provider-setting-sections'
import { MiniMaxAccountsSection } from './MiniMaxAccountsSection'
import { useUsageHostSettings } from './use-usage-host-settings'

export { getAccountsPaneSearchEntries }

export function AccountsPane({
  settings,
  updateSettings,
  hostScope,
  wslSupportedPlatform = false,
  wslAvailable = false,
  wslDistros = EMPTY_WSL_DISTROS,
  wslCapabilitiesLoading = false,
  wslHostDistro = null
}: AccountsPaneProps): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const miniMaxRateLimits = useAppStore((s) => s.rateLimits.minimax)
  const recordFeatureInteraction = useAppStore((s) => s.recordFeatureInteraction)
  const runtimeEnvironments = useAppStore((s) => s.runtimeEnvironments)
  const recordedOpenCodeSettingEditsRef = useRef<Set<'workspaceId'>>(new Set())
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
  const localAccountRuntimeSentenceLabel = getRuntimeSentenceLabel(localAccountRuntime)
  const recordOpenCodeSettingEdit = (field: 'workspaceId'): void => {
    if (recordedOpenCodeSettingEditsRef.current.has(field)) {
      return
    }
    recordedOpenCodeSettingEditsRef.current.add(field)
    recordFeatureInteraction('usage-tracking')
  }
  // Why: MiniMax/GLM keys are read by the selected host's own usage poller, so they live there too.
  const usageCredentialHost = { owner: accountOwner, label: remoteServerLabel }
  const usageHostSettings = useUsageHostSettings(
    accountOwner,
    remoteServerLabel,
    settings,
    updateSettings
  )

  const model: AccountsPaneSectionModel = {
    settings,
    accountOwner,
    updateSettings,
    searchQuery,
    recordFeatureInteraction,
    wslSupportedPlatform,
    wslAvailable,
    wslDistros,
    wslCapabilitiesLoading,
    localAccountRuntime,
    localAccountRuntimeSentenceLabel,
    isRemoteAccountScope,
    remoteServerName,
    accountRuntime,
    accountRuntimeSentenceLabel,
    recordOpenCodeSettingEdit
  }
  const visibleSections = [
    matchesSettingsSearch(searchQuery, getAccountsGeminiSearchEntries())
      ? renderGeminiAccountsSection(model)
      : null,
    matchesSettingsSearch(searchQuery, getAccountsAntigravitySearchEntries()) ? (
      <AntigravityAccountsSection
        key={`antigravity:${accountOwnerKey}:${accountRuntime.runtime}:${accountRuntime.wslDistro ?? ''}`}
        owner={accountOwner}
        target={{ runtime: accountRuntime.runtime, wslDistro: accountRuntime.wslDistro }}
        label={accountRuntimeSentenceLabel}
      />
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsOpencodeSearchEntries())
      ? renderOpenCodeAccountsSection(model)
      : null,
    matchesSettingsSearch(searchQuery, getAccountsMiniMaxSearchEntries()) ? (
      <MiniMaxAccountsSection
        key={`minimax:${accountOwnerKey}`}
        host={usageCredentialHost}
        usageSettings={usageHostSettings}
        miniMaxRateLimits={isRemoteAccountScope ? null : miniMaxRateLimits}
        recordFeatureInteraction={recordFeatureInteraction}
      />
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsGrokSearchEntries()) ? (
      <GrokAccountsSection key="grok" />
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsCursorSearchEntries()) ? (
      <CursorAccountsSection key="cursor" />
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsZcodePlanSearchEntries()) ? (
      <ZcodePlanAccountsSection
        key={`zcode:${accountOwnerKey}`}
        host={usageCredentialHost}
        usageSettings={usageHostSettings}
      />
    ) : null
  ]

  return (
    <div className="space-y-8">
      <SettingsSectionStack sections={visibleSections} spacing="group" />
    </div>
  )
}
