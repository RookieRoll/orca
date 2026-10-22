import type { SettingsSearchEntry } from './settings-search'
import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'
export const getAccountsAntigravitySearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('accounts.antigravity.searchTitle', 'Antigravity Accounts'),
    description: translate(
      'accounts.antigravity.searchDescription',
      'Save and select native agy Google accounts on the execution host.'
    ),
    keywords: [
      ...translateSearchKeyword('accounts.antigravity.keyword.antigravity', 'antigravity'),
      ...translateSearchKeyword('accounts.antigravity.keyword.agy', 'agy'),
      ...translateSearchKeyword('accounts.antigravity.keyword.google', 'google'),
      ...translateSearchKeyword('accounts.antigravity.keyword.accounts', 'accounts'),
      ...translateSearchKeyword('auto.components.settings.accounts.search.a9f3d7b5c8', 'login')
    ]
  }
])

export const getAccountsPaneSearchEntries = createLocalizedCatalog((): SettingsSearchEntry[] => [
  ...getAccountsAntigravitySearchEntries()
])
