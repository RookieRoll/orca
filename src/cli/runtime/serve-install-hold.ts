import { existsSync, statSync } from 'node:fs'

export type ServeInstallEvidence =
  | { kind: 'clear' }
  | {
      kind: 'hold'
      reason: 'bundle-missing'
    }

export const SERVE_INSTALL_HOLD_REASON_TEXT: Record<
  Extract<ServeInstallEvidence, { kind: 'hold' }>['reason'],
  string
> = {
  'bundle-missing': 'the Orca executable is missing, likely mid-install'
}

/**
 * Whether a supervised serve may spawn from `executable` right now. Never spawn from a bundle an
 * installer is swapping: the child would run half-old, half-new code or be killed mid-start.
 */
export async function readServeInstallEvidence(executable: string): Promise<ServeInstallEvidence> {
  return existsSync(executable) ? { kind: 'clear' } : { kind: 'hold', reason: 'bundle-missing' }
}

/**
 * Changes whenever the installed app does, so a new build starts with a clean restart count. The
 * app archive is included because Linux releases on one Electron version share the launcher binary.
 */
export function serveBuildIdentity(executable: string, appRoot?: string): string {
  return [executable, ...(appRoot ? [appRoot] : [])]
    .map((path) => {
      try {
        const stat = statSync(path)
        return `${stat.size}:${Math.trunc(stat.mtimeMs)}`
      } catch {
        return 'missing'
      }
    })
    .join('|')
}
