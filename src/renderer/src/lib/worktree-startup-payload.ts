import type { TuiAgent } from '../../../shared/tui-agent'
import type { AgentLaunchContext } from '../../../shared/agent-launch-context'
import type { StartupCommandDelivery } from '../../../shared/codex-startup-delivery'
import type {
  AgentProviderSessionMetadata,
  SleepingAgentLaunchConfig
} from '../../../shared/agent-session-resume'
import type { SessionOptionValue } from '../../../shared/native-chat-session-options'

/** Operational launch context used after a startup command reaches its pane. */
export type AgentStartedTelemetry = AgentLaunchContext

/** Startup command threaded onto a worktree's first terminal at activation. */
export type WorktreeStartupPayload = {
  command: string
  env?: Record<string, string>
  launchConfig?: SleepingAgentLaunchConfig
  resumeProviderSession?: AgentProviderSessionMetadata
  launchToken?: string
  launchAgent?: TuiAgent
  draftPrompt?: string
  startupCommandDelivery?: StartupCommandDelivery
  initialAgentStatus?: { agent: TuiAgent; prompt: string }
  sessionOptions?: Record<string, SessionOptionValue>
  telemetry?: AgentStartedTelemetry
}
