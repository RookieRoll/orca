// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetWindowsTerminalCapabilitiesForTests,
  useLocalWindowsTerminalCapabilities,
  type WindowsTerminalCapabilities
} from '@/lib/windows-terminal-capabilities'

const testState = vi.hoisted(() => ({}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: typeof testState) => unknown) => selector(testState)
}))

import {
  resolveWindowsTerminalCapabilityOwnerKey,
  useWindowsTerminalCapabilityOwnerKey
} from './useWindowsTerminalCapabilityOwnerKey'

describe('Windows terminal capability owner key', () => {
  let root: Root
  let latest: WindowsTerminalCapabilities | null

  beforeEach(() => {
    latest = null
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    resetWindowsTerminalCapabilitiesForTests()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
  })

  it('preserves desktop-local and desktop-remote owner keys', () => {
    expect(
      resolveWindowsTerminalCapabilityOwnerKey({
        activeRuntimeEnvironmentId: null,
      })
    ).toBe('local')
    expect(
      resolveWindowsTerminalCapabilityOwnerKey({
        activeRuntimeEnvironmentId: 'remote-a',
      })
    ).toBe('runtime:remote-a')
  })
})
