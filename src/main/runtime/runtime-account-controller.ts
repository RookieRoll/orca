import type { ClaudeRuntimeAuthService } from '../claude-accounts/runtime-auth-service'
import type { RateLimitService } from '../rate-limits/service'
import type { RateLimitState } from '../../shared/rate-limit-types'
import type { CommitMessageAgentEnvironmentResolvers } from '../text-generation/commit-message-agent-environment'
import type { ClaudeAccountSelectionTarget } from '../claude-accounts/runtime-selection'

export type RuntimeAccountServices = {
  claudeRuntimeAuth: ClaudeRuntimeAuthService
  rateLimits: RateLimitService
}

export type AccountsSnapshot = {
  rateLimits: RateLimitState
}

export class RuntimeAccountController {
  private services: RuntimeAccountServices | null = null
  private commitMessageAgentEnvironment: CommitMessageAgentEnvironmentResolvers | null = null

  setServices(services: RuntimeAccountServices): void {
    this.services = services
  }

  setCommitMessageAgentEnvironment(resolvers: CommitMessageAgentEnvironmentResolvers): void {
    this.commitMessageAgentEnvironment = resolvers
  }

  getCommitMessageAgentEnvironment(): CommitMessageAgentEnvironmentResolvers | undefined {
    return this.commitMessageAgentEnvironment ?? undefined
  }

  /** Null where the desktop that owns this host's usage polls it instead (a WSL host). */
  usageRateLimits(): RateLimitService | null {
    return this.services?.rateLimits ?? null
  }

  /** Refuses where no poller is configured for this runtime. */
  requireUsageRateLimits(): RateLimitService {
    return this.requireServices().rateLimits
  }

  getClaudeConfigDirectory(target: ClaudeAccountSelectionTarget): string | null {
    return this.services?.claudeRuntimeAuth.getRuntimeConfigDir(target) ?? null
  }

  getSnapshot(): AccountsSnapshot {
    return { rateLimits: this.requireServices().rateLimits.getState() }
  }

  async refreshForMobile(): Promise<void> {
    const { rateLimits } = this.requireServices()
    await rateLimits.refresh()
  }

  async refreshForMobileSubscriber(): Promise<void> {
    const { rateLimits } = this.requireServices()
    await rateLimits.refreshIfStale()
  }

  onChanged(listener: (snapshot: AccountsSnapshot) => void): () => void {
    const services = this.requireServices()
    const unsubscribeUsage = services.rateLimits.onStateChange((rateLimits) => {
      listener({ rateLimits })
    })
    return () => {
      unsubscribeUsage()
    }
  }

  private requireServices(): RuntimeAccountServices {
    if (!this.services) {
      throw new Error('Account services are not configured on this runtime')
    }
    return this.services
  }
}
