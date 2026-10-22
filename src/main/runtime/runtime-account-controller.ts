import type { ClaudeRuntimeAuthService } from '../claude-accounts/runtime-auth-service'
import type { CommitMessageAgentEnvironmentResolvers } from '../text-generation/commit-message-agent-environment'
import type { ClaudeAccountSelectionTarget } from '../claude-accounts/runtime-selection'

export type RuntimeAccountServices = {
  claudeRuntimeAuth: ClaudeRuntimeAuthService
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

  getClaudeConfigDirectory(target: ClaudeAccountSelectionTarget): string | null {
    return this.services?.claudeRuntimeAuth.getRuntimeConfigDir(target) ?? null
  }

  private requireServices(): RuntimeAccountServices {
    if (!this.services) {
      throw new Error('Account services are not configured on this runtime')
    }
    return this.services
  }
}
