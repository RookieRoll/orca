import {
  isLegacyAgentSessionAccountHome,
  type OpenCodeAgentSessionAccountHome
} from '../../shared/agent-session-account-home'
import type { AcpAccountBinding } from '../acp/acp-account-binding'

function definedEnvironment(
  environment: Record<string, string | undefined>
): Record<string, string> {
  const defined: Record<string, string> = {}
  for (const [key, value] of Object.entries(environment)) {
    if (value !== undefined) {
      defined[key] = value
    }
  }
  return defined
}

/** OpenCode uses the CLI identity already configured in the user's environment. */
export function resolveStructuredOpenCodeAccountHome(): OpenCodeAgentSessionAccountHome {
  return { kind: 'opencode', locator: { kind: 'unmanaged' } }
}

/** Resolve saved OpenCode sessions against the current CLI environment. */
export function environmentForStructuredOpenCodeAccountHome(
  _binding: OpenCodeAgentSessionAccountHome,
  input: { baseEnvironment: NodeJS.ProcessEnv }
): Record<string, string> {
  return definedEnvironment(input.baseEnvironment)
}

/** OpenCode launches under the user's existing CLI identity. */
export function openCodeAcpAccountBinding(): AcpAccountBinding {
  return {
    pin: { accountLocatorKind: 'opencode' },
    resolve: async () => resolveStructuredOpenCodeAccountHome(),
    environment: (home, env) => {
      if (isLegacyAgentSessionAccountHome(home)) {
        throw new Error('OpenCode chat requires a pinned CLI environment')
      }
      return environmentForStructuredOpenCodeAccountHome(home, { baseEnvironment: env })
    }
  }
}
