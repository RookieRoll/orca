import { stat } from 'node:fs/promises'
import { admitTranscriptPath } from '../native-chat/transcript-path-admission'
import { dirname } from 'node:path'
import { homedir } from 'node:os'
import { isLegacyAgentSessionAccountHome } from '../../shared/agent-session-account-home'
import {
  absoluteConversationStore,
  type StructuredAgentTranscriptImport
} from '../native-chat/structured-agent-cli-conversations'
import { resolveOpenCodeDatabasePath } from './opencode-data-directory'
import { environmentForStructuredOpenCodeAccountHome } from './opencode-structured-account-home'

function accountDatabase(
  accountHome: Parameters<StructuredAgentTranscriptImport['conversationStore']>[0]['accountHome'],
  launchEnv: NodeJS.ProcessEnv
) {
  if (isLegacyAgentSessionAccountHome(accountHome)) {
    return null
  }
  const env = environmentForStructuredOpenCodeAccountHome(accountHome, {
    baseEnvironment: launchEnv
  })
  return absoluteConversationStore(
    resolveOpenCodeDatabasePath(
      env,
      (process.platform === 'win32' ? env.USERPROFILE : env.HOME) || homedir()
    )
  )
}

export const OPENCODE_TRANSCRIPT_IMPORT: StructuredAgentTranscriptImport = {
  // The account's store is its exact database, which is the only one its chat can load from.
  conversationStore: ({ accountHome, launchEnv }) => accountDatabase(accountHome, launchEnv),
  admitTranscriptPath: async ({ store: dbPath, transcriptPath }) => {
    const [expected, actual] = await Promise.all([
      admitTranscriptPath(dirname(dbPath), dbPath),
      admitTranscriptPath(dirname(dbPath), transcriptPath)
    ])
    return expected && actual && expected.path === actual.path ? actual.path : null
  },
  accountHomeCandidates: ({ selectedAccountHome }) => [selectedAccountHome],
  findTranscript: async ({ providerSessionId, store: dbPath }) => {
    try {
      if (!(await stat(dbPath)).isFile()) {
        return null
      }
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'ENOENT' || error.code === 'ENOTDIR')
      ) {
        return null
      }
      throw error
    }
    const { readOpenCodeTranscriptSignalViaWorker } =
      await import('../ai-vault/session-scanner-opencode-sqlite-worker-spawn')
    const signal = await readOpenCodeTranscriptSignalViaWorker({
      dbPath,
      sessionId: providerSessionId
    })
    return signal ? dbPath : null
  }
}
