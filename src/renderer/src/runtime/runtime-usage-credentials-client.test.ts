import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  callMiniMaxCredentials,
  callZcodePlanCredentials,
  UsageCredentialsHostOutdatedError
} from './runtime-usage-credentials-client'
import { callRuntimeRpc, runtimeEnvironmentSupportsCapability } from './runtime-rpc-client'
import { RuntimeRpcCallError } from './runtime-rpc-result'

vi.mock('./runtime-rpc-client', () => ({
  callRuntimeRpc: vi.fn(),
  runtimeEnvironmentSupportsCapability: vi.fn()
}))

const local = {
  minimaxCredentials: { getStatus: vi.fn() },
  zcodePlanCredentials: { getStatus: vi.fn() }
}
const host = { kind: 'environment' as const, environmentId: 'server-a' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(runtimeEnvironmentSupportsCapability).mockResolvedValue(true)
  vi.mocked(callRuntimeRpc).mockResolvedValue({ apiKeyConfigured: true })
  vi.stubGlobal('window', { api: local })
})

describe('usage credential status routing', () => {
  it('reads this computer’s status through local IPC', async () => {
    await callMiniMaxCredentials({ kind: 'local' })
    await callZcodePlanCredentials({ kind: 'local' })

    expect(local.minimaxCredentials.getStatus).toHaveBeenCalledOnce()
    expect(local.zcodePlanCredentials.getStatus).toHaveBeenCalledOnce()
    expect(callRuntimeRpc).not.toHaveBeenCalled()
  })

  it('reads MiniMax status from the selected host', async () => {
    await callMiniMaxCredentials(host)

    expect(callRuntimeRpc).toHaveBeenCalledWith(
      host,
      'accounts.minimaxCredentialsStatus',
      undefined,
      { timeoutMs: 20_000 }
    )
  })

  it('reads Zcode status from the selected host', async () => {
    await callZcodePlanCredentials(host)

    expect(callRuntimeRpc).toHaveBeenCalledWith(
      host,
      'accounts.zcodePlanCredentialsStatus',
      undefined,
      { timeoutMs: 20_000 }
    )
  })

  it('does not fall back to local status when the host lacks the status capability', async () => {
    vi.mocked(runtimeEnvironmentSupportsCapability).mockResolvedValue(false)

    await expect(callMiniMaxCredentials(host)).rejects.toBeInstanceOf(
      UsageCredentialsHostOutdatedError
    )
    expect(callRuntimeRpc).not.toHaveBeenCalled()
    expect(local.minimaxCredentials.getStatus).not.toHaveBeenCalled()
  })

  it('treats a method_not_found response as an unsupported status API', async () => {
    vi.mocked(callRuntimeRpc).mockRejectedValue(
      new RuntimeRpcCallError({
        id: 'a',
        ok: false,
        error: { code: 'method_not_found', message: 'Unknown method' },
        _meta: { runtimeId: 'server-a' }
      })
    )

    await expect(callZcodePlanCredentials(host)).rejects.toBeInstanceOf(
      UsageCredentialsHostOutdatedError
    )
  })

  it('passes an unreachable host’s error through so callers show it as unverifiable', async () => {
    vi.mocked(runtimeEnvironmentSupportsCapability).mockRejectedValue(new Error('timed out'))

    await expect(callMiniMaxCredentials(host)).rejects.toThrow('timed out')
  })
})
