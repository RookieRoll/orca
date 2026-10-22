import { useEffect, useState } from 'react'
import { useShortcutLabel } from '@/hooks/useShortcutLabel'
import { useAppStore } from '../../store'
import { selectFloatingWorkspaceHasUnread } from '../../store/selectors'
import { CLOSE_ALL_CONTEXT_MENUS_EVENT } from '@/lib/close-all-context-menus'
import { useStatusBarDensity } from './status-bar-density'

export function useStatusBarController(floatingTerminalOpen: boolean) {
  const floatingTerminalShortcut = useShortcutLabel('floatingTerminal.toggle')
  const settings = useAppStore((s) => s.settings)
  const statusBarVisible = useAppStore((s) => s.statusBarVisible)
  const statusBarItems = useAppStore((s) => s.statusBarItems)
  const recordFeatureInteraction = useAppStore((s) => s.recordFeatureInteraction)
  const toggleStatusBarItem = useAppStore((s) => s.toggleStatusBarItem)
  const hasFloatingUnread = useAppStore(selectFloatingWorkspaceHasUnread)
  const floatingTerminalEnabled = settings?.floatingTerminalEnabled === true
  const floatingTerminalTriggerLocation =
    settings?.floatingTerminalTriggerLocation ?? 'floating-button'
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPoint, setMenuPoint] = useState({ x: 0, y: 0 })
  const { density, overflowing, barRef, segmentsRef } = useStatusBarDensity()

  useEffect(() => {
    const closeMenu = (): void => setMenuOpen(false)
    window.addEventListener(CLOSE_ALL_CONTEXT_MENUS_EVENT, closeMenu)
    return () => window.removeEventListener(CLOSE_ALL_CONTEXT_MENUS_EVENT, closeMenu)
  }, [])

  if (!statusBarVisible) {
    return null
  }

  const floatingTerminalActionLabel = floatingTerminalOpen
    ? 'Minimize Floating Workspace'
    : 'Show Floating Workspace'

  return {
    barRef,
    compact: density.compact,
    floatingTerminalActionLabel,
    floatingTerminalShortcut,
    menuOpen,
    menuPoint,
    overflowing,
    recordFeatureInteraction,
    segmentsIconOnly: density.segmentsIconOnly,
    segmentsRef,
    setMenuOpen,
    setMenuPoint,
    showFloatingTerminalToggle:
      floatingTerminalEnabled && floatingTerminalTriggerLocation === 'status-bar',
    showFloatingWorkspaceAttentionDot: !floatingTerminalOpen && hasFloatingUnread,
    showPorts: statusBarItems.includes('ports'),
    showResourceUsage: statusBarItems.includes('resource-usage'),
    showSsh: statusBarItems.includes('ssh'),
    statusBarItems,
    toggleStatusBarItem
  }
}

export type StatusBarController = NonNullable<ReturnType<typeof useStatusBarController>>
