import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { isDefinitiveAbsence } from '../../shared/definitive-filesystem-absence'
import { dirname, join } from 'node:path'
import { getOrcaUserDataPath } from './codex-home-paths'
import { CodexPtyHomeRegistryMutations } from './codex-pane-account-registry-mutations'
import type { CodexPtyHomeRegistryFile } from './codex-pane-account-registry-types'

let cachedRegistry: CodexPtyHomeRegistryFile | null = null

function getRegistryPath(): string {
  return join(getOrcaUserDataPath(), 'codex-pane-accounts.json')
}

function emptyRegistry(): CodexPtyHomeRegistryFile {
  return { version: 3, homes: {} }
}

function readRegistryOrNull(): CodexPtyHomeRegistryFile | null {
  if (cachedRegistry) return cachedRegistry
  let rawRegistry: string
  try {
    rawRegistry = readFileSync(getRegistryPath(), 'utf-8')
  } catch (error) {
    if (!isDefinitiveAbsence(error)) {
      return null
    }
    cachedRegistry = emptyRegistry()
    return cachedRegistry
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(rawRegistry)
  } catch {
    return null
  }
  if (isLegacyAccountRegistry(parsed)) {
    cachedRegistry = emptyRegistry()
    return cachedRegistry
  }
  if (!isCodexPtyHomeRegistry(parsed)) {
    return null
  }
  cachedRegistry = { version: 3, homes: { ...parsed.homes } }
  return cachedRegistry
}

function isLegacyAccountRegistry(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'version' in value &&
      value.version === 2
  )
}

function isCodexPtyHomeRegistry(value: unknown): value is CodexPtyHomeRegistryFile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (!('version' in value) || value.version !== 3 || !('homes' in value)) return false
  const homes = value.homes
  return Boolean(
    homes &&
      typeof homes === 'object' &&
      !Array.isArray(homes) &&
      Object.values(homes).every((home) => typeof home === 'string' && home.length > 0)
  )
}

function readRegistry(): CodexPtyHomeRegistryFile | null {
  mutations.flush()
  if (!cachedRegistry) {
    const pendingRegistry = mutations.getPendingRegistry()
    if (pendingRegistry) return pendingRegistry
  }
  return readRegistryOrNull()
}

function writeRegistry(registry: CodexPtyHomeRegistryFile): boolean {
  const registryPath = getRegistryPath()
  const temporaryPath = `${registryPath}.${process.pid}.tmp`
  try {
    mkdirSync(dirname(registryPath), { recursive: true })
    writeFileSync(temporaryPath, `${JSON.stringify(registry)}\n`, {
      encoding: 'utf-8',
      mode: 0o600
    })
    renameSync(temporaryPath, registryPath)
    return true
  } catch (error) {
    console.warn('[codex-pty-homes] Failed to persist PTY home registry:', error)
    try {
      rmSync(temporaryPath, { force: true })
    } catch {}
    return false
  }
}

const mutations = new CodexPtyHomeRegistryMutations({
  read: readRegistryOrNull,
  write: writeRegistry
})

/** Records the resolved CODEX_HOME for a committed Codex launch. */
export function recordCodexPtyLaunchHome(ptyId: string, homePath: string): void {
  if (!homePath.trim()) return
  mutations.record(ptyId, homePath)
}

/** Drops a PTY's launch-home proof once that PTY exits. */
export function forgetCodexPtyLaunchHome(ptyId: string): void {
  mutations.record(ptyId, null)
}

/** Returns the launch-resolved home, or null when this PTY has no proof. */
export function getCodexPtyLaunchHome(ptyId: string): string | null {
  return readRegistry()?.homes[ptyId] ?? null
}

export const _internals = {
  resetCache: (): void => {
    cachedRegistry = null
    mutations.reset()
  }
}
