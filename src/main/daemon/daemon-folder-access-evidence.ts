import { enumerateDirectoryOnce } from './directory-enumeration-probe'
import {
  clearDaemonFolderAccessMismatch,
  recordDaemonFolderAccessMismatch
} from './daemon-folder-access-mismatch'
import type { DaemonEndpointIdentity } from './daemon-hello-protocol'

export async function hasDaemonPtyCwdDenialDiverged(
  cwd: string | undefined,
  cwdReadableByDaemon: boolean | undefined
): Promise<boolean> {
  try {
    if (process.platform !== 'darwin' || !cwd || cwdReadableByDaemon !== false) {
      return false
    }
    return (await enumerateDirectoryOnce(cwd)) === 'ok'
  } catch {
    return false
  }
}

export async function recordDaemonPtyCwdEvidence(args: {
  cwd: string | undefined
  cwdReadableByDaemon: boolean | undefined
  daemonIdentity: DaemonEndpointIdentity | null
}): Promise<void> {
  try {
    const { cwd } = args
    if (!cwd) {
      return
    }
    if (args.cwdReadableByDaemon === true) {
      clearDaemonFolderAccessMismatch(args.daemonIdentity, cwd)
      return
    }
    if (await hasDaemonPtyCwdDenialDiverged(cwd, args.cwdReadableByDaemon)) {
      recordDaemonFolderAccessMismatch(args.daemonIdentity, cwd)
    }
  } catch {
    // Best-effort evidence must never fail a terminal spawn.
  }
}
