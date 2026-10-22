import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getStatsPaneSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.stats.stats.search.cb2430ae6a', 'Work activity'),
    description: translate(
      'auto.components.stats.stats.search.26bb901fcd',
      'Agent activity, work time, and pull requests created in Orca.'
    ),
    keywords: [
      translate('auto.components.stats.stats.search.372debfac0', 'stats'),
      translate('auto.components.stats.stats.search.0bba8ca244', 'statistics'),
      translate('auto.components.stats.stats.search.ce8533f02e', 'agents'),
      translate('auto.components.stats.stats.search.ef8bbf7739', 'prs'),
      translate('auto.components.stats.stats.search.5acbe1fdf2', 'time'),
      translate('auto.components.stats.stats.search.8efeae0b22', 'work activity')
    ]
  }
])
