import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { enumerateDirectoryMock } = vi.hoisted(() => ({ enumerateDirectoryMock: vi.fn() }))
vi.mock('./directory-enumeration-probe', () => ({
  enumerateDirectoryOnce: enumerateDirectoryMock
}))

import type { DaemonEndpointIdentity } from './daemon-hello-protocol'
import {
  getDaemonFolderAccessMismatch,
  recordDaemonFolderAccessMismatch,
  resetDaemonFolderAccessMismatchForTests
} from './daemon-folder-access-mismatch'
import {
  hasDaemonPtyCwdDenialDiverged,
  recordDaemonPtyCwdEvidence
} from './daemon-folder-access-evidence'

const DAEMON: DaemonEndpointIdentity = { pid: 1530, startedAtMs: 1_700_000, launchNonce: 'n1' }
const DOCUMENTS = '/Users/alice/Documents/repo'

beforeEach(() => {
  resetDaemonFolderAccessMismatchForTests()
  enumerateDirectoryMock.mockReset().mockResolvedValue('ok')
  vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('daemon PTY folder-access evidence', () => {
  it('checks for divergence only after a daemon was denied its cwd', async () => {
    await expect(hasDaemonPtyCwdDenialDiverged(DOCUMENTS, false)).resolves.toBe(true)
    expect(enumerateDirectoryMock).toHaveBeenCalledWith(DOCUMENTS)

    enumerateDirectoryMock.mockClear()
    await expect(hasDaemonPtyCwdDenialDiverged(DOCUMENTS, true)).resolves.toBe(false)
    await expect(hasDaemonPtyCwdDenialDiverged(undefined, false)).resolves.toBe(false)
    expect(enumerateDirectoryMock).not.toHaveBeenCalled()
  })

  it('records a local notice when the app can read a daemon-denied cwd', async () => {
    await recordDaemonPtyCwdEvidence({
      cwd: DOCUMENTS,
      cwdReadableByDaemon: false,
      daemonIdentity: DAEMON
    })

    expect(getDaemonFolderAccessMismatch(DAEMON)).toMatchObject({
      cwdClass: 'documents',
      freshDaemonAccess: 'unknown'
    })
  })

  it('retires the local notice when the same daemon can read the same folder class', async () => {
    recordDaemonFolderAccessMismatch(DAEMON, DOCUMENTS)

    await recordDaemonPtyCwdEvidence({
      cwd: '/Users/alice/Documents/another-repo',
      cwdReadableByDaemon: true,
      daemonIdentity: DAEMON
    })

    expect(getDaemonFolderAccessMismatch(DAEMON)).toBeNull()
  })

  it('keeps a denial when the app cannot confirm access and never fails the caller', async () => {
    enumerateDirectoryMock.mockRejectedValue(new Error('EACCES'))

    await expect(
      recordDaemonPtyCwdEvidence({
        cwd: DOCUMENTS,
        cwdReadableByDaemon: false,
        daemonIdentity: DAEMON
      })
    ).resolves.toBeUndefined()

    expect(getDaemonFolderAccessMismatch(DAEMON)).toBeNull()
  })
})
