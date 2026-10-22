import { normalizeRuntimePathForComparison } from '../../../../shared/cross-platform-path'
import type { CodexAccountSelectionTarget } from '../../../codex-accounts/runtime-selection'
import { getSystemCodexHomePath } from '../../../codex/codex-home-paths'
import {
  hasCustomCodexHomeOverrideForLaunch,
  resolveExplicitCustomCodexHomeForLaunch
} from '../../../codex/codex-real-home-path'
import {
  forgetCodexPtyLaunchHome,
  recordCodexPtyLaunchHome
} from '../../../codex/codex-pane-account-registry'
import { isHostCodexHomeForWsl, isWslCodexHomeForHost } from '../../../pty/codex-home-wsl-env'
import { isWslShellName } from '../../../../shared/local-windows-terminal-runtime'
import { parseWslPath } from '../../../wsl'

export function shouldSkipCodexHomeEnvForWindowsShell(
  shellPath: string | undefined,
  cwd: string | undefined
): boolean {
  return isWslShellName(shellPath) || (typeof cwd === 'string' && parseWslPath(cwd) !== null)
}

// Why: a host default launch uses the user's ~/.codex. Strip only a nested
// Orca-inherited override instead of injecting an explicit home.
export function shouldStripInheritedOrcaCodexHome(args: {
  target: CodexAccountSelectionTarget
  selectedCodexHomePath: string | null
  skipCodexHomeEnv: boolean
}): boolean {
  return (
    args.target.runtime === 'host' && args.selectedCodexHomePath === null && !args.skipCodexHomeEnv
  )
}

export const CODEX_HOME_ENV_KEYS = ['CODEX_HOME', 'ORCA_CODEX_HOME'] as const

// Why: host default routing runs Codex on the user's own ~/.codex.
// Nested Orca panes inherit the parent's Orca-owned override; strip only that
// (CODEX_HOME matching Orca's private ORCA_CODEX_HOME marker), and always drop
// the marker so a shell-ready wrapper cannot restore that override. A
// user-set CODEX_HOME with no Orca marker is preserved untouched (see #8606).
export function stripInheritedOrcaCodexHomeOverride(baseEnv: Record<string, string>): void {
  for (const key of getLocalOrcaCodexHomeEnvKeysToDelete(baseEnv)) {
    delete baseEnv[key]
  }
}

// Why: in-process spawns share main's inherited environment, so equality with
// the private marker is authoritative here. Persistent daemons compare locally.
export function getLocalOrcaCodexHomeEnvKeysToDelete(env: Record<string, string>): string[] {
  const inheritedOrcaOverride = env.ORCA_CODEX_HOME ?? process.env.ORCA_CODEX_HOME
  const inheritedCodexHome = env.CODEX_HOME ?? process.env.CODEX_HOME
  const keysToDelete = ['ORCA_CODEX_HOME']
  if (inheritedOrcaOverride && inheritedCodexHome === inheritedOrcaOverride) {
    keysToDelete.push('CODEX_HOME')
  }
  return keysToDelete
}

export function getCodexSelectionTargetForPty(
  shellPath: string | undefined,
  cwd: string | undefined,
  wslDistro?: string | null
): CodexAccountSelectionTarget {
  const wslPath = typeof cwd === 'string' ? parseWslPath(cwd) : null
  if (isWslShellName(shellPath) || wslPath) {
    return { runtime: 'wsl', wslDistro: wslPath?.distro ?? wslDistro ?? null }
  }
  return { runtime: 'host' }
}

export function getCompatibleSelectedCodexHomePath(
  target: CodexAccountSelectionTarget,
  selectedCodexHomePath: string | null
): string | null {
  if (!selectedCodexHomePath) {
    return null
  }
  const wslInfo = parseWslPath(selectedCodexHomePath)
  if (target.runtime === 'wsl') {
    return wslInfo || !isHostCodexHomeForWsl(selectedCodexHomePath) ? selectedCodexHomePath : null
  }
  return wslInfo || (process.platform === 'win32' && isWslCodexHomeForHost(selectedCodexHomePath))
    ? null
    : selectedCodexHomePath
}

export function codexHomeSelectionsEqual(left: string | null, right: string | null): boolean {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      normalizeRuntimePathForComparison(left) === normalizeRuntimePathForComparison(right))
  )
}

export function recordCodexPtyLaunchHomeForSpawn(args: {
  ptyId: string
  isReattach: boolean
  target: CodexAccountSelectionTarget
  selectedCodexHomePath: string | null
  skipCodexHomeEnv: boolean
  launchEnv?: NodeJS.ProcessEnv
}): void {
  if (args.isReattach) return
  const explicitHome = args.skipCodexHomeEnv
    ? null
    : getCompatibleSelectedCodexHomePath(
        args.target,
        resolveExplicitCustomCodexHomeForLaunch(args.launchEnv)
      )
  const homePath =
    args.selectedCodexHomePath ??
    explicitHome ??
    (args.target.runtime === 'host' &&
    !args.skipCodexHomeEnv &&
    !hasCustomCodexHomeOverrideForLaunch(args.launchEnv)
      ? getSystemCodexHomePath()
      : null)
  if (homePath) recordCodexPtyLaunchHome?.(args.ptyId, homePath)
  else forgetCodexPtyLaunchHome?.(args.ptyId)
}
