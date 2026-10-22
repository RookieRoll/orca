import { consumeCodexRateLimitResetCredit } from '../codex-fetcher'
import { RateLimitServicePolling } from './service-polling'
import {
  normalizeCodexAccountSelectionTarget,
  normalizeClaudeAccountSelectionTarget,
  type CodexAccountSelectionTarget,
  type ClaudeAccountSelectionTarget,
  type RateLimitRuntimeTarget,
  type RateLimitState,
  type CodexRateLimitResetResult
} from './service-types'

export abstract class RateLimitServiceAccountRefresh extends RateLimitServicePolling {
  async refresh(): Promise<RateLimitState> {
    // Why: this user-directed refresh must bypass the poll throttle, else the click can no-op after wake/focus and feel broken.
    await this.fetchAll({ force: true })
    return this.getState()
  }

  async refreshIfStale(): Promise<RateLimitState> {
    // Why: reconnecting mobile subscribers need fresh backgrounded-desktop data, but replaying a subscription must not queue another forced fetch.
    const plan = this.getActiveWindowRefreshPlan(Date.now())
    await this.runActiveWindowRefreshPlan(plan)
    return this.getState()
  }

  async refreshGrok(): Promise<RateLimitState> {
    await this.fetchGrokOnly({ force: true })
    return this.getState()
  }

  invalidateOpenCodeGoCredentialState(options: { apiKeyCleared?: boolean } = {}): void {
    this.opencodeFetchGeneration += 1
    // Why: a key from env, OpenCode's DB or auth.json survives a cookie change; only clearing the saved key hides the chip.
    if (options.apiKeyCleared) {
      this.openCodeGoApiKeyConfigured = false
    }
    // Why: a credential change must discard the snapshot and any result still in flight.
    this.updateState({
      ...this.state,
      opencodeGo: this.withFetchingStatus(null, 'opencode-go')
    })
  }

  invalidateMiniMaxCredentialState(): void {
    this.minimaxFetchGeneration += 1
    // Why: saving/forgetting the cookie can race an in-flight fetch; clear the visible snapshot before any old-cookie result returns.
    this.updateState({
      ...this.state,
      minimax: this.withFetchingStatus(null, 'minimax')
    })
  }

  invalidateZcodeCredentialState(): void {
    this.zcodeFetchGeneration += 1
    // Why: saving/forgetting the plan key can race an in-flight fetch; clear the visible snapshot before any old-key result returns.
    this.updateState({
      ...this.state,
      zcode: this.withFetchingStatus(null, 'zcode')
    })
  }

  async refreshForCodexAccountChange(
    _outgoingAccountId?: string | null,
    target?: CodexAccountSelectionTarget
  ): Promise<RateLimitState> {
    const nextTarget = normalizeCodexAccountSelectionTarget(target)
    this.codexFetchTarget = nextTarget
    this.codexFetchGeneration += 1
    // Why: a new account/target starts with a clean retry schedule.
    this.activeFailureStreakByProvider.codex = 0
    // Why: clear the old Codex view immediately, else the previous account's limits show under the newly selected identity until the next poll.
    this.updateState({
      ...this.state,
      codex: this.withFetchingStatus(null, 'codex')
    })
    await this.fetchCodexOnly({ force: true })
    return this.getState()
  }

  async refreshCodexForTarget(target?: CodexAccountSelectionTarget): Promise<RateLimitState> {
    const nextTarget = normalizeCodexAccountSelectionTarget(target)
    const targetChanged = !this.isSameCodexTarget(this.codexFetchTarget, nextTarget)
    this.codexFetchTarget = nextTarget
    this.codexFetchGeneration += 1
    this.activeFailureStreakByProvider.codex = 0
    this.updateState({
      ...this.state,
      codex: this.withFetchingStatus(targetChanged ? null : this.state.codex, 'codex')
    })
    await this.fetchCodexOnly({ force: true })
    return this.getState()
  }

  async consumeCodexRateLimitResetCredit(options: {
    idempotencyKey: string
    target: RateLimitRuntimeTarget
    codexHomePath: string | null
  }): Promise<CodexRateLimitResetResult> {
    const codexTarget = normalizeCodexAccountSelectionTarget(options.target)
    const codexHomePath = options.codexHomePath
    const scopedStateBeforeReset = this.getState()
    const missingWslCodexHome = codexHomePath
      ? null
      : this.getMissingWslCodexHomeResult(codexTarget)
    if (missingWslCodexHome) {
      if (this.isSameCodexTarget(this.codexFetchTarget, codexTarget)) {
        await this.fetchCodexOnly({ force: true })
      }
      throw new Error(missingWslCodexHome.error ?? 'Codex home unavailable')
    }
    try {
      const outcome = await consumeCodexRateLimitResetCredit({
        codexHomePath,
        idempotencyKey: options.idempotencyKey
      })
      const state = await this.fetchCodexResetResultState(
        codexTarget,
        codexHomePath,
        scopedStateBeforeReset,
        outcome
      )
      return { outcome, state }
    } catch (error) {
      if (this.isSameCodexTarget(this.codexFetchTarget, codexTarget)) {
        await this.fetchCodexOnly({ force: true })
      }
      throw error
    }
  }

  async refreshClaudeForTarget(target?: ClaudeAccountSelectionTarget): Promise<RateLimitState> {
    const nextTarget = normalizeClaudeAccountSelectionTarget(target)
    const targetChanged = !this.isSameClaudeTarget(this.claudeFetchTarget, nextTarget)
    this.claudeFetchTarget = nextTarget
    this.claudeFetchGeneration += 1
    this.activeFailureStreakByProvider.claude = 0
    if (targetChanged) {
      // Why: statusline posts from the outgoing target's sessions must not land on the incoming target's bar mid-switch.
      this.lastClaudeAuthSnapshot = null
    }
    this.updateState({
      ...this.state,
      claude: this.withFetchingStatus(targetChanged ? null : this.state.claude, 'claude')
    })
    await this.fetchClaudeOnly({ force: true })
    return this.getState()
  }
}
