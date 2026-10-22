import type { Store } from './persistence'
import { CodexRuntimeHomeService } from './codex-accounts/runtime-home-service'
import { ClaudeRuntimeAuthService } from './claude-accounts/runtime-auth-service'

export type ProviderAccountServices = {
  codexRuntimeHome: CodexRuntimeHomeService
  claudeRuntimeAuth: ClaudeRuntimeAuthService
}

export function createProviderAccountServices(store: Store): ProviderAccountServices {
  return {
    codexRuntimeHome: new CodexRuntimeHomeService(store),
    claudeRuntimeAuth: new ClaudeRuntimeAuthService(store)
  }
}
