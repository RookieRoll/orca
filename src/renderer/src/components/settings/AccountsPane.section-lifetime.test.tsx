// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import { AccountsPane } from './AccountsPane'
import { LOCAL_SETTINGS_HOST_SCOPE } from './settings-host-scope'

const fake = vi.hoisted(() => ({
  query: '',
  cursorStatus: vi.fn(async () => ({
    signedIn: false,
    email: null,
    displayName: null,
    credentialSource: null,
    planType: null,
    tokenFresh: false,
    error: null
  })),
  cursorRefresh: vi.fn(async () => {}),
  cursorUsage: { updatedAt: 0 },
  status: vi.fn(async () => ({
    signedIn: false,
    email: null,
    teamId: null,
    tokenFresh: false,
    error: null
  })),
  refresh: vi.fn(async () => {}),
  write: vi.fn(),
  grokUsage: { updatedAt: 0 }
}))
vi.mock('@/i18n/i18n', () => ({
  i18n: { language: 'en' },
  translate: (_key: string, fallback: string, values?: Record<string, string | number>) =>
    Object.entries(values ?? {}).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
      fallback
    )
}))
vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      settingsSearchQuery: fake.query,
      rateLimits: {
        codex: null,
        codexTarget: { runtime: 'host', wslDistro: null },
        minimax: null,
        cursor: fake.cursorUsage,
        grok: fake.grokUsage
      },
      runtimeEnvironments: [],
      refreshRateLimits: fake.cursorRefresh,
      refreshGrokRateLimits: fake.refresh,
      recordFeatureInteraction: fake.write,
      fetchSettings: fake.write
    })
}))
beforeEach(() => {
  vi.clearAllMocks()
  fake.query = ''
  fake.grokUsage = { updatedAt: 0 }
  fake.cursorUsage = { updatedAt: 0 }
  Object.assign(window, {
    api: {
      minimaxCredentials: {
        getStatus: vi.fn(async () => ({ cookieConfigured: false, apiKeyConfigured: false }))
      },
      zcodePlanCredentials: {
        getStatus: vi.fn(async () => ({
          apiKeyConfigured: false,
          zcodeCliConfigured: false,
          apiKeyProtection: null
        }))
      },
      cursorAccounts: { getStatus: fake.cursorStatus },
      grokAccounts: { getStatus: fake.status }
    }
  })
})
afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

it.each([false, true])(
  'retains Grok status reads with Windows account support %s',
  async (wslSupportedPlatform) => {
    const props = {
      settings: getDefaultSettings('/synthetic'),
      updateSettings: fake.write,
      hostScope: LOCAL_SETTINGS_HOST_SCOPE,
      wslSupportedPlatform
    }
    const view = render(<AccountsPane {...props} />)
    await act(async () => {})
    // The invariant is identity, not a magic number: editing the query keeps the section mounted.
    const mountedHeading = screen.getByText('Grok (xAI)', { exact: true })
    const statusReadsAfterMount = fake.status.mock.calls.length
    for (const query of ['g', 'gr', 'gro', 'grok', '', 'g', 'gr', 'gro', 'grok']) {
      fake.query = query
      await act(async () => view.rerender(<AccountsPane {...props} />))
      expect(screen.getByText('Grok (xAI)', { exact: true })).toBe(mountedHeading)
    }
    expect(fake.status.mock.calls.length).toBe(statusReadsAfterMount)
  }
)
it('preserves explicit Grok refresh and real hide/reopen status reads', async () => {
  fake.query = 'grok'
  const props = {
    settings: getDefaultSettings('/synthetic'),
    updateSettings: fake.write,
    hostScope: LOCAL_SETTINGS_HOST_SCOPE
  }
  const view = render(<AccountsPane {...props} />)
  await act(async () => {})
  fireEvent.click(screen.getByRole('button', { name: 'Refresh usage' }))
  await act(async () => {})
  expect(fake.refresh).toHaveBeenCalledTimes(1)
  expect(fake.status).toHaveBeenCalledTimes(2)
  fake.query = 'codex'
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(screen.queryByText('Grok (xAI)', { exact: true })).toBeNull()
  fake.query = 'grok'
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.status).toHaveBeenCalledTimes(3)
  expect(fake.write).not.toHaveBeenCalled()
})

it('keeps usage-driven Grok status refreshes while the section stays mounted', async () => {
  fake.query = 'grok'
  const props = {
    settings: getDefaultSettings('/synthetic'),
    updateSettings: fake.write,
    hostScope: LOCAL_SETTINGS_HOST_SCOPE
  }
  const view = render(<AccountsPane {...props} />)
  await act(async () => {})
  fake.grokUsage = { updatedAt: 10 }
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.status).toHaveBeenCalledTimes(2)
  fake.query = 'gro'
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.status).toHaveBeenCalledTimes(2)
  fake.grokUsage = { updatedAt: 11 }
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.status).toHaveBeenCalledTimes(3)
})

it.each([false, true])(
  'retains Cursor status reads with Windows account support %s',
  async (wslSupportedPlatform) => {
    const props = {
      settings: getDefaultSettings('/synthetic'),
      updateSettings: fake.write,
      hostScope: LOCAL_SETTINGS_HOST_SCOPE,
      wslSupportedPlatform
    }
    const view = render(<AccountsPane {...props} />)
    await act(async () => {})
    const mountedHeading = screen.getByText('Cursor', { exact: true })
    const statusReadsAfterMount = fake.cursorStatus.mock.calls.length
    for (const query of ['c', 'cu', 'cur', 'curs', 'curso', 'cursor', '', 'c', 'cu', 'cursor']) {
      fake.query = query
      await act(async () => view.rerender(<AccountsPane {...props} />))
      expect(screen.getByText('Cursor', { exact: true })).toBe(mountedHeading)
    }
    expect(fake.cursorStatus.mock.calls.length).toBe(statusReadsAfterMount)
    expect(fake.write).not.toHaveBeenCalled()
  }
)

it('keeps Cursor refresh driven by usage updates and genuine reopen', async () => {
  fake.query = 'cursor'
  const props = {
    settings: getDefaultSettings('/synthetic'),
    updateSettings: fake.write,
    hostScope: LOCAL_SETTINGS_HOST_SCOPE
  }
  const view = render(<AccountsPane {...props} />)
  await act(async () => {})
  fireEvent.click(screen.getByRole('button', { name: 'Refresh usage' }))
  await act(async () => {})
  expect(fake.cursorRefresh).toHaveBeenCalledTimes(1)
  expect(fake.cursorStatus).toHaveBeenCalledTimes(1)
  fake.cursorUsage = { updatedAt: 1 }
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.cursorStatus).toHaveBeenCalledTimes(2)
  fake.query = 'codex'
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(screen.queryByText('Cursor', { exact: true })).toBeNull()
  fake.query = 'cursor'
  await act(async () => view.rerender(<AccountsPane {...props} />))
  expect(fake.cursorStatus).toHaveBeenCalledTimes(3)
})
