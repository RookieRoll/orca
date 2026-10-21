/**
 * The launch context for a host-built agent launch, of which only `launch_source` comes from the caller.
 *
 * `agent_kind` and `request_kind` are derived rather than accepted — the host already knows both,
 * and a value it derives is a value a caller cannot misreport. `request_kind` is always `new`
 * because a host-built launch is always a fresh agent.
 *
 * An absent or unrecognized launch surface is normalized to `unknown` before it reaches the wire.
 */

import { tuiAgentToAgentKind } from '../../shared/agent-kind'
import { launchSourceSchema, type AgentLaunchContext } from '../../shared/agent-launch-context'
import type { TuiAgent } from '../../shared/tui-agent'

export function buildAgentLaunchContext(
  agent: TuiAgent,
  launchSource: string | undefined
): AgentLaunchContext {
  const parsed = launchSourceSchema.safeParse(launchSource)
  return {
    agent_kind: tuiAgentToAgentKind(agent),
    launch_source: parsed.success ? parsed.data : 'unknown',
    request_kind: 'new'
  }
}
