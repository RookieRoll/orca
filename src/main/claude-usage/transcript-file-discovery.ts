import { claudeConfigHostDirs, claudeProjectsHostDirs } from '../ai-vault/session-scanner-roots'
import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { isDefinitiveAbsence } from '../../shared/definitive-filesystem-absence'


async function walkJsonlFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true }).catch((error: unknown) => {
    if (isDefinitiveAbsence(error)) {
      return []
    }
    throw error
  })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      appendDiscoveredFiles(files, await walkJsonlFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      files.push(fullPath)
    }
  }

  return files
}

function appendDiscoveredFiles(target: string[], source: readonly string[]): void {
  // Why: long-lived transcript directories can exceed V8's argument limit if
  // child file arrays are spread into push().
  for (const filePath of source) {
    target.push(filePath)
  }
}

/** Resolved by the host process: a scan worker has no account router of its own. */
export async function listClaudeTranscriptFiles(): Promise<string[]> {
  const roots = [
    ...claudeProjectsHostDirs(),
    ...claudeConfigHostDirs().map((configDir) => join(configDir, 'transcripts'))
  ]
  const files = await Promise.all(roots.map((root) => walkJsonlFiles(root)))
  return [...new Set(files.flat())].sort()
}
