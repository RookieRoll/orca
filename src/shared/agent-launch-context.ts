import { z } from 'zod'

export const AGENT_KIND_VALUES = [
  'claude-code', 'claude-agent-teams', 'codebuddy', 'openclaude', 'codex', 'autohand', 'opencode',
  'opencode2', 'mimo-code', 'pi', 'omp', 'prime-agent', 'qoder', 'qoder-cn', 'gemini', 'antigravity',
  'aider', 'goose', 'amp', 'kilo', 'kiro', 'crush', 'aug', 'cline', 'codebuff', 'freebuff',
  'command-code', 'continue', 'cursor', 'droid', 'kimi', 'mistral-vibe', 'qwen-code', 'rovo',
  'hermes', 'openclaw', 'copilot', 'grok', 'devin', 'ante', 'jcode', 'trae', 'muse', 'dsh',
  'zcode', 'other'
] as const

export const agentKindSchema = z.enum(AGENT_KIND_VALUES)
export type AgentKind = z.infer<typeof agentKindSchema>

export const launchSourceSchema = z.enum([
  'command_palette', 'sidebar', 'quick_command', 'tab_bar_quick_launch', 'task_page',
  'new_workspace_composer', 'workspace_jump_palette', 'shortcut', 'onboarding', 'diff_notes_send',
  'notes_send', 'conflict_resolution', 'source_control_recovery', 'terminal_context_menu',
  'explain_commit', 'cli', 'mobile', 'orchestration', 'unknown'
])
export type LaunchSource = z.infer<typeof launchSourceSchema>

export const requestKindSchema = z.enum(['new', 'resume', 'followup'])
export type RequestKind = z.infer<typeof requestKindSchema>

export type AgentLaunchContext = {
  agent_kind: AgentKind
  launch_source: LaunchSource
  request_kind: RequestKind
}
