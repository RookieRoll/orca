import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ClaudeCliHomeResolver } from '../claude-accounts/claude-cli-home-resolver'
import { applyClaudeEnvPatch } from '../claude-accounts/environment'
import { resolveSessionFilePath } from '../native-chat/session-file-resolver'

/**
 * The folder a structured launch runs under: explicit CLI config dir or `~/.claude`.
 */
export async function resolveClaudeStructuredLaunchHome(
  resolver: ClaudeCliHomeResolver | undefined,
  env: Record<string, string>,
  _recordHome: string
): Promise<string> {
  await resolver?.prepareLaunch()
  const explicitConfigDir = env.CLAUDE_CONFIG_DIR?.trim() || resolver?.userConfigDir()
  if (!env.CLAUDE_CONFIG_DIR && explicitConfigDir) {
    applyClaudeEnvPatch(env, { CLAUDE_CONFIG_DIR: explicitConfigDir })
  }
  return explicitConfigDir || resolver?.systemDefaultHome() || join(homedir(), '.claude')
}

/** Whether Claude wrote a transcript for this id under the given config folder. */
async function claudeTranscriptExists(input: {
  providerSessionId: string
  claudeConfigDir: string
}): Promise<boolean> {
  const path = await resolveSessionFilePath('claude', input.providerSessionId, {
    claudeProjectsDir: join(input.claudeConfigDir, 'projects')
  })
  return path !== null
}

/**
 * Whether a chat with a recorded session resumes it.
 */
export async function claudeLaunchResumesTranscript(input: {
  leafUuid: string | null
  providerSessionId: string
  claudeConfigDir: string
  hasTranscript?: typeof claudeTranscriptExists
}): Promise<boolean> {
  const { providerSessionId, claudeConfigDir } = input
  if (input.leafUuid !== null) {
    return true
  }
  const hasTranscript = input.hasTranscript ?? claudeTranscriptExists
  if (await hasTranscript({ providerSessionId, claudeConfigDir })) {
    return true
  }
  if (input.leafUuid === null) {
    return false
  }
  return false
}
