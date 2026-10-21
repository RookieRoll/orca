// Settings-search entries for the Privacy pane. Kept in its own file to
// mirror the other per-pane search modules (notifications-search.ts,
// terminal-search.ts, etc.) and keep Settings.tsx imports uniform.

import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getPrivacyPaneSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.privacy.search.privacyTitle', 'Privacy'),
    description: translate(
      'auto.components.settings.privacy.search.localDiagnosticsDescription',
      'Local diagnostics and crash report controls.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.privacy.search.10124159f1', 'privacy'),
      ...translateSearchKeyword('auto.components.settings.privacy.search.6d258d2ed6', 'diagnostics'),
      ...translateSearchKeyword(
        'auto.components.settings.privacy.search.crashReports',
        'crash reports'
      ),
      ...translateSearchKeyword(
        'auto.components.settings.privacy.search.localLogs',
        'local logs'
      )
    ]
  }
])
