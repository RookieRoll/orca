// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'

import React from 'react'
import type { ZcodePlanSite } from '../../../../shared/zcode-plan-sites'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const settings: { zcodePlanSite?: ZcodePlanSite } = { zcodePlanSite: 'zai' }
  return {
    getStatus: vi.fn(),
    refreshRateLimits: vi.fn(),
    updateSettings: vi.fn(),
    zcodeUsage: vi.fn<() => unknown>(() => null),
    settings
  }
})

vi.mock('@/lib/agent-catalog', () => ({
  AgentIcon: () => React.createElement('span', { 'data-testid': 'zcode-icon' })
}))

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, values?: Record<string, string>) => {
    let result = fallback
    for (const [key, value] of Object.entries(values ?? {})) {
      result = result.replace(`{{${key}}}`, value)
    }
    return result
  }
}))

vi.mock('../../store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      refreshRateLimits: mocks.refreshRateLimits,
      updateSettings: mocks.updateSettings,
      settingsSearchQuery: '',
      settings: mocks.settings,
      rateLimits: { zcode: mocks.zcodeUsage() }
    })
}))

import { ZcodePlanAccountsSection } from './ZcodePlanAccountsSection'
import { LOCAL_USAGE_CREDENTIAL_HOST } from './usage-credential-host'

function renderSection() {
  return render(
    <ZcodePlanAccountsSection
      host={LOCAL_USAGE_CREDENTIAL_HOST}
      usageSettings={{ settings: mocks.settings, update: mocks.updateSettings }}
    />
  )
}

describe('ZcodePlanAccountsSection', () => {
  beforeEach(() => {
    mocks.getStatus.mockResolvedValue({ apiKeyConfigured: false, zcodeCliConfigured: false })
    mocks.refreshRateLimits.mockResolvedValue(undefined)
    mocks.updateSettings.mockResolvedValue(undefined)
    mocks.zcodeUsage.mockReturnValue(null)
    mocks.settings.zcodePlanSite = 'zai'
    Object.defineProperty(window, 'api', {
      configurable: true,
      value: {
        zcodePlanCredentials: {
          getStatus: mocks.getStatus
        }
      }
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the unlinked state when neither an API key nor a CLI config exists', async () => {
    renderSection()

    expect(await screen.findByText('No GLM Coding Plan linked')).toBeInTheDocument()
    expect(screen.queryByText('Using the ZCode CLI sign-in')).not.toBeInTheDocument()
  })

  it('shows the CLI sign-in status when only the ZCode CLI config exists', async () => {
    mocks.getStatus.mockResolvedValue({ apiKeyConfigured: false, zcodeCliConfigured: true })

    renderSection()

    expect(await screen.findByText('Using the ZCode CLI sign-in')).toBeInTheDocument()
  })

  it('labels the saved state with the selected site', async () => {
    mocks.getStatus.mockResolvedValue({ apiKeyConfigured: true, zcodeCliConfigured: false })
    mocks.settings.zcodePlanSite = 'bigmodel'

    renderSection()

    expect(
      await screen.findByText('API key saved · Zhipu · BigModel (open.bigmodel.cn)')
    ).toBeInTheDocument()
  })

  it('renders the live quota windows for a linked plan', async () => {
    mocks.getStatus.mockResolvedValue({ apiKeyConfigured: true, zcodeCliConfigured: false })
    mocks.zcodeUsage.mockReturnValue({
      provider: 'zcode',
      status: 'ok',
      error: null,
      planType: 'max',
      session: { usedPercent: 42, windowMinutes: 300, resetsAt: null, resetDescription: null },
      weekly: { usedPercent: 73, windowMinutes: 10080, resetsAt: null, resetDescription: null },
      monthly: null,
      updatedAt: Date.now()
    })

    renderSection()

    expect(await screen.findByText('42%')).toBeInTheDocument()
    expect(screen.getByText('73%')).toBeInTheDocument()
    expect(screen.getByText('Plan: max')).toBeInTheDocument()
  })

  it('renders the reset countdown once, not doubled', async () => {
    mocks.getStatus.mockResolvedValue({ apiKeyConfigured: true, zcodeCliConfigured: false })
    mocks.zcodeUsage.mockReturnValue({
      provider: 'zcode',
      status: 'ok',
      error: null,
      planType: null,
      // Why 47.5 minutes: the floor survives a minute-boundary crossing between
      // mock setup and render, so the assertion stays deterministic.
      session: {
        usedPercent: 42,
        windowMinutes: 300,
        resetsAt: Date.now() + 47 * 60_000 + 30_000,
        resetDescription: null
      },
      weekly: null,
      monthly: null,
      updatedAt: Date.now()
    })

    renderSection()

    expect(await screen.findByText('42%')).toBeInTheDocument()
    expect(screen.getByText(/5 hours — resets in 47m/)).toBeInTheDocument()
    expect(screen.queryByText(/Resets in Resets/)).not.toBeInTheDocument()
  })

  it('keeps usage refresh available without a saved plan key', async () => {
    renderSection()

    fireEvent.click(await screen.findByRole('button', { name: 'Refresh usage' }))
    expect(mocks.refreshRateLimits).toHaveBeenCalledOnce()
  })
})
