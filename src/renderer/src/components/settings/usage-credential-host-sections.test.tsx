// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as UsageCredentialsClient from '@/runtime/runtime-usage-credentials-client'

const mocks = vi.hoisted(() => ({
  callMiniMax: vi.fn(),
  callZcode: vi.fn(),
  update: vi.fn(),
  toastError: vi.fn(),
  settingsSearchQuery: ''
}))

vi.mock('@/runtime/runtime-usage-credentials-client', async (importOriginal) => ({
  ...(await importOriginal<typeof UsageCredentialsClient>()),
  callMiniMaxCredentials: mocks.callMiniMax,
  callZcodePlanCredentials: mocks.callZcode
}))
vi.mock('@/lib/agent-catalog', () => ({ AgentIcon: () => React.createElement('span') }))
vi.mock('../status-bar/icons', () => ({ MiniMaxIcon: () => React.createElement('span') }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: mocks.toastError } }))
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
      recordFeatureInteraction: vi.fn(),
      refreshRateLimits: vi.fn(),
      settingsSearchQuery: mocks.settingsSearchQuery,
      rateLimits: { zcode: null }
    })
}))

import { UsageCredentialsHostOutdatedError } from '@/runtime/runtime-usage-credentials-client'
import { MiniMaxAccountsSection } from './MiniMaxAccountsSection'
import { ZcodePlanAccountsSection } from './ZcodePlanAccountsSection'

const owner = { kind: 'environment' as const, environmentId: 'server-a' }
const host = { owner, label: 'Build box' }
const usageSettings = {
  settings: { minimaxEndpoint: 'overseas' as const, zcodePlanSite: 'zai' as const },
  update: mocks.update
}
const miniMaxStatus = {
  configured: true,
  cookieConfigured: false,
  apiKeyConfigured: true,
  cookieProtection: null,
  apiKeyProtection: 'sealed' as const,
  sessionCookieSupported: false
}

function renderMiniMax(): void {
  render(
    <MiniMaxAccountsSection
      host={host}
      usageSettings={usageSettings}
      miniMaxRateLimits={null}
      recordFeatureInteraction={vi.fn()}
    />
  )
}

beforeEach(() => {
  mocks.callMiniMax.mockReset().mockResolvedValue(miniMaxStatus)
  mocks.callZcode.mockReset().mockResolvedValue({
    apiKeyConfigured: false,
    zcodeCliConfigured: false,
    apiKeyProtection: null
  })
})

afterEach(() => {
  mocks.settingsSearchQuery = ''
  cleanup()
  vi.clearAllMocks()
})

describe('usage credential status on the Settings host', () => {
  it('reports MiniMax credentials on their host without exposing editors', async () => {
    renderMiniMax()

    expect(await screen.findByText('Stored on Build box')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Paste your MiniMax API key')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Paste the Cookie header from DevTools')).not.toBeInTheDocument()
  })

  it('keeps an older-host warning when MiniMax status cannot be read', async () => {
    mocks.callMiniMax.mockRejectedValue(new UsageCredentialsHostOutdatedError())
    renderMiniMax()

    expect(
      await screen.findByText('Update Orca on Build box to check its usage credential status.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Credentials not set')).not.toBeInTheDocument()
    expect(mocks.callMiniMax).toHaveBeenCalledTimes(1)
  })

  it('shows an unreachable host as unknown, not as having no key', async () => {
    mocks.callMiniMax.mockRejectedValue(new Error('timed out'))
    renderMiniMax()

    expect(
      await screen.findByText(
        'Could not reach Build box, so whether a key is saved there is unknown.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Credentials not set')).not.toBeInTheDocument()
  })

  it('keeps an older-host warning and disables GLM site settings', async () => {
    mocks.callZcode.mockRejectedValue(new UsageCredentialsHostOutdatedError())
    render(<ZcodePlanAccountsSection host={host} usageSettings={usageSettings} />)

    expect(
      await screen.findByText('Update Orca on Build box to check its usage credential status.')
    ).toBeInTheDocument()
    expect(screen.queryByText('No GLM Coding Plan linked')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Refresh usage' })).not.toBeInTheDocument()
  })

  it('reports an unlinked GLM plan on its host without exposing an editor', async () => {
    render(<ZcodePlanAccountsSection host={host} usageSettings={usageSettings} />)

    expect(await screen.findByText('No GLM Coding Plan linked')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Paste your GLM Coding Plan API key')).not.toBeInTheDocument()
  })
})
