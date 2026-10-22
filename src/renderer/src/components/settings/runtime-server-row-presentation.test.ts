import { describe, expect, it } from 'vitest'
import {
  formatRuntimeEndpointAddress,
  getRuntimeServerStatusIndicator,
  getRuntimeServerVersionText,
  type RuntimeServerStatusInput
} from './runtime-server-row-presentation'

function statusInput(patch: Partial<RuntimeServerStatusInput>): RuntimeServerStatusInput {
  return {
    connectionState: 'disconnected',
    accessRevoked: false,
    compatibilityBlocked: false,
    probeFailed: false,
    connecting: false,
    disconnecting: false,
    ...patch
  }
}

describe('runtime server status indicator', () => {
  it('names a revoked host as revoked, not disconnected', () => {
    expect(getRuntimeServerStatusIndicator(statusInput({ accessRevoked: true }))).toEqual({
      label: 'Access revoked',
      tone: 'destructive'
    })
  })

  it('says unreachable, not offline, when the probe got no answer', () => {
    expect(getRuntimeServerStatusIndicator(statusInput({ probeFailed: true })).label).toBe(
      'Unreachable'
    )
    expect(getRuntimeServerStatusIndicator(statusInput({})).label).toBe('Disconnected')
  })

  it('keeps connection status and protocol compatibility visible', () => {
    expect(getRuntimeServerStatusIndicator(statusInput({ connectionState: 'connected' }))).toEqual({
      label: 'Connected',
      tone: 'success'
    })
    expect(getRuntimeServerStatusIndicator(statusInput({ compatibilityBlocked: true }))).toEqual({
      label: 'Needs update',
      tone: 'destructive'
    })
  })

  it('shows a connected check state as busy', () => {
    expect(getRuntimeServerStatusIndicator(statusInput({ connectionState: 'checking' }))).toEqual({
      label: 'Checking…',
      tone: 'muted',
      busy: true
    })
  })
})

describe('managed server not running', () => {
  it('says Not running only when nothing more specific applies', () => {
    expect(getRuntimeServerStatusIndicator(statusInput({ managedNotRunning: true })).label).toBe(
      'Not running'
    )
    expect(
      getRuntimeServerStatusIndicator(statusInput({ managedNotRunning: true, connecting: true }))
        .label
    ).toBe('Connecting…')
    expect(
      getRuntimeServerStatusIndicator(statusInput({ managedNotRunning: true, accessRevoked: true }))
        .label
    ).toBe('Access revoked')
    expect(
      getRuntimeServerStatusIndicator(
        statusInput({ managedNotRunning: true, compatibilityBlocked: true })
      ).label
    ).toBe('Needs update')
  })
})

describe('runtime server metadata', () => {
  it('shows the last verified version', () => {
    expect(getRuntimeServerVersionText('1.4.229')).toBe('v1.4.229')
    expect(getRuntimeServerVersionText(null)).toBeNull()
    expect(getRuntimeServerVersionText('1.5.0')).toBe('v1.5.0')
  })

  it('shows host:port for a ws endpoint', () => {
    expect(formatRuntimeEndpointAddress('ws://100.88.1.4:6768')).toBe('100.88.1.4:6768')
    expect(formatRuntimeEndpointAddress('not a url')).toBe('not a url')
    expect(formatRuntimeEndpointAddress(undefined)).toBeNull()
  })
})
