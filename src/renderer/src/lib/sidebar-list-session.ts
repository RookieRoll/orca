import { useEffect } from 'react'
import { ORCA_SIDEBAR_INPUTS_IS_MAIN } from '../../../shared/sidebar-inputs-switch'
import { createBrowserUuid } from './browser-uuid'

/**
 * Switch point. Tells main the list mounted, so main's sleeping retention starts cold as the
 * window's does.
 */
export function useSidebarListSession(): void {
  useEffect(() => {
    if (!ORCA_SIDEBAR_INPUTS_IS_MAIN) {
      return
    }
    void window.api.runtime
      .call({ method: 'sidebarSession.begin', params: { sessionId: createBrowserUuid() } })
      .catch(() => {})
  }, [])
}
