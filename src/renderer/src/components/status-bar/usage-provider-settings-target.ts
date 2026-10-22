import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'

export function getUsageProviderAccountsSectionId(
  provider: ProviderRateLimits['provider']
): string | null {
  switch (provider) {
    case 'claude':
    case 'codex':
      return null
    case 'gemini':
      return 'accounts-gemini'
    case 'opencode-go':
      return 'accounts-opencode-go'
    case 'minimax':
      return 'accounts-minimax'
    case 'grok':
      return 'accounts-grok'
    case 'cursor':
      return 'accounts-cursor'
    case 'antigravity':
    case 'kimi':
      // Why: Orca must not mutate Kimi's CLI-owned credential lifecycle.
      // Antigravity credentials live in the agy CLI; quota is fetched directly via agy.
      return null
    case 'zcode':
      return 'accounts-zcode'
  }
}

/** Whether a signed-out usage row links to a provider settings section. */
export function usageRowSignInOpensSettings(provider: ProviderRateLimits['provider']): boolean {
  return getUsageProviderAccountsSectionId(provider) !== null
}
