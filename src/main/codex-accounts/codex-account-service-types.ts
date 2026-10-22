import type { CodexRateLimitAccountsState } from '../../shared/managed-account-types'
import type { CodexResetCreditExpectedScope } from '../../shared/codex-reset-credit-scope'
import type { CodexRateLimitResetOutcome, RateLimitState } from '../../shared/rate-limit-types'

export type CodexResetCreditRejectedBeforeProviderReason =
  | 'targetChanged'
  | 'accountChanged'
  | 'accountRevisionChanged'
  | 'accountRuntimeChanged'
  | 'offerUnavailable'
  | 'offerChanged'

export type CodexResetCreditConsumedResult = {
  outcome: CodexRateLimitResetOutcome
  scope: CodexResetCreditExpectedScope
  codex: CodexRateLimitAccountsState
  rateLimits: RateLimitState
}

export type CodexResetCreditRejectedBeforeProviderResult = {
  status: 'rejectedBeforeProvider'
  retryDisposition: 'discardAttempt'
  reason: CodexResetCreditRejectedBeforeProviderReason
  scope: CodexResetCreditExpectedScope
  codex: CodexRateLimitAccountsState
  rateLimits: RateLimitState
}

export type CodexResetCreditConsumeResult =
  | CodexResetCreditConsumedResult
  | CodexResetCreditRejectedBeforeProviderResult
