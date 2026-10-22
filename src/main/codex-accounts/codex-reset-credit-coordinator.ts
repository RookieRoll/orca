import { createHash, randomUUID } from 'node:crypto'
import type { CodexRateLimitResetResult, RateLimitRuntimeTarget } from '../../shared/rate-limit-types'
import { buildCodexResetCreditExpectedScope } from '../../shared/codex-reset-credit-scope'
import type { RateLimitService } from '../rate-limits/service'
import { ManagedCodexHomeTemporarilyUnavailableError } from './host-codex-managed-home-ownership'
import type { CodexRuntimeHomeService } from './runtime-home-service'
import type { Store } from '../persistence'
import { CodexResetCreditLedger, resetAccountScopeKey, resetScopeKey } from './codex-reset-credit-ledger'

function sameTarget(left: RateLimitRuntimeTarget, right: RateLimitRuntimeTarget): boolean {
  return left.runtime === right.runtime && left.wslDistro === right.wslDistro
}

export class CodexResetCreditCoordinator {
  private mutationQueue: Promise<unknown> = Promise.resolve()
  private readonly ledger: CodexResetCreditLedger

  constructor(
    store: Store,
    private readonly rateLimits: RateLimitService,
    private readonly runtimeHome: CodexRuntimeHomeService
  ) {
    this.ledger = new CodexResetCreditLedger(store)
  }

  async consumeCurrent(): Promise<CodexRateLimitResetResult> {
    const operation = this.mutationQueue.then(() => this.consumeQueued())
    this.mutationQueue = operation.catch(() => {})
    return operation
  }

  private async consumeQueued(): Promise<CodexRateLimitResetResult> {
    if (this.ledger.error) {
      throw this.ledger.error
    }
    const target = { ...this.rateLimits.getState().codexTarget }
    const home = this.runtimeHome.prepareForRateLimitFetch(target)
    if (home.kind === 'skip') {
      throw new ManagedCodexHomeTemporarilyUnavailableError()
    }
    if (!sameTarget(this.rateLimits.getState().codexTarget, target)) {
      throw new Error('The active Codex rate-limit target changed before reset.')
    }
    const accountId = `cli-home:${createHash('sha256').update(home.codexHomePath ?? '').digest('hex')}`
    const scope = buildCodexResetCreditExpectedScope({
      target,
      account: {
        id: accountId,
        managedHomeRuntime: target.runtime,
        wslDistro: target.runtime === 'wsl' ? target.wslDistro : null,
        updatedAt: 0
      },
      limits: this.rateLimits.getState().codex
    })
    const accountScopeKey = resetAccountScopeKey({ target, accountId, accountRevision: 0 })
    const freshKey = randomUUID()
    const existing = this.ledger.findAttemptFor(
      freshKey,
      scope ? resetScopeKey(scope) : '',
      accountScopeKey
    )
    if (existing?.attempt.state === 'settled' && existing.attempt.settledOutcome) {
      return {
        outcome: existing.attempt.settledOutcome,
        state: this.rateLimits.getState()
      }
    }
    const idempotencyKey = existing?.idempotencyKey ?? freshKey
    const expectedScope = existing?.attempt.expectedScope ?? scope
    if (!expectedScope) {
      throw new Error('The Codex reset-credit offer is unavailable.')
    }
    const attempt = existing?.attempt ?? this.ledger.createFresh(idempotencyKey, expectedScope)
    if (attempt.state === 'fresh') {
      await this.ledger.markProviderPending(idempotencyKey, attempt)
    }
    if (!sameTarget(this.rateLimits.getState().codexTarget, target)) {
      throw new Error('The active Codex rate-limit target changed before reset.')
    }
    const result = await this.rateLimits.consumeCodexRateLimitResetCredit({
      idempotencyKey,
      target,
      codexHomePath: home.codexHomePath
    })
    await this.ledger.markSettled(idempotencyKey, attempt, result.outcome)
    return result
  }
}
