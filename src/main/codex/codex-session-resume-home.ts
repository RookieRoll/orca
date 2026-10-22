import { lstatSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  getRuntimePathBasename,
  normalizeRuntimePathForComparison,
  relativePathInsideRoot
} from '../../shared/cross-platform-path'
import { listCodexSessionRolloutFilesIncrementally } from './codex-session-file-listing'
import { resolveExplicitCustomCodexHomeForLaunch } from './codex-real-home-path'

// Why: only Codex's dated rollout layout may establish home provenance; nested or misplaced JSONL must not select credentials.
const CLAIMED_CODEX_ROLLOUT_TAIL = String.raw`\d{4}/\d{2}/\d{2}/rollout-[^/]+\.jsonl(?:\.zst)?`
const TRUSTED_CODEX_ROLLOUT_TAIL = String.raw`\d{4}/\d{2}/\d{2}/rollout-[^/:]+\.jsonl(?:\.zst)?`
const ROLLOUT_RELATIVE_PATH = new RegExp(`^${TRUSTED_CODEX_ROLLOUT_TAIL}$`)
// Why: case-insensitive because trusted-home matching folds Windows path case too.
const CODEX_ROLLOUT_LAYOUT_PATH = new RegExp(`(?:^|/)sessions/${CLAIMED_CODEX_ROLLOUT_TAIL}$`, 'i')

/** `resume` pins CODEX_HOME to the trusted CLI home that owns the rollout. `fresh` means
 *  provenance could not be verified, so the caller drops the resume argv — an
 *  unverifiable rollout must never resume under a different home.
 *  `claimedCodexProvenance` gates the user-facing notice: a path that claimed real
 *  Codex layout is worth reporting, stale cross-agent metadata is not. */
export type CodexSessionResumePreparation =
  | { outcome: 'resume'; codexHomePath: string }
  | { outcome: 'fresh'; claimedCodexProvenance: boolean }

// Why: fold only Win32's extended drive spelling; \\.\ device namespaces and every other \\?\ form
// (including \\?\UNC\, which is a network share rather than a device) stay unfolded here.
function toCodexTrustedPathComparisonCopy(filePath: string): string | null {
  if (filePath.startsWith('\\\\.\\')) {
    return null
  }
  if (!filePath.startsWith('\\\\?\\')) {
    return filePath
  }
  return filePath.match(/^\\\\\?\\([A-Za-z]:[\\/][\s\S]*)$/)?.[1] ?? null
}

function isCodexRolloutInsideSessionsRoot(sessionsRoot: string, filePath: string): boolean {
  const comparisonSessionsRoot = toCodexTrustedPathComparisonCopy(sessionsRoot)
  const comparisonFilePath = toCodexTrustedPathComparisonCopy(filePath)
  if (!comparisonSessionsRoot || !comparisonFilePath) {
    return false
  }
  const relativePath = relativePathInsideRoot(comparisonSessionsRoot, comparisonFilePath)
  return Boolean(relativePath && ROLLOUT_RELATIVE_PATH.test(relativePath.replace(/\\/g, '/')))
}

function isRegularFile(filePath: string): boolean {
  try {
    return lstatSync(filePath).isFile()
  } catch {
    return false
  }
}

function resolveExistingRolloutPath(
  transcriptPath: string,
  fileIsRegular: (filePath: string) => boolean
): string | null {
  const plainPath = transcriptPath.endsWith('.jsonl.zst')
    ? transcriptPath.slice(0, -'.zst'.length)
    : transcriptPath.endsWith('.jsonl')
      ? transcriptPath
      : null
  if (!plainPath) {
    return fileIsRegular(transcriptPath) ? transcriptPath : null
  }
  if (fileIsRegular(plainPath)) {
    return plainPath
  }
  const compressedPath = `${plainPath}.zst`
  return fileIsRegular(compressedPath) ? compressedPath : null
}

function resolveTrustedCodexSessionResume(args: {
  transcriptPath: string | undefined
  trustedCodexHomes: readonly string[]
  fileIsRegular?: (filePath: string) => boolean
}): { homePath: string; transcriptPath: string } | null {
  const persistedPath = args.transcriptPath?.trim()
  if (!persistedPath) {
    return null
  }

  for (const homePath of args.trustedCodexHomes) {
    const sessionsRoot = join(homePath, 'sessions')
    if (!isCodexRolloutInsideSessionsRoot(sessionsRoot, persistedPath)) {
      continue
    }
    const transcriptPath = resolveExistingRolloutPath(
      persistedPath,
      args.fileIsRegular ?? isRegularFile
    )
    if (transcriptPath) {
      return { homePath, transcriptPath }
    }
  }
  return null
}

/** The homes this host itself lists for Codex sessions: the only ones a pane may pin as CODEX_HOME. */
export function trustedCodexResumeHomes(
  runtimeHome: { getHostCodexHomePathsForSessionDiscovery(): string[] },
  systemHomePath: string,
  launchEnv?: NodeJS.ProcessEnv
): string[] {
  return uniqueCodexHomes([
    systemHomePath,
    ...runtimeHome.getHostCodexHomePathsForSessionDiscovery(),
    resolveExplicitCustomCodexHomeForLaunch(launchEnv)
  ])
}

function uniqueCodexHomes(paths: readonly (string | null)[]): string[] {
  const seen = new Set<string>()
  return paths.filter((path): path is string => {
    if (!path) return false
    const normalized = normalizeRuntimePathForComparison(path)
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

export function resolveTrustedCodexSessionResumeHome(args: {
  transcriptPath: string | undefined
  trustedCodexHomes: readonly string[]
  fileIsRegular?: (filePath: string) => boolean
}): string | null {
  return resolveTrustedCodexSessionResume(args)?.homePath ?? null
}

/**
 * True when transcriptPath claims Codex's dated rollout layout, under any home and without
 * checking existence — separating rejected Codex provenance from cross-agent/stale metadata.
 * Not scoped to trusted homes: a rollout under an untrusted home is still rejected provenance,
 * and admitting it would resume that session under a different CLI home.
 */
export function claimsCodexRolloutLayout(transcriptPath: string | undefined): boolean {
  const persistedPath = transcriptPath?.trim()
  if (!persistedPath) {
    return false
  }
  return CODEX_ROLLOUT_LAYOUT_PATH.test(persistedPath.replace(/\\/g, '/'))
}

/**
 * Verified provenance, or an explicit fall-back to a fresh session. Never rejects:
 * the caller drops the resume argv on `fresh`, so a rollout Orca cannot place under a
 * trusted home resumes nowhere instead of resuming under another CLI home (#10793).
 *
 * The rescan ranking inputs are required here for the same reason they are required on
 * findTrustedCodexSessionResume, and are forwarded wholesale so this wrapper cannot drop one.
 */
export async function resolveCodexSessionResumeProvenance(args: {
  sessionId: string
  transcriptPath: string | undefined
  trustedCodexHomes: readonly string[]
  systemCodexHomePath: string | null
  fileIsRegular?: (filePath: string) => boolean
  listSessionFiles?: (sessionsRoot: string) => AsyncIterable<string>
}): Promise<
  | { outcome: 'resume'; homePath: string; transcriptPath: string }
  | { outcome: 'fresh'; claimedCodexProvenance: boolean }
> {
  const sessionSource = await findTrustedCodexSessionResume(args)
  return sessionSource
    ? { outcome: 'resume', ...sessionSource }
    : { outcome: 'fresh', claimedCodexProvenance: claimsCodexRolloutLayout(args.transcriptPath) }
}

/**
 * Prefer the system CLI home when a legacy session id appears in multiple homes.
 * Explicit homes use normalized path order, independent of discovery order.
 */
function rankTrustedCodexHomesForRescan(
  args: { trustedCodexHomes: readonly string[]; systemCodexHomePath: string | null }
): string[] {
  const systemHome = args.systemCodexHomePath?.trim()
  const systemComparison = systemHome ? normalizeRuntimePathForComparison(systemHome) : null
  return [...args.trustedCodexHomes].sort((left, right) => {
    const leftComparison = normalizeRuntimePathForComparison(left)
    const rightComparison = normalizeRuntimePathForComparison(right)
    if (leftComparison === systemComparison) return -1
    if (rightComparison === systemComparison) return 1
    return leftComparison.localeCompare(rightComparison)
  })
}

/**
 * Why: `existsSync` reports false for *any* stat error, so a briefly locked
 * sessions tree (antivirus, backup, indexer) reads as "this rollout is not
 * bridged here" and the scan moves on to the next ranked home. For the system
 * CLI home that silently resumes the session under a DIFFERENT home's
 * credentials, so only a definitive
 * absence may skip it (STA-4607).
 */
function sessionsTreeIsPresent(sessionsRoot: string): boolean {
  try {
    statSync(sessionsRoot)
    return true
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return false
    }
    // Why: skipping an unreadable candidate only forgoes a possible resume source.
    return false
  }
}

export async function findTrustedCodexSessionResume(args: {
  sessionId: string
  transcriptPath: string | undefined
  trustedCodexHomes: readonly string[]
  systemCodexHomePath: string | null
  fileIsRegular?: (filePath: string) => boolean
  listSessionFiles?: (sessionsRoot: string) => AsyncIterable<string>
}): Promise<{ homePath: string; transcriptPath: string } | null> {
  const directSession = resolveTrustedCodexSessionResume(args)
  if (directSession) {
    return directSession
  }
  if (args.transcriptPath?.trim()) {
    // Why: stale/rejected provenance must not select a same-id rollout under another CLI home; scanning is legacy-only.
    return null
  }
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(args.sessionId)) {
    return null
  }

  const listSessionFiles =
    args.listSessionFiles ??
    ((sessionsRoot: string) =>
      listCodexSessionRolloutFilesIncrementally(sessionsRoot, { batchSize: 64, yieldMs: 0 }))
  const expectedSuffix = `-${args.sessionId}.jsonl`.toLowerCase()
  const seenHomes = new Set<string>()
  for (const homePath of rankTrustedCodexHomesForRescan(args)) {
    const comparisonHome = normalizeRuntimePathForComparison(homePath)
    if (seenHomes.has(comparisonHome)) {
      continue
    }
    seenHomes.add(comparisonHome)
    const sessionsRoot = join(homePath, 'sessions')
    if (
      !args.listSessionFiles &&
      !sessionsTreeIsPresent(sessionsRoot)
    ) {
      continue
    }
    for await (const filePath of listSessionFiles(sessionsRoot)) {
      const plainFilePath = filePath.endsWith('.jsonl.zst')
        ? filePath.slice(0, -'.zst'.length)
        : filePath
      // Why: the directory entry already proves the compressed file exists; only probe its preferred plain sibling.
      const preferredFilePath =
        plainFilePath !== filePath && (args.fileIsRegular ?? isRegularFile)(plainFilePath)
          ? plainFilePath
          : filePath
      const plainFileName = getRuntimePathBasename(preferredFilePath)
        .toLowerCase()
        .replace(/\.zst$/, '')
      if (
        isCodexRolloutInsideSessionsRoot(sessionsRoot, preferredFilePath) &&
        plainFileName.endsWith(expectedSuffix)
      ) {
        return { homePath, transcriptPath: preferredFilePath }
      }
    }
  }
  return null
}
