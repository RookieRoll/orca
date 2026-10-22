import type { PersistedUIState } from '../../../../../shared/persisted-ui-state-types'
import type { StatusBarItem } from '../../../../../shared/ui-chrome-types'
import { migrateStatusBarItems } from './ui-slice-hydration-sanitizers'

export function hydrateStatusBarItems(ui: PersistedUIState): StatusBarItem[] {
  let items = migrateStatusBarItems(ui.statusBarItems)
  if (!ui._portsStatusBarDefaultAdded && !items.includes('ports')) {
    items = [...items, 'ports']
  }
  if (typeof window !== 'undefined' && !ui._portsStatusBarDefaultAdded) {
    window.api.ui
      .set({ statusBarItems: items, _portsStatusBarDefaultAdded: true })
      .catch(console.error)
  }
  return items
}
