import type { SecretAtRestProtection } from '../../shared/secret-at-rest-protection'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ipcState = vi.hoisted(() => ({
  handleHandlers: new Map<string, (event: unknown, ...args: unknown[]) => unknown>()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (event: unknown, ...args: unknown[]) => unknown) => {
      ipcState.handleHandlers.set(channel, handler)
    }
  }
}))

const hasMiniMaxSessionCookieMock = vi.hoisted(() => vi.fn(() => false))
const hasMiniMaxApiKeyMock = vi.hoisted(() => vi.fn(() => false))
const getCookieProtectionMock = vi.hoisted(() =>
  vi.fn((): SecretAtRestProtection | null => 'sealed')
)
const getApiKeyProtectionMock = vi.hoisted(() =>
  vi.fn((): SecretAtRestProtection | null => 'sealed')
)

vi.mock('../minimax/minimax-cookie-store', () => ({
  getMiniMaxSessionCookieProtection: getCookieProtectionMock,
  hasMiniMaxSessionCookie: hasMiniMaxSessionCookieMock,
  COOKIE_ENVELOPE_PREFIX: 'cookie:',
  getMiniMaxCookiePath: () => 'cookie-path'
}))

vi.mock('../minimax/minimax-api-key-store', () => ({
  getMiniMaxApiKeyProtection: getApiKeyProtectionMock,
  hasMiniMaxApiKey: hasMiniMaxApiKeyMock,
  miniMaxApiKeyEnvelopeFile: () => ({ path: 'key-path', envelopePrefix: 'key:' })
}))

// The files are mocked away; readability has its own coverage in the RPC test.
vi.mock('../credentials/saved-credential-readability', () => ({
  savedCredentialUnreadable: () => undefined
}))

const httpClientState = vi.hoisted(() => ({ hasCookieJar: true }))
vi.mock('../network/http-client', () => ({
  getMainHttpClient: () => (httpClientState.hasCookieJar ? { partitionSession: () => ({}) } : {})
}))

import { registerMiniMaxCredentialsHandlers } from './minimax-credentials'

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const handler = ipcState.handleHandlers.get(channel)
  if (!handler) {
    throw new Error(`No handler registered for ${channel}`)
  }
  return (await handler({}, ...args)) as T
}

describe('registerMiniMaxCredentialsHandlers', () => {
  beforeEach(() => {
    ipcState.handleHandlers.clear()
    httpClientState.hasCookieJar = true
    hasMiniMaxSessionCookieMock.mockReset()
    hasMiniMaxSessionCookieMock.mockReturnValue(false)
    hasMiniMaxApiKeyMock.mockReset()
    hasMiniMaxApiKeyMock.mockReturnValue(false)
    getCookieProtectionMock.mockReturnValue('sealed')
    getApiKeyProtectionMock.mockReturnValue('sealed')
  })

  it('registers the read-only status channel', () => {
    registerMiniMaxCredentialsHandlers()
    expect(ipcState.handleHandlers.has('minimaxCredentials:getStatus')).toBe(true)
  })

  it('returns the configured state on getStatus from the cookie store', async () => {
    hasMiniMaxSessionCookieMock.mockReturnValue(true)
    registerMiniMaxCredentialsHandlers()
    const status = await invoke<{
      configured: boolean
      cookieConfigured: boolean
      apiKeyConfigured: boolean
    }>('minimaxCredentials:getStatus')
    expect(status).toEqual({
      configured: true,
      cookieConfigured: true,
      apiKeyConfigured: false,
      cookieProtection: 'sealed',
      // Null, not 'sealed': nothing is stored, so there is nothing to make a claim about.
      apiKeyProtection: null,
      sessionCookieSupported: true,
      cookieUnreadable: undefined,
      apiKeyUnreadable: undefined
    })
  })

  it('returns apiKeyConfigured true on getStatus when the API key store has a key', async () => {
    hasMiniMaxApiKeyMock.mockReturnValue(true)
    registerMiniMaxCredentialsHandlers()
    const status = await invoke<{
      configured: boolean
      cookieConfigured: boolean
      apiKeyConfigured: boolean
    }>('minimaxCredentials:getStatus')
    expect(status).toEqual({
      configured: true,
      cookieConfigured: false,
      apiKeyConfigured: true,
      cookieProtection: null,
      apiKeyProtection: 'sealed',
      sessionCookieSupported: true,
      cookieUnreadable: undefined,
      apiKeyUnreadable: undefined
    })
  })

  it('reports configured true when either cookie or API key is set', async () => {
    hasMiniMaxSessionCookieMock.mockReturnValue(true)
    hasMiniMaxApiKeyMock.mockReturnValue(true)
    registerMiniMaxCredentialsHandlers()
    const status = await invoke<{
      configured: boolean
      cookieConfigured: boolean
      apiKeyConfigured: boolean
    }>('minimaxCredentials:getStatus')
    expect(status.configured).toBe(true)
    expect(status.cookieConfigured).toBe(true)
    expect(status.apiKeyConfigured).toBe(true)
  })

  it('reports a plaintext key through the status so Settings can warn about it', async () => {
    hasMiniMaxApiKeyMock.mockReturnValue(true)
    getApiKeyProtectionMock.mockReturnValue('plaintext')
    registerMiniMaxCredentialsHandlers()
    const status = await invoke('minimaxCredentials:getStatus')
    expect(status).toMatchObject({ apiKeyConfigured: true, apiKeyProtection: 'plaintext' })
  })

  it('reports when status cannot verify session cookies without a browser cookie jar', async () => {
    httpClientState.hasCookieJar = false
    registerMiniMaxCredentialsHandlers()
    await expect(invoke('minimaxCredentials:getStatus')).resolves.toMatchObject({
      sessionCookieSupported: false
    })
  })
})
