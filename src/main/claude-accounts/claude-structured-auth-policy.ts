import type { AgentSessionAccountKind } from '../../shared/agent-session-availability'

export type ClaudeStructuredAuthPolicy = {
  account: AgentSessionAccountKind
}

export function claudeStructuredAuthPolicy(): ClaudeStructuredAuthPolicy {
  return { account: 'system' }
}
