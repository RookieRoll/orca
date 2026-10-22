import { describe, expect, it } from 'vitest'
import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'
import {
  getFeatureWallUsageProviderConnection,
  hasFeatureWallUsageTracking
} from './feature-wall-usage-tracking'

function rateLimits(overrides: Partial<ProviderRateLimits> = {}): ProviderRateLimits {
  return {
    provider: 'codex',
    session: null,
    weekly: null,
    updatedAt: 1,
    error: null,
    status: 'ok',
    ...overrides
  }
}

describe('feature wall usage tracking state', () => {
  it('treats system-default Codex rate limit data as connected', () => {
    expect(
      getFeatureWallUsageProviderConnection({
        provider: rateLimits({
          session: {
            usedPercent: 10,
            windowMinutes: 300,
            resetsAt: null,
            resetDescription: null
          }
        })
      })
    ).toEqual({ connected: true, label: 'Connected · System default' })
  })

  it('returns not set up when there are no usage signals', () => {
    expect(
      getFeatureWallUsageProviderConnection({
        provider: null
      })
    ).toEqual({ connected: false, label: 'Tracking not set up' })
  })

  it('uses an observed provider snapshot for the connection state', () => {
    expect(
      getFeatureWallUsageProviderConnection({
        provider: rateLimits()
      })
    ).toEqual({ connected: true, label: 'Connected · System default' })
  })

  it('marks the usage step complete from system-default provider data', () => {
    expect(
      hasFeatureWallUsageTracking({
        claudeRateLimits: null,
        codexRateLimits: rateLimits()
      })
    ).toBe(true)
  })
})
