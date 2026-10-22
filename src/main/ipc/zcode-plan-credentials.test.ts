import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerZcodePlanCredentialsHandlers } from './zcode-plan-credentials'

const mocks = vi.hoisted(() => ({
  handle: vi.fn(),
  hasKey: vi.fn(() => false),
  protection: vi.fn<() => 'sealed' | 'plaintext' | null>(() => null),
  hasCli: vi.fn(() => false)
}))
vi.mock('electron', () => ({ ipcMain: { handle: mocks.handle } }))
vi.mock('../zcode/zcode-plan-api-key-store', () => ({
  hasZcodePlanApiKey: mocks.hasKey,
  getZcodePlanApiKeyProtection: mocks.protection,
  API_KEY_ENVELOPE_PREFIX: 'zcode:',
  getZcodePlanApiKeyPath: () => 'zcode-key-path'
}))
// The files are mocked away; readability has its own coverage in the RPC test.
vi.mock('../credentials/saved-credential-readability', () => ({
  savedCredentialUnreadable: () => undefined
}))
vi.mock('../rate-limits/zcode-usage-fetcher', () => ({ hasZcodeCliPlanCredentials: mocks.hasCli }))

function handler(channel: string) {
  const registration = mocks.handle.mock.calls.find(([name]) => name === channel)
  if (!registration) {
    throw new Error('Handler missing')
  }
  return registration[1]
}

describe('GLM credential IPC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasKey.mockReturnValue(false)
    mocks.hasCli.mockReturnValue(false)
    mocks.protection.mockReturnValue(null)
    registerZcodePlanCredentialsHandlers()
  })

  it('returns only presence and protection without exposing the key', () => {
    mocks.hasKey.mockReturnValue(true)
    mocks.hasCli.mockReturnValue(true)
    mocks.protection.mockReturnValue('sealed')
    expect(handler('zcodePlanCredentials:getStatus')()).toEqual({
      apiKeyConfigured: true,
      zcodeCliConfigured: true,
      apiKeyProtection: 'sealed',
      apiKeyUnreadable: undefined
    })
  })
})
