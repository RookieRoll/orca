import { useAppStore } from '../../store'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch } from './settings-search'
import { GitLabRateLimitPanel } from '../gitlab/gitlab-rate-limit-display'
import { translate } from '@/i18n/i18n'
import type { RuntimeClientTarget } from '../../../../shared/runtime-client-target'

type GitProviderApiBudgetPaneProps = {
  settingsSearchQuery?: string
  /** The host chosen at the top of Settings; budgets come from that host's CLI. */
  target: RuntimeClientTarget
}

export function GitProviderApiBudgetPane({
  settingsSearchQuery,
  target
}: GitProviderApiBudgetPaneProps): React.JSX.Element | null {
  const storeSearchQuery = useAppStore((s) => s.settingsSearchQuery)
  const searchQuery = settingsSearchQuery ?? storeSearchQuery

  const visibleSections = [
    matchesSettingsSearch(searchQuery, {
      title: translate('auto.components.settings.GitPane.0de4ae556c', 'GitLab API Budget'),
      description: translate(
        'auto.components.settings.GitPane.c4f610d057',
        'Current GitLab CLI REST rate-limit headers when available.'
      ),
      keywords: [
        translate('auto.components.settings.GitPane.8a527d48e3', 'gitlab'),
        translate('auto.components.settings.GitPane.3072428ac7', 'glab'),
        translate('auto.components.settings.GitPane.b9c011fbc2', 'rate limit'),
        translate('auto.components.settings.GitPane.cdd793134e', 'api budget')
      ]
    }) ? (
      <SearchableSetting
        key="gitlab-api-budget"
        title={translate('auto.components.settings.GitPane.0de4ae556c', 'GitLab API Budget')}
        description={translate(
          'auto.components.settings.GitPane.c4f610d057',
          'Current GitLab CLI REST rate-limit headers when available.'
        )}
        keywords={['gitlab', 'glab', 'rate limit', 'api budget']}
        className="space-y-3"
      >
        <GitLabRateLimitPanel target={target} />
      </SearchableSetting>
    ) : null
  ].filter(Boolean)

  if (visibleSections.length === 0) {
    return null
  }

  // Why: provider budgets are diagnostic, so they render after core git and AI
  // settings instead of competing with everyday branch and attribution controls.
  return <div className="space-y-4 border-t border-border/40 pt-4">{visibleSections}</div>
}
