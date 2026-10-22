import { beforeEach, describe, expect, it, vi } from 'vitest'
import { watchProviderAccounts } from './runtime-provider-accounts-client'

const LOCAL = { kind: 'local' } as const
const REMOTE = { kind: 'environment', environmentId: 'env-1' } as const
const rateLimits = null

type SubscriptionCallbacks = {
  onResponse: (response: unknown) => void
  onError?: (error: { code: string; message: string }) => void
  onClose?: () => void
}

const localGet = vi.fn()
const remoteSubscribe = vi.fn()
const unsubscribe = vi.fn()
let subscriptionCallbacks: SubscriptionCallbacks | null = null

beforeEach(() => {
  vi.restoreAllMocks()
  localGet.mockReset()
  remoteSubscribe.mockReset()
  unsubscribe.mockReset()
  subscriptionCallbacks = null
  remoteSubscribe.mockImplementation(async (_args: unknown, callbacks: SubscriptionCallbacks) => {
    subscriptionCallbacks = callbacks
    return { unsubscribe, sendBinary: () => false }
  })
  vi.stubGlobal('window', {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    api: {
      rateLimits: { get: localGet },
      runtimeEnvironments: { subscribe: remoteSubscribe }
    }
  })
})

describe('watchProviderAccounts', () => {
  it('reads the local usage snapshot without loading managed account rosters', async () => {
    localGet.mockResolvedValue(rateLimits)
    const onSnapshot = vi.fn()
    const onError = vi.fn()

    watchProviderAccounts(LOCAL, { onSnapshot, onError })
    await vi.waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ rateLimits }))

    expect(localGet).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })

  it('suppresses a local read after the watcher closes', async () => {
    let resolveSnapshot: (() => void) | undefined
    localGet.mockImplementation(
      () => new Promise((resolve) => (resolveSnapshot = () => resolve(rateLimits)))
    )
    const onSnapshot = vi.fn()
    const watcher = watchProviderAccounts(LOCAL, { onSnapshot, onError: vi.fn() })

    watcher.close()
    resolveSnapshot?.()
    await Promise.resolve()

    expect(onSnapshot).not.toHaveBeenCalled()
  })

  it('subscribes to usage on the owning remote environment', async () => {
    const onSnapshot = vi.fn()
    const watcher = watchProviderAccounts(REMOTE, { onSnapshot, onError: vi.fn() })
    await vi.waitFor(() => expect(remoteSubscribe).toHaveBeenCalledOnce())

    expect(remoteSubscribe.mock.calls[0]?.[0]).toMatchObject({
      selector: 'env-1',
      method: 'accounts.subscribe'
    })
    subscriptionCallbacks?.onResponse({
      ok: true,
      result: { type: 'ready', snapshot: { rateLimits } }
    })
    expect(onSnapshot).toHaveBeenCalledWith({ rateLimits })
    watcher.close()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('reports a remote close before the first snapshot as an error', async () => {
    const onError = vi.fn()
    watchProviderAccounts(REMOTE, { onSnapshot: vi.fn(), onError })
    await vi.waitFor(() => expect(remoteSubscribe).toHaveBeenCalledOnce())
    subscriptionCallbacks?.onClose?.()

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('closed') }))
  })

  it('reports a remote close after the first snapshot separately', async () => {
    const onClosedAfterSnapshot = vi.fn()
    const watcher = watchProviderAccounts(REMOTE, {
      onSnapshot: vi.fn(),
      onError: vi.fn(),
      onClosedAfterSnapshot
    })
    await vi.waitFor(() => expect(remoteSubscribe).toHaveBeenCalledOnce())
    subscriptionCallbacks?.onResponse({
      ok: true,
      result: { type: 'ready', snapshot: { rateLimits } }
    })
    subscriptionCallbacks?.onClose?.()

    expect(onClosedAfterSnapshot).toHaveBeenCalledOnce()
    watcher.close()
  })
})
