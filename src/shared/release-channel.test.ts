import { describe, expect, it } from 'vitest'
import { getVersionChannel } from './app-version-channel'

describe('app version channel', () => {
  it('classifies stable, prerelease, dev-channel, and invalid versions', () => {
    expect(getVersionChannel('1.4.160')).toBe('stable')
    expect(getVersionChannel('v1.4.160')).toBe('stable')
    expect(getVersionChannel('1.4.160-rc.3')).toBe('rc')
    expect(getVersionChannel('1.4.160-hourly.202607281400')).toBe('hourly')
    expect(getVersionChannel('1.4.160-daily.202607281300')).toBe('daily')
    expect(getVersionChannel('1.4.160-adhoc.20260728140533')).toBe('adhoc')
    expect(getVersionChannel('not-a-version')).toBeNull()
  })
})
