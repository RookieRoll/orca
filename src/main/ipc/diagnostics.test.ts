import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CollectedBundle } from '../observability/bundle'
import type * as NodeFs from 'node:fs'

const handlers = new Map<string, (_event: unknown, ...args: unknown[]) => unknown>()

const { handleMock, mkdirSyncMock, writeFileSyncMock, openPathMock, collectMock, statusMock } =
  vi.hoisted(() => ({
    handleMock: vi.fn(),
    mkdirSyncMock: vi.fn(),
    writeFileSyncMock: vi.fn(),
    openPathMock: vi.fn(),
    collectMock: vi.fn(),
    statusMock: vi.fn()
  }))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof NodeFs>('node:fs')
  return { ...actual, mkdirSync: mkdirSyncMock, writeFileSync: writeFileSyncMock }
})

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp', getVersion: () => '1.2.3-test' },
  ipcMain: { handle: handleMock },
  shell: { openPath: openPathMock }
}))

vi.mock('../observability', () => ({
  collectDiagnosticBundle: collectMock,
  getDiagnosticsStatus: statusMock
}))

import { registerDiagnosticsHandlers } from './diagnostics'

function captureHandlers(): void {
  handlers.clear()
  for (const [channel, handler] of handleMock.mock.calls) {
    handlers.set(channel, handler)
  }
}

function makeBundle(overrides: Partial<CollectedBundle> = {}): CollectedBundle {
  return {
    bundleSubmissionId: 'abcdefghijklmnopqrstuv',
    payload: '{"type":"bundle-header"}\n',
    bytes: 25,
    spanCount: 0,
    ...overrides
  }
}

describe('local diagnostics IPC handlers', () => {
  beforeEach(() => {
    handleMock.mockReset()
    mkdirSyncMock.mockReset()
    writeFileSyncMock.mockReset()
    openPathMock.mockReset().mockResolvedValue('')
    collectMock.mockReset().mockReturnValue(makeBundle())
    statusMock.mockReset().mockReturnValue({
      localFileEnabled: true,
      bundleEnabled: true,
      traceFilePath: '/tmp/main.trace.ndjson',
      traceFamilySize: 0
    })
    registerDiagnosticsHandlers()
    captureHandlers()
  })

  it('requires the existing diagnostics consent before collecting a local bundle', () => {
    statusMock.mockReturnValue({ localFileEnabled: true, bundleEnabled: false })
    expect(() => handlers.get('diagnostics:collectBundle')?.({}, 30)).toThrow(/disabled/)
    expect(collectMock).not.toHaveBeenCalled()
  })

  it('returns metadata while retaining payload bytes in main', async () => {
    const bundle = makeBundle({
      bundleSubmissionId: 'bundleabcdefghijklmnop',
      payload: '{"secret":"retained in main"}\n',
      bytes: 37,
      spanCount: 1
    })
    collectMock.mockReturnValue(bundle)

    const preview = await handlers.get('diagnostics:collectBundle')?.({}, 30)

    expect(preview).toEqual({
      bundleSubmissionId: bundle.bundleSubmissionId,
      bytes: bundle.bytes,
      spanCount: bundle.spanCount
    })
    expect(JSON.stringify(preview)).not.toContain('retained in main')
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(`${bundle.bundleSubmissionId}.ndjson`),
      bundle.payload,
      { encoding: 'utf8', mode: 0o600 }
    )
  })

  it('opens a retained preview file through the operating system', async () => {
    const bundle = makeBundle({ bundleSubmissionId: 'bundleabcdefghijklmnop' })
    collectMock.mockReturnValue(bundle)

    await handlers.get('diagnostics:collectBundle')?.({}, 30)
    await handlers.get('diagnostics:openBundlePreview')?.({}, bundle.bundleSubmissionId)

    expect(openPathMock).toHaveBeenCalledWith(
      expect.stringContaining(`${bundle.bundleSubmissionId}.ndjson`)
    )
  })

  it('discards a retained preview and rejects opening it afterwards', async () => {
    const bundle = makeBundle({ bundleSubmissionId: 'bundleabcdefghijklmnop' })
    collectMock.mockReturnValue(bundle)

    await handlers.get('diagnostics:collectBundle')?.({}, 30)
    await handlers.get('diagnostics:discardBundlePreview')?.({}, bundle.bundleSubmissionId)

    await expect(
      handlers.get('diagnostics:openBundlePreview')?.({}, bundle.bundleSubmissionId)
    ).rejects.toThrow(/expired/)
  })

  it('expires retained previews after their bounded local lifetime', async () => {
    vi.useFakeTimers()
    try {
      const bundle = makeBundle({ bundleSubmissionId: 'bundleabcdefghijklmnop' })
      collectMock.mockReturnValue(bundle)
      await handlers.get('diagnostics:collectBundle')?.({}, 30)
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000 + 1)
      await expect(
        handlers.get('diagnostics:openBundlePreview')?.({}, bundle.bundleSubmissionId)
      ).rejects.toThrow(/expired/)
    } finally {
      vi.useRealTimers()
    }
  })
})
