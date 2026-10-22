import { describe, expect, it, vi } from 'vitest'
import type { CodexResetCreditAttemptLedger } from '../../shared/codex-reset-credit-attempt-ledger'
import { createEmptyRateLimitState } from '../../shared/rate-limit-state-factory'
import type { RateLimitState } from '../../shared/rate-limit-types'
import { CodexResetCreditCoordinator } from './codex-reset-credit-coordinator'
import { createResetCreditLimits } from './service-reset-credit-test-fixtures'
import type { CodexRateLimitHomeResolution } from './runtime-home-service-types'

function setup(codexHomePath: string | null = null) {
  let durable: CodexResetCreditAttemptLedger = { version: 1, attempts: [] }
  const state = createEmptyRateLimitState({ codex: createResetCreditLimits() })
  const persist = async (next: CodexResetCreditAttemptLedger) => {
    durable = structuredClone(next)
  }
  const store = {
    getCodexResetCreditAttemptLedger: vi.fn(() => structuredClone(durable)),
    replaceCodexResetCreditAttemptLedgerAndFlush: vi.fn(persist)
  }
  const consume = vi.fn(
    async (_request: {
      idempotencyKey: string
      target: RateLimitState['codexTarget']
      codexHomePath: string | null
    }) => ({ outcome: 'reset' as const, state })
  )
  const rateLimits = {
    getState: vi.fn(() => state),
    consumeCodexRateLimitResetCredit: consume
  }
  const runtimeHome = {
    prepareForRateLimitFetch: vi.fn(
      (): CodexRateLimitHomeResolution => ({ kind: 'ready', codexHomePath })
    )
  }
  const createCoordinator = () =>
    new CodexResetCreditCoordinator(store as never, rateLimits as never, runtimeHome as never)
  return { state, store, consume, runtimeHome, createCoordinator, persist, codexHomePath }
}

describe('Codex reset-credit coordinator', () => {
  it('resets the system-default host target using the default CLI home', async () => {
    const fixture = setup()
    const coordinator = fixture.createCoordinator()

    await expect(coordinator.consumeCurrent()).resolves.toEqual({
      outcome: 'reset',
      state: fixture.state
    })
    const key = fixture.consume.mock.calls[0]?.[0].idempotencyKey
    expect(key).toEqual(expect.any(String))
    expect(fixture.runtimeHome.prepareForRateLimitFetch).toHaveBeenCalledWith({
      runtime: 'host',
      wslDistro: null
    })
    expect(fixture.consume).toHaveBeenCalledWith({
      idempotencyKey: key,
      target: { runtime: 'host', wslDistro: null },
      codexHomePath: fixture.codexHomePath
    })
    expect(fixture.consume).toHaveBeenCalledTimes(1)
  })

  it('retries an unknown provider result after restart with the durable idempotency key', async () => {
    const fixture = setup()
    fixture.consume.mockRejectedValueOnce(new Error('provider response lost'))
    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow(
      'provider response lost'
    )
    const firstKey = fixture.consume.mock.calls[0]?.[0].idempotencyKey

    fixture.state.codex = {
      ...fixture.state.codex!,
      updatedAt: fixture.state.codex!.updatedAt + 1,
      rateLimitResetCredits: { ...fixture.state.codex!.rateLimitResetCredits!, availableCount: 0 }
    }
    fixture.consume.mockResolvedValueOnce({ outcome: 'alreadyRedeemed', state: fixture.state })
    await expect(fixture.createCoordinator().consumeCurrent()).resolves.toEqual({
      outcome: 'alreadyRedeemed',
      state: fixture.state
    })
    expect(fixture.consume).toHaveBeenCalledTimes(2)
    expect(fixture.consume.mock.calls.map(([request]) => request.idempotencyKey)).toEqual([
      firstKey,
      firstKey
    ])
  })

  it('does not call the provider or persist a ledger entry when no offer is available', async () => {
    const fixture = setup()
    fixture.state.codex = {
      ...fixture.state.codex!,
      rateLimitResetCredits: { ...fixture.state.codex!.rateLimitResetCredits!, availableCount: 0 }
    }

    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow(
      'reset-credit offer is unavailable'
    )
    expect(fixture.consume).not.toHaveBeenCalled()
    expect(fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush).not.toHaveBeenCalled()
  })

  it('does not call the provider or persist an attempt when the CLI home is unavailable', async () => {
    const fixture = setup()
    fixture.runtimeHome.prepareForRateLimitFetch.mockReturnValue({ kind: 'skip' })

    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow()
    expect(fixture.consume).not.toHaveBeenCalled()
    expect(fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush).not.toHaveBeenCalled()
  })

  it('fails closed when the persisted reset history cannot be read', async () => {
    const fixture = setup()
    fixture.store.getCodexResetCreditAttemptLedger.mockImplementation(() => {
      throw new Error('corrupt reset history')
    })

    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow(
      'corrupt reset history'
    )
    expect(fixture.consume).not.toHaveBeenCalled()
    expect(fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush).not.toHaveBeenCalled()
  })

  it('does not call the provider when writing the pending attempt fails', async () => {
    const fixture = setup()
    fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush.mockRejectedValueOnce(
      new Error('disk full')
    )

    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow('disk full')
    expect(fixture.consume).not.toHaveBeenCalled()
  })

  it('retries a reset after settle persistence fails with the pending attempt key', async () => {
    const fixture = setup()
    fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush
      .mockImplementationOnce(fixture.persist)
      .mockRejectedValueOnce(new Error('disk full'))

    await expect(fixture.createCoordinator().consumeCurrent()).rejects.toThrow('disk full')
    const firstKey = fixture.consume.mock.calls[0]?.[0].idempotencyKey

    await expect(fixture.createCoordinator().consumeCurrent()).resolves.toMatchObject({
      outcome: 'reset',
      state: fixture.state
    })
    expect(fixture.consume).toHaveBeenCalledTimes(2)
    expect(fixture.consume.mock.calls.map(([request]) => request.idempotencyKey)).toEqual([
      firstKey,
      firstKey
    ])
  })

  it('does not send a reset if the target changes while the pending ledger write is waiting', async () => {
    const fixture = setup()
    const gate = Promise.withResolvers<void>()
    fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush.mockImplementationOnce(async (ledger) => {
      await gate.promise
      await fixture.persist(ledger)
    })

    const operation = fixture.createCoordinator().consumeCurrent()
    await vi.waitFor(() => expect(fixture.store.replaceCodexResetCreditAttemptLedgerAndFlush).toHaveBeenCalledOnce())
    fixture.state.codexTarget = { runtime: 'wsl', wslDistro: 'Ubuntu' }
    gate.resolve()

    await expect(operation).rejects.toThrow('target changed before reset')
    expect(fixture.consume).not.toHaveBeenCalled()
  })

  it('starts a new durable attempt when a later offer is observed', async () => {
    const fixture = setup()
    const coordinator = fixture.createCoordinator()
    await coordinator.consumeCurrent()
    fixture.state.codex = { ...fixture.state.codex!, updatedAt: fixture.state.codex!.updatedAt + 1 }
    await coordinator.consumeCurrent()

    expect(fixture.consume).toHaveBeenCalledTimes(2)
    expect(fixture.consume.mock.calls[0]?.[0].idempotencyKey).not.toBe(
      fixture.consume.mock.calls[1]?.[0].idempotencyKey
    )
  })

  it('replays a settled result after coordinator restart without another provider call', async () => {
    const fixture = setup()
    const first = fixture.createCoordinator()
    await expect(first.consumeCurrent()).resolves.toMatchObject({ outcome: 'reset' })
    const restarted = fixture.createCoordinator()

    await expect(restarted.consumeCurrent()).resolves.toMatchObject({ outcome: 'reset' })
    expect(fixture.consume).toHaveBeenCalledOnce()
  })

  it('serializes concurrent requests for the same offer so the provider spends once', async () => {
    const fixture = setup()
    const gate = Promise.withResolvers<{ outcome: 'reset'; state: typeof fixture.state }>()
    fixture.consume.mockImplementationOnce(() => gate.promise)
    const coordinator = fixture.createCoordinator()

    const first = coordinator.consumeCurrent()
    const second = coordinator.consumeCurrent()
    await vi.waitFor(() => expect(fixture.consume).toHaveBeenCalledOnce())
    gate.resolve({ outcome: 'reset', state: fixture.state })

    await expect(Promise.all([first, second])).resolves.toMatchObject([
      { outcome: 'reset' },
      { outcome: 'reset' }
    ])
    expect(fixture.consume).toHaveBeenCalledOnce()
  })

  it('passes an explicitly resolved CLI home path through to the provider', async () => {
    const fixture = setup('C:\\Users\\tester\\.codex')

    await fixture.createCoordinator().consumeCurrent()

    expect(fixture.consume).toHaveBeenCalledWith(
      expect.objectContaining({ codexHomePath: 'C:\\Users\\tester\\.codex' })
    )
  })
})
